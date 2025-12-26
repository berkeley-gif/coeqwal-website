/**
 * Hook for fetching tier location data from the API
 *
 * Responsibilities:
 * - Fetch tier data from COEQWAL API
 * - Cache responses to avoid duplicate requests
 * - Provide loading/error states
 * - Build lookup maps for tier levels and location info
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { STRATEGY_TO_SCENARIO_ID } from "../../../lib/constants/outcomeMappings"

// API base URL
const API_BASE = "https://api.coeqwal.org/api"

// GeoJSON response type (for single-feature outcomes)
interface GeoJSONResponse {
  type: "FeatureCollection"
  features: Array<{
    properties: {
      location_id: string
      tier_level: number
      tier_value?: number
    }
  }>
  metadata?: {
    tier_type?: "single_value" | "multi_value"
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface TierLocation {
  location_id: string
  location_name: string
  location_type: string
  tier_level: number
  tier_value: number | null
  display_order: number
}

export interface TierLocationsResponse {
  scenario: string
  tier_code: string
  tier_name: string
  tier_type: "single_value" | "multi_value"
  locations: TierLocation[]
  metadata: {
    total_locations: number
    location_types: string[]
    tier_counts: Record<string, number>
  }
}

export interface TierDataResult {
  /** Raw API response */
  response: TierLocationsResponse | null
  /** Lookup: feature ID -> tier level */
  tierLookup: Record<string, number>
  /** Lookup: feature ID -> full location data */
  locationData: Record<string, TierLocation>
  /** List of feature IDs with tier data */
  featureIds: string[]
  /** Number of features */
  featureCount: number
  /** Loading state */
  isLoading: boolean
  /** Error message if fetch failed */
  error: string | null
}

// ============================================================================
// CACHE
// ============================================================================

// Module-level cache for tier location data
const tierLocationCache = new Map<string, TierLocationsResponse>()

/**
 * Fetch tier locations with caching
 * Falls back to GeoJSON endpoint if /locations returns no data (for single-feature outcomes)
 */
export async function fetchTierLocations(
  scenarioId: string,
  tierCode: string,
): Promise<TierLocationsResponse> {
  const cacheKey = `${scenarioId}-${tierCode}`

  // Check cache first
  const cached = tierLocationCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Try the /locations endpoint first
  const locationsUrl = `${API_BASE}/tier-map/${scenarioId}/${tierCode}/locations`
  const locationsResponse = await fetch(locationsUrl)

  if (locationsResponse.ok) {
    const data = await locationsResponse.json()
    // If we got locations, use them
    if (data.locations && data.locations.length > 0) {
      tierLocationCache.set(cacheKey, data)
      return data
    }
  }

  // Fallback: fetch GeoJSON and extract tier data from features
  // This handles single-feature outcomes like Delta, Salmon, etc.
  const geojsonUrl = `${API_BASE}/tier-map/${scenarioId}/${tierCode}`
  const geojsonResponse = await fetch(geojsonUrl)

  if (!geojsonResponse.ok) {
    const errorData = await geojsonResponse.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Failed to fetch tier data: ${geojsonResponse.status}`,
    )
  }

  const geojsonData: GeoJSONResponse = await geojsonResponse.json()

  // Convert GeoJSON features to locations format
  const locations: TierLocation[] = geojsonData.features.map((feature, idx) => ({
    location_id: feature.properties.location_id || `feature-${idx}`,
    location_name: feature.properties.location_id || tierCode,
    location_type: "geojson",
    tier_level: feature.properties.tier_level,
    tier_value: feature.properties.tier_value ?? null,
    display_order: idx,
  }))

  const result: TierLocationsResponse = {
    scenario: scenarioId,
    tier_code: tierCode,
    tier_name: tierCode,
    tier_type: geojsonData.metadata?.tier_type || "single_value",
    locations,
    metadata: {
      total_locations: locations.length,
      location_types: ["geojson"],
      tier_counts: {},
    },
  }

  tierLocationCache.set(cacheKey, result)
  return result
}

// ============================================================================
// HOOK
// ============================================================================

interface UseTierDataFetchProps {
  /** Strategy value (e.g., "current-ops") */
  strategy: string
  /** Tier code from config (e.g., "CWS_DEL") */
  tierCode: string | null
  /** Whether to enable fetching */
  enabled: boolean
}

/**
 * Hook to fetch and cache tier location data
 *
 * Returns lookup maps that can be used by other hooks for styling and tooltips.
 */
export function useTierDataFetch({
  strategy,
  tierCode,
  enabled,
}: UseTierDataFetchProps): TierDataResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<TierLocationsResponse | null>(null)

  // Store lookups in refs for stable access
  const tierLookupRef = useRef<Record<string, number>>({})
  const locationDataRef = useRef<Record<string, TierLocation>>({})
  const featureIdsRef = useRef<string[]>([])

  // Reset refs when dependencies change
  const resetRefs = useCallback(() => {
    tierLookupRef.current = {}
    locationDataRef.current = {}
    featureIdsRef.current = []
  }, [])

  useEffect(() => {
    // Clear if not enabled or no tier code
    if (!enabled || !tierCode) {
      resetRefs()
      setResponse(null)
      setError(null)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        // Get scenario ID from strategy
        const scenarioId = STRATEGY_TO_SCENARIO_ID[strategy]
        if (!scenarioId) {
          throw new Error(`Unknown strategy: ${strategy}`)
        }

        // tierCode is guaranteed non-null here due to early return above
        // Fetch tier locations from API
        const data = await fetchTierLocations(scenarioId, tierCode!)

        if (cancelled) return

        // Build lookup maps
        const tierLookup: Record<string, number> = {}
        const locationData: Record<string, TierLocation> = {}

        data.locations.forEach((location) => {
          tierLookup[location.location_id] = location.tier_level
          locationData[location.location_id] = location
        })

        // Update refs
        tierLookupRef.current = tierLookup
        locationDataRef.current = locationData
        featureIdsRef.current = Object.keys(tierLookup)

        setResponse(data)
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching tier data:", err)
          setError(
            err instanceof Error ? err.message : "Failed to fetch tier data",
          )
          resetRefs()
          setResponse(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [strategy, tierCode, enabled, resetRefs])

  return {
    response,
    tierLookup: tierLookupRef.current,
    locationData: locationDataRef.current,
    featureIds: featureIdsRef.current,
    featureCount: featureIdsRef.current.length,
    isLoading,
    error,
  }
}
