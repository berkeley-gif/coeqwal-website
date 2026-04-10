"use client"

/**
 * useTierData - Fetch and transform tier data for visualization
 *
 * Returns tierColorMap (featureId -> hex color) ready for use with layer components.
 * Handles caching, loading states, and color computation internally.
 *
 * For single-value outcomes (Salmon, Delta), uses SWR with the same cache key as
 * the glyphs, so data is shared and not fetched twice.
 *
 * Usage:
 * ```tsx
 * const { tierColorMap, isLoading, error } = useTierData("RES_STOR", "s0020")
 *
 * <OutcomePolygonLayer tierColorMap={tierColorMap} ... />
 * ```
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useTheme } from "@repo/ui/mui"
import useSWR from "swr"
import {
  getTierColorsFromTheme,
  type TierLevel,
} from "../../../../content/tiers"
import {
  fetchScenarioTiers,
  type ScenarioTiersResponse,
} from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import { getOutcomeConfig } from "../../config/outcomeLayerRegistry"
import { getOutcomeName } from "../../../../content/outcomes"
import { API_BASE } from "../../../../lib/constants/api"
import type {
  TierColorMap,
  TierLevelMap,
  TierLocation,
  TierLocationsResponse,
} from "../types"

// ============================================================================
// CACHE
// ============================================================================

// Module-level cache for tier location data
const tierLocationCache = new Map<string, TierLocationsResponse>()

/** Synchronous cache probe — returns cached data or null. */
export function peekTierLocationCache(
  scenarioId: string,
  tierCode: string,
): TierLocationsResponse | null {
  return tierLocationCache.get(`${scenarioId}-${tierCode}`) ?? null
}

/**
 * Fetch tier locations with caching
 *
 * Uses the /locations endpoint which returns tier data without geometry.
 * This is much more efficient than the GeoJSON endpoint for polygon features
 * (e.g., reservoirs: 1KB vs 2MB, groundwater: 5KB vs 2.7MB).
 */
