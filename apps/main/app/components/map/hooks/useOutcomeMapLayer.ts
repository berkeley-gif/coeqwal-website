/**
 * Hook for displaying outcome data on demand unit polygons
 *
 * This hook:
 * 1. Uses the existing Mapbox layer "demand-units"
 * 2. Fetches tier location data from the API
 * 3. Filters the layer by Class (Urban, Agriculture, etc.)
 * 4. Colors polygons by matching DU_ID to tier data
 *
 * Used for outcomes that map to demand units:
 * - Community deliveries (Class=Urban)
 * - Agricultural revenue (Class=Agriculture)
 */

import { useEffect, useState, useMemo, useCallback } from "react"
import { useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapInstance = any
import {
  STRATEGY_TO_SCENARIO_ID,
  getShortCodeFromDisplayName,
} from "../../../constants/outcomeMappings"

// Mapbox expression type (simplified for our use case)
type MapboxExpression = ["match", ["get", string], ...unknown[]]

// The Mapbox layer IDs for demand units
const DEMAND_UNITS_LAYER_ID = "demand-units"
const DEMAND_UNITS_OUTLINE_ID = "demand-units-outline"
const BASEMAP_DIM_LAYER_ID = "basemap-dim-overlay"

// Dimming overlay opacity (0 = no dim, 1 = full black)
const BASEMAP_DIM_OPACITY = 0.35

// API base URL
const API_BASE = "https://api.coeqwal.org/api"

// Types
interface TierLocation {
  location_id: string
  location_name: string
  location_type: string
  tier_level: number
  tier_value: number | null
  display_order: number
}

interface TierLocationsResponse {
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

interface OutcomeLayerConfig {
  /** Filter demand units by Class */
  classFilter: "Agriculture" | "Urban" | "Refuge" | "N/A" | null
  /** API short code for tier data */
  tierCode: string
}

/**
 * Configuration for each outcome type
 */
export const OUTCOME_LAYER_CONFIG: Record<string, OutcomeLayerConfig> = {
  "Community deliveries": {
    classFilter: "Urban",
    tierCode: "CWS_DEL",
  },
  "Agricultural revenue": {
    classFilter: "Agriculture",
    tierCode: "AG_REV",
  },
  // Add more outcomes as needed
}

// Cache for tier location data
const tierLocationCache: Map<string, TierLocationsResponse> = new Map()

/**
 * Fetch tier locations with caching
 */
async function fetchTierLocations(
  scenarioId: string,
  tierCode: string
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
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Failed to fetch tier locations: ${response.status}`
    )
  }

  const data = await response.json()

  // Store in cache
  tierLocationCache.set(cacheKey, data)

  return data
}

interface UseOutcomeMapLayerProps {
  /** The outcome display name (e.g., "Community deliveries") */
  outcome: string | null
  /** The strategy value (e.g., "current-ops") */
  strategy: string
  /** Whether to show the layer */
  visible: boolean
}

interface UseOutcomeMapLayerResult {
  isLoading: boolean
  error: string | null
  featureCount: number
  /** Clear the layer styling */
  clear: () => void
}

/**
 * Hook to display outcome data on the calsim-demand-units Mapbox layer
 */
export function useOutcomeMapLayer({
  outcome,
  strategy,
  visible,
}: UseOutcomeMapLayerProps): UseOutcomeMapLayerResult {
  const theme = useTheme()
  const mapAPI = useMap()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [featureCount, setFeatureCount] = useState(0)

  // Get config for this outcome
  const config = outcome ? OUTCOME_LAYER_CONFIG[outcome] : null

  // Tier colors
  const tierColors = useMemo(
    () => ({
      1: theme.palette.tiers.tier1,
      2: theme.palette.tiers.tier2,
      3: theme.palette.tiers.tier3,
      4: theme.palette.tiers.tier4,
    }),
    [theme]
  )

  // Fade the basemap dim layer
  const fadeBasemapDim = useCallback(
    (map: MapInstance, fadeIn: boolean, duration: number = 500) => {
      // Create the dim layer if it doesn't exist
      if (!map.getLayer(BASEMAP_DIM_LAYER_ID)) {
        // Add a worldwide polygon as a background dim
        if (!map.getSource(BASEMAP_DIM_LAYER_ID)) {
          map.addSource(BASEMAP_DIM_LAYER_ID, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [-180, -90],
                    [180, -90],
                    [180, 90],
                    [-180, 90],
                    [-180, -90],
                  ],
                ],
              },
            },
          })
        }

        // Add the dim layer below our data layers
        map.addLayer(
          {
            id: BASEMAP_DIM_LAYER_ID,
            type: "fill",
            source: BASEMAP_DIM_LAYER_ID,
            paint: {
              "fill-color": "#000000",
              "fill-opacity": 0,
            },
          },
          DEMAND_UNITS_LAYER_ID // Add below the demand units layer
        )
      }

      // Animate opacity
      const startOpacity = fadeIn ? 0 : BASEMAP_DIM_OPACITY
      const endOpacity = fadeIn ? BASEMAP_DIM_OPACITY : 0
      const startTime = performance.now()

      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const currentOpacity = startOpacity + (endOpacity - startOpacity) * eased

        if (map.getLayer(BASEMAP_DIM_LAYER_ID)) {
          map.setPaintProperty(BASEMAP_DIM_LAYER_ID, "fill-opacity", currentOpacity)
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    },
    []
  )

  // Reset layer to hidden/default state
  // Note: Basins/rivers labels fading is handled by React components
  // (BasinsLayer, RiversLayer) responding to isOutcomeVisualizationActive state
  const clear = useCallback(() => {
    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      // Hide the fill layer
      if (map.getLayer(DEMAND_UNITS_LAYER_ID)) {
        map.setLayoutProperty(DEMAND_UNITS_LAYER_ID, "visibility", "none")
        map.setFilter(DEMAND_UNITS_LAYER_ID, ["==", "DU_ID", ""])
      }

      // Remove the dynamically created outline layer
      if (map.getLayer(DEMAND_UNITS_OUTLINE_ID)) {
        map.removeLayer(DEMAND_UNITS_OUTLINE_ID)
      }

      // Fade out the basemap dim layer
      if (map.getLayer(BASEMAP_DIM_LAYER_ID)) {
        fadeBasemapDim(map, false)
      }
    })

    setFeatureCount(0)
  }, [mapAPI, fadeBasemapDim])

  // Main effect to style the Mapbox layer
  useEffect(() => {
    // If not visible or no config, clear and exit
    if (!visible || !config || !outcome) {
      clear()
      return
    }

    let cancelled = false

    async function loadAndStyle() {
      if (!config) return

      try {
        setIsLoading(true)
        setError(null)

        // Get scenario ID from strategy
        const scenarioId = STRATEGY_TO_SCENARIO_ID[strategy]
        if (!scenarioId) {
          throw new Error(`Unknown strategy: ${strategy}`)
        }

        // Get tier code from outcome display name
        const tierCode = getShortCodeFromDisplayName(outcome!)
        if (!tierCode) {
          throw new Error(`Unknown outcome: ${outcome}`)
        }

        // Fetch tier locations from API
        const tierData = await fetchTierLocations(scenarioId, tierCode)

        if (cancelled) return

        // Build a lookup of DU_ID -> tier_level from API response
        const tierLookup: Record<string, number> = {}
        tierData.locations.forEach((location) => {
          // location_id matches DU_ID in the Mapbox layer
          tierLookup[location.location_id] = location.tier_level
        })

        const duIds = Object.keys(tierLookup)
        setFeatureCount(duIds.length)

        if (duIds.length === 0) {
          // No tier data available - hide layer
          clear()
          return
        }

        // Apply styling to Mapbox layer
        mapAPI.withMap((mapRef) => {
          const map = mapRef.getMap()

          // Check if layer exists
          const layer = map.getLayer(DEMAND_UNITS_LAYER_ID)
          if (!layer) {
            console.warn(`Layer "${DEMAND_UNITS_LAYER_ID}" not found in map style`)
            return
          }

          // Build filter expression:
          // Show only features matching Class AND having tier data
          const classFilter = config.classFilter
            ? ["==", ["get", "Class"], config.classFilter]
            : true

          // Filter to only DU_IDs that have tier data
          const duIdFilter = ["in", ["get", "DU_ID"], ["literal", duIds]]

          // Combine filters
          map.setFilter(DEMAND_UNITS_LAYER_ID, ["all", classFilter, duIdFilter])

          // Build color expression based on tier data
          // This creates: ["match", ["get", "DU_ID"], "id1", color1, "id2", color2, ..., defaultColor]
          const colorPairs: (string | number)[] = []

          Object.entries(tierLookup).forEach(([duId, tierLevel]) => {
            colorPairs.push(duId)
            colorPairs.push(
              tierColors[tierLevel as 1 | 2 | 3 | 4] || theme.palette.grey[500]
            )
          })

          const colorExpression: MapboxExpression = [
            "match",
            ["get", "DU_ID"],
            ...colorPairs,
            theme.palette.grey[500], // Default color (fallback)
          ]

          // Apply paint properties for fill
          map.setPaintProperty(
            DEMAND_UNITS_LAYER_ID,
            "fill-color",
            colorExpression
          )
          
          // Fill opacity decreases as you zoom in (more detail visible)
          // At zoom 5: 0.75 opacity, at zoom 10: 0.4 opacity
          map.setPaintProperty(DEMAND_UNITS_LAYER_ID, "fill-opacity", [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, 0.75,  // Zoomed out: more opaque
            8, 0.55,  // Medium zoom
            10, 0.35, // Zoomed in: more transparent
          ])

          // Make fill layer visible
          map.setLayoutProperty(DEMAND_UNITS_LAYER_ID, "visibility", "visible")

          // Fade in the basemap overlay layer for better visibility
          fadeBasemapDim(map, true)

          // Style outline layer with tier colors for better visibility
          // Create outline layer dynamically if it doesn't exist
          if (!map.getLayer(DEMAND_UNITS_OUTLINE_ID)) {
            const fillLayer = map.getLayer(DEMAND_UNITS_LAYER_ID)
            if (fillLayer) {
              const sourceId = fillLayer.source as string
              const sourceLayer = (fillLayer as { "source-layer"?: string })["source-layer"]

              map.addLayer(
                {
                  id: DEMAND_UNITS_OUTLINE_ID,
                  type: "line",
                  source: sourceId,
                  "source-layer": sourceLayer,
                  paint: {
                    "line-color": colorExpression, // Use tier colors
                    "line-width": 0.5, // Start thin, will be overridden with zoom expression
                    "line-opacity": 1,
                    "line-offset": -0.25, // Inner stroke (half of width, negative = inward)
                  },
                  layout: {
                    visibility: "none",
                  },
                },
                // Don't specify before - add on top of fill
              )
            }
          }

          // Apply filter and styling to outline with tier colors
          if (map.getLayer(DEMAND_UNITS_OUTLINE_ID)) {
            map.setFilter(DEMAND_UNITS_OUTLINE_ID, ["all", classFilter, duIdFilter])
            map.setPaintProperty(DEMAND_UNITS_OUTLINE_ID, "line-color", colorExpression)
            // Stroke width: thin at low zoom to prevent jumbling, thicker as you zoom in
            map.setPaintProperty(DEMAND_UNITS_OUTLINE_ID, "line-width", [
              "interpolate",
              ["linear"],
              ["zoom"],
              5, 0.5,   // Very thin at low zoom
              7, 1,     // Slightly thicker
              9, 2,     // Medium
              11, 3,    // Full thickness when zoomed in
            ])
            map.setPaintProperty(DEMAND_UNITS_OUTLINE_ID, "line-opacity", 1)
            map.setPaintProperty(DEMAND_UNITS_OUTLINE_ID, "line-offset", [
              "interpolate",
              ["linear"],
              ["zoom"],
              5, -0.25,
              7, -0.5,
              9, -1,
              11, -1.5,
            ])
            map.setLayoutProperty(DEMAND_UNITS_OUTLINE_ID, "visibility", "visible")
          }

          // Zoom to bounds of visible features
          const sourceId = map.getLayer(DEMAND_UNITS_LAYER_ID)?.source as string
          const sourceLayer = (map.getLayer(DEMAND_UNITS_LAYER_ID) as { "source-layer"?: string })?.["source-layer"]
          
          const features = map.querySourceFeatures(sourceId, {
            sourceLayer,
            filter: ["all", classFilter, duIdFilter],
          })

          if (features.length > 0) {
            let minLng = Infinity,
              minLat = Infinity,
              maxLng = -Infinity,
              maxLat = -Infinity

            features.forEach((feature) => {
              const geom = feature.geometry
              if (geom.type === "Polygon") {
                const coords = geom.coordinates[0]
                if (coords) {
                  coords.forEach((coord) => {
                    const lng = coord[0]
                    const lat = coord[1]
                    if (lng !== undefined && lat !== undefined) {
                      minLng = Math.min(minLng, lng)
                      minLat = Math.min(minLat, lat)
                      maxLng = Math.max(maxLng, lng)
                      maxLat = Math.max(maxLat, lat)
                    }
                  })
                }
              } else if (geom.type === "MultiPolygon") {
                geom.coordinates.forEach((polygon) => {
                  const ring = polygon[0]
                  if (ring) {
                    ring.forEach((coord) => {
                      const lng = coord[0]
                      const lat = coord[1]
                      if (lng !== undefined && lat !== undefined) {
                        minLng = Math.min(minLng, lng)
                        minLat = Math.min(minLat, lat)
                        maxLng = Math.max(maxLng, lng)
                        maxLat = Math.max(maxLat, lat)
                      }
                    })
                  }
                })
              }
            })

            if (minLng !== Infinity) {
              map.fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                { padding: 100, maxZoom: 9, duration: 1000 }
              )
            }
          }
        })
      } catch (err) {
        if (!cancelled) {
          console.error("Error styling outcome map layer:", err)
          setError(
            err instanceof Error ? err.message : "Failed to load map data"
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadAndStyle()

    return () => {
      cancelled = true
    }
  }, [outcome, strategy, visible, config, tierColors, theme, mapAPI, clear, fadeBasemapDim])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear()
    }
  }, [clear])

  return {
    isLoading,
    error,
    featureCount,
    clear,
  }
}

/**
 * Check if an outcome uses demand unit mapping
 */
export function outcomeUsesDemandUnits(outcome: string): boolean {
  return outcome in OUTCOME_LAYER_CONFIG
}