async function fetchTierLocations(
  scenarioId: string,
  tierCode: string,
): Promise<TierLocationsResponse> {
  const cacheKey = `${scenarioId}-${tierCode}`

  // Check cache first
  const cached = tierLocationCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const url = `${API_BASE}/tier-map/${scenarioId}/${tierCode}/locations`
  const response = await fetch(url)

  if (!response.ok) {
    // 404 means no tier data exists for this scenario/outcome combo — return
    // an empty result instead of throwing so the map simply shows nothing.
    if (response.status === 404) {
      const empty: TierLocationsResponse = {
        scenario: scenarioId,
        tier_code: tierCode,
        tier_name: tierCode,
        tier_type: "multi_value",
        locations: [],
        metadata: { total_locations: 0, location_types: [], tier_counts: {} },
      }
      tierLocationCache.set(cacheKey, empty)
      return empty
    }

    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Failed to fetch tier data: ${response.status}`,
    )
  }

  const data: TierLocationsResponse = await response.json()
  tierLocationCache.set(cacheKey, data)
  return data
}

/**
 * Convert SWR scenario data to TierLocationsResponse for single-value outcomes
 */
function convertScenarioTierToLocations(
  scenarioData: ScenarioTiersResponse,
  outcomeCode: string,
): TierLocationsResponse | null {
  const tierInfo = scenarioData.tiers[outcomeCode]

  if (
    !tierInfo ||
    tierInfo.type !== "single_value" ||
    tierInfo.level === undefined
  ) {
    return null
  }

  const location: TierLocation = {
    location_id: outcomeCode,
    location_name: getOutcomeName(outcomeCode),
    location_type: "single_value",
    tier_level: tierInfo.level,
    tier_value: null,
    display_order: 0,
  }

  return {
    scenario: scenarioData.scenario,
    tier_code: outcomeCode,
    tier_name: tierInfo.name,
    tier_type: "single_value",
    locations: [location],
    metadata: {
      total_locations: 1,
      location_types: ["single_value"],
      tier_counts: { [tierInfo.level]: 1 },
    },
  }
}

// ============================================================================
// HOOK RESULT TYPE
// ============================================================================

export interface UseTierDataResult {
  /** Map from feature ID to hex color (ready for layer components) */
  tierColorMap: TierColorMap
  /** Map from feature ID to tier level  */
  tierLevelMap: TierLevelMap
  /** Map from feature ID to full location data */
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
// HOOK
// ============================================================================

/**
 * Hook to fetch tier data and compute colors
 *
 * For single-value outcomes (Salmon, Delta), uses SWR with the same cache key
 * as the glyphs (/api/tiers/scenarios/{id}/tiers), so data is shared.
 *
 * For multi-value outcomes, uses the /tier-map/ endpoint which provides
 * location-specific tier data.
 *
 * @param outcomeCode - Outcome code (e.g., "RES_STOR")
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Tier data with pre-computed colors ready for visualization
 */
export function useTierData(
  outcomeCode: string | null,
  scenarioId: string,
): UseTierDataResult {
  const theme = useTheme()
  const [multiValueLoading, setMultiValueLoading] = useState(false)
  const [multiValueError, setMultiValueError] = useState<string | null>(null)
  const [, setMultiValueResponse] = useState<TierLocationsResponse | null>(null)

  // Get tier colors from theme
  const tierColors = useMemo(() => getTierColorsFromTheme(theme), [theme])

  // Get config for this outcome
  const config = useMemo(
    () => (outcomeCode ? getOutcomeConfig(outcomeCode) : null),
    [outcomeCode],
  )

  // Determine if this is a single-value outcome (uses shared SWR cache)
  const isSingleValue = config && !config.requiresIdMatching

  // ============================================================================
  // SWR for single-value outcomes (shares cache with glyphs)
  // ============================================================================
  // Uses the same cache key as glyphs: CACHE_KEYS.scenarioTiers(id)
  const {
    data: scenarioTiersData,
    error: swrError,
    isLoading: swrLoading,
  } = useSWR(
    // Only fetch if this is a single-value outcome with valid scenarioId
    isSingleValue && scenarioId ? CACHE_KEYS.scenarioTiers(scenarioId) : null,
    () => fetchScenarioTiers(scenarioId!),
  )

  // Convert SWR data to TierLocationsResponse format for single-value outcomes
  const singleValueResponse = useMemo(() => {
    if (!isSingleValue || !scenarioTiersData || !config || !outcomeCode) {
      return null
    }
    return convertScenarioTierToLocations(scenarioTiersData, outcomeCode)
  }, [isSingleValue, scenarioTiersData, config, outcomeCode])

  // ============================================================================
  // Manual fetch for multi-value outcomes (uses /tier-map/ endpoint)
  // ============================================================================
  // Track previous values to detect changes and clear stale data synchronously
  const prevOutcomeCodeRef = useRef<string | null>(null)
  const prevScenarioIdRef = useRef<string>(scenarioId)

  // Store computed data in refs for stable access
  const tierLevelMapRef = useRef<TierLevelMap>({})
  const locationDataRef = useRef<Record<string, TierLocation>>({})
  const featureIdsRef = useRef<string[]>([])

  // When outcome or scenarioId changes, synchronously replace stale refs.
  // If the new data is already in the module-level cache (e.g. prefetched
  // for another hydroclimate), swap it in immediately so the map never
  // renders an empty frame. Otherwise clear to empty to prevent the wrong
  // scenario's colors from flashing.
  if (
    outcomeCode !== prevOutcomeCodeRef.current ||
    scenarioId !== prevScenarioIdRef.current
  ) {
    const cachedForNew =
      outcomeCode && config && !isSingleValue
        ? peekTierLocationCache(scenarioId, config.tierCode)
        : null

    if (cachedForNew && cachedForNew.locations.length > 0) {
      const nextTierLevel: TierLevelMap = {}
      const nextLocation: Record<string, TierLocation> = {}
      cachedForNew.locations.forEach((loc) => {
        nextTierLevel[loc.location_id] = loc.tier_level as TierLevel
        nextLocation[loc.location_id] = loc
      })
      tierLevelMapRef.current = nextTierLevel
      locationDataRef.current = nextLocation
      featureIdsRef.current = Object.keys(nextTierLevel)
    } else {
      tierLevelMapRef.current = {}
      locationDataRef.current = {}
      featureIdsRef.current = []
    }

    prevOutcomeCodeRef.current = outcomeCode
    prevScenarioIdRef.current = scenarioId
  }

  // Reset function
  const reset = useCallback(() => {
    tierLevelMapRef.current = {}
    locationDataRef.current = {}
    featureIdsRef.current = []
  }, [])

  // Fetch multi-value data
  useEffect(() => {
    // Skip if no outcome, no config, or this is a single-value outcome (handled by SWR)
    if (!outcomeCode || !config || isSingleValue) {
      if (!isSingleValue) {
        reset()
        setMultiValueResponse(null)
        setMultiValueError(null)
      }
      return
    }

    if (!scenarioId) {
      reset()
      setMultiValueResponse(null)
      setMultiValueError(`Unknown scenarioId: ${scenarioId}`)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setMultiValueLoading(true)
        setMultiValueError(null)

        const data = await fetchTierLocations(scenarioId!, config!.tierCode)

        if (cancelled) return

        // Build lookup maps
        const tierLevelMap: TierLevelMap = {}
        const locationData: Record<string, TierLocation> = {}

        data.locations.forEach((location) => {
          tierLevelMap[location.location_id] = location.tier_level as TierLevel
          locationData[location.location_id] = location
        })

        // Update refs
        tierLevelMapRef.current = tierLevelMap
        locationDataRef.current = locationData
        featureIdsRef.current = Object.keys(tierLevelMap)

        setMultiValueResponse(data)
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching tier data:", err)
          setMultiValueError(
            err instanceof Error ? err.message : "Failed to fetch tier data",
          )
          reset()
          setMultiValueResponse(null)
        }
      } finally {
        if (!cancelled) {
          setMultiValueLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [outcomeCode, scenarioId, config, isSingleValue, reset])

  // ============================================================================
  // Unified output
  // ============================================================================
  const isLoading = isSingleValue ? swrLoading : multiValueLoading
  const error = isSingleValue
    ? swrError
      ? swrError.message
      : singleValueResponse === null && scenarioTiersData
        ? `No tier data for ${config?.tierCode}`
        : null
    : multiValueError

  // Compute derived values for single-value outcomes directly (NOT in effect)
  // This ensures values are available in the same render cycle as SWR data
  const singleValueDerived = useMemo(() => {
    if (!isSingleValue || !singleValueResponse) {
      return { tierLevelMap: {}, locationData: {}, featureIds: [] as string[] }
    }

    const tierLevelMap: TierLevelMap = {}
    const locationData: Record<string, TierLocation> = {}

    singleValueResponse.locations.forEach((location) => {
      tierLevelMap[location.location_id] = location.tier_level as TierLevel
      locationData[location.location_id] = location
    })

    return {
      tierLevelMap,
      locationData,
      featureIds: Object.keys(tierLevelMap),
    }
  }, [isSingleValue, singleValueResponse])

  // For single-value: use computed values; for multi-value: use refs (populated by effect)
  const finalTierLevelMap = isSingleValue
    ? singleValueDerived.tierLevelMap
    : tierLevelMapRef.current
  const finalLocationData = isSingleValue
    ? singleValueDerived.locationData
    : locationDataRef.current
  const finalFeatureIds = isSingleValue
    ? singleValueDerived.featureIds
    : featureIdsRef.current

  // Compute tierColorMap from tierLevelMap
  const tierColorMap = useMemo(() => {
    const colorMap: TierColorMap = {}
    Object.entries(finalTierLevelMap).forEach(([featureId, tierLevel]) => {
      colorMap[featureId] = tierColors[tierLevel] || "#888888"
    })
    return colorMap
  }, [tierColors, finalTierLevelMap])

  return {
    tierColorMap,
    tierLevelMap: finalTierLevelMap,
    locationData: finalLocationData,
    featureIds: finalFeatureIds,
    featureCount: finalFeatureIds.length,
    isLoading,
    error,
  }
}

// Re-export the fetch function for direct use (e.g., in SummaryPanel)
export { fetchTierLocations }
