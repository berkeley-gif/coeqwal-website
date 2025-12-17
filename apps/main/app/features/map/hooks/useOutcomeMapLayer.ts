/**
 * Hook for displaying outcome data on polygons
 *
 * This hook:
 * 1. Uses the existing Mapbox layer
 * 2. Fetches tier location data from the API
 * 3. Filters the layer by Class (Urban, Agriculture, etc.), if a demand unit
 * 4. Colors polygons by matching their id to tier data
 *
 * Outcomes that map to demand units:
 * - Community deliveries (Class=Urban)
 * - Agricultural revenue (Class=Agriculture)
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import {
  getTierLabel,
  getTierColorsFromTheme,
  TierLevel,
} from "../../../content/tiers"
import type { MapMode } from "../store"
import { RIVER_LAYER_IDS } from "../layers/RiversLayer"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapInstance = any
import {
  STRATEGY_TO_SCENARIO_ID,
  getShortCodeFromDisplayName,
} from "../../../lib/constants/outcomeMappings"

// Mapbox expression type (simplified for our use case)
type MapboxExpression = ["match", ["get", string], ...unknown[]]

// The Mapbox layer IDs for demand units
const DEMAND_UNITS_LAYER_ID = "demand-units"
const DEMAND_UNITS_OUTLINE_ID = "demand-units-outline"

// The Mapbox layer IDs for Water Budget Areas (WBA)
const WBA_LAYER_ID = "calsim-wba"
const WBA_OUTLINE_ID = "calsim-wba-outline"

const BASEMAP_DIM_LAYER_ID = "basemap-dim-overlay"

// Dimming overlay opacity (0 = no dim, 1 = full black)
const BASEMAP_DIM_OPACITY = 0.15

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

interface OutcomeLayerConfig {
  /** Which Mapbox layer to use */
  layerType: "demand-units" | "wba"
  /** Filter by Class (for demand-units only) */
  classFilter?: "Agriculture" | "Urban" | "Refuge" | "N/A" | null
  /** API short code for tier data */
  tierCode: string
  /** Property name for feature ID matching */
  idProperty: string
}

/**
 * Configuration for each outcome type
 */
export const OUTCOME_LAYER_CONFIG: Record<string, OutcomeLayerConfig> = {
  "Community deliveries": {
    layerType: "demand-units",
    classFilter: "Urban",
    tierCode: "CWS_DEL",
    idProperty: "DU_ID",
  },
  "Agricultural revenue": {
    layerType: "demand-units",
    classFilter: "Agriculture",
    tierCode: "AG_REV",
    idProperty: "DU_ID",
  },
  "Groundwater storage": {
    layerType: "wba",
    tierCode: "GW_STOR",
    idProperty: "WBA_ID",
  },
}

// Cache for tier location data
const tierLocationCache: Map<string, TierLocationsResponse> = new Map()

/**
 * Fetch tier locations with caching
 * Exported so other components can use the same cached data
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

  const url = `${API_BASE}/tier-map/${scenarioId}/${tierCode}/locations`
  const response = await fetch(url)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Failed to fetch tier locations: ${response.status}`,
    )
  }

  const data = await response.json()

  // Store in cache
  tierLocationCache.set(cacheKey, data)

  return data
}

interface UseOutcomeMapLayerProps {
  /** Learn mode outcome display name (e.g., "Community deliveries") */
  learnOutcome: string | null
  /** Learn mode strategy value (e.g., "current-ops") */
  learnStrategy: string
  /** Explore mode outcome display name */
  exploreOutcome: string | null
  /** Explore mode strategy value */
  exploreStrategy: string
  /** Current map mode - determines which outcome to display */
  mapMode: MapMode
}

/** Info about a polygon */
export interface HoveredFeatureInfo {
  longitude: number
  latitude: number
  /** Which layer type this feature is from */
  layerType: "demand-units" | "wba"
  /** Feature ID (DU_ID or WBA_ID) */
  featureId: string
  /** Tier level (1-5) */
  tierLevel: number
  /** Human-readable tier label */
  tierLabel: string
  /** Location name from API */
  locationName: string | null
  /** Tier value from API (can be null) */
  tierValue: number | null

  // Demand-units specific fields
  urbName: string | null // Primary name for CWS (Urban)
  modName: string | null // Secondary name (or primary if no urbName)
  subName: string | null
  comments: string | null
  type: string | null
  classType: string | null // "Urban", "Agriculture", etc.

  // WBA specific fields
  hydroRegion: string | null // Hydrological region (SAC, SJR, etc.)
  gisAcres: number | null // Area in acres
}

interface UseOutcomeMapLayerResult {
  isLoading: boolean
  error: string | null
  featureCount: number
  /** Info about currently hovered polygon (for tooltip) */
  hoveredFeature: HoveredFeatureInfo | null
  /** Info about clicked/pinned polygon (stays visible until dismissed) */
  pinnedFeature: HoveredFeatureInfo | null
  /** Clear the pinned tooltip */
  clearPinned: () => void
  /** Clear the layer styling */
  clear: () => void
}

/**
 * Hook to display outcome data on the calsim-demand-units Mapbox layer
 * 
 * This is a mode-aware hook that handles both Learn and Explore modes.
 * It derives the active outcome based on mapMode, preventing race conditions
 * and ensuring clean transitions between modes.
 */
export function useOutcomeMapLayer({
  learnOutcome,
  learnStrategy,
  exploreOutcome,
  exploreStrategy,
  mapMode,
}: UseOutcomeMapLayerProps): UseOutcomeMapLayerResult {
  const theme = useTheme()
  const mapAPI = useMap()
  const [isLoading, setIsLoading] = useState(false)
  
  // Derive active outcome and strategy based on mapMode
  const outcome = mapMode === "learn" ? learnOutcome 
                : mapMode === "explore" ? exploreOutcome 
                : null
  
  const strategy = mapMode === "learn" ? learnStrategy 
                 : mapMode === "explore" ? exploreStrategy 
                 : "current-ops"
  
  // Skip camera control in Explore mode (useTierMapData handles it)
  const skipCameraControl = mapMode === "explore"
  
  // Layer is visible when we have an outcome and are in a visible mode
  const visible = !!outcome && (mapMode === "learn" || mapMode === "explore")
  const [error, setError] = useState<string | null>(null)
  const [featureCount, setFeatureCount] = useState(0)
  const [hoveredFeature, setHoveredFeature] =
    useState<HoveredFeatureInfo | null>(null)
  const [pinnedFeature, setPinnedFeature] =
    useState<HoveredFeatureInfo | null>(null)

  // Clear pinned tooltip
  const clearPinned = useCallback(() => {
    setPinnedFeature(null)
  }, [])

  // Store tier lookup in a ref so event handlers can access it
  const tierLookupRef = useRef<Record<string, number>>({})
  // Store full location data from API for tooltips
  const locationDataRef = useRef<Record<string, TierLocation>>({})

  // Get config for this outcome
  const config = outcome ? OUTCOME_LAYER_CONFIG[outcome] : null

  // Tier colors from theme (using centralized helper)
  const tierColors = useMemo(() => getTierColorsFromTheme(theme), [theme])

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
          DEMAND_UNITS_LAYER_ID, // Add below the demand units layer
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
        const currentOpacity =
          startOpacity + (endOpacity - startOpacity) * eased

        if (map.getLayer(BASEMAP_DIM_LAYER_ID)) {
          map.setPaintProperty(
            BASEMAP_DIM_LAYER_ID,
            "fill-opacity",
            currentOpacity,
          )
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    },
    [],
  )

  // Reset layer to hidden/default state
  // Note: Basins/rivers labels fading is handled by React components
  // (BasinsLayer, RiversLayer) responding to isOutcomeVisualizationActive state
  const clear = useCallback(() => {
    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      // Hide the demand-units fill layer
      if (map.getLayer(DEMAND_UNITS_LAYER_ID)) {
        map.setLayoutProperty(DEMAND_UNITS_LAYER_ID, "visibility", "none")
        map.setFilter(DEMAND_UNITS_LAYER_ID, ["==", "DU_ID", ""])
      }

      // Remove the dynamically created demand-units outline layer
      if (map.getLayer(DEMAND_UNITS_OUTLINE_ID)) {
        map.removeLayer(DEMAND_UNITS_OUTLINE_ID)
      }

      // Hide the WBA fill layer
      if (map.getLayer(WBA_LAYER_ID)) {
        map.setLayoutProperty(WBA_LAYER_ID, "visibility", "none")
        map.setFilter(WBA_LAYER_ID, ["==", "WBA_ID", ""])
      }

      // Remove the dynamically created WBA outline layer
      if (map.getLayer(WBA_OUTLINE_ID)) {
        map.removeLayer(WBA_OUTLINE_ID)
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

    // ALWAYS clear previous layers before applying new styling
    // This prevents polygon accumulation when switching between outcomes
    clear()

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

        // Determine which layer to use based on config
        const layerId = config.layerType === "wba" ? WBA_LAYER_ID : DEMAND_UNITS_LAYER_ID
        const outlineId = config.layerType === "wba" ? WBA_OUTLINE_ID : DEMAND_UNITS_OUTLINE_ID
        const idProperty = config.idProperty

        // Build a lookup of feature ID -> tier_level from API response
        const tierLookup: Record<string, number> = {}
        const locationData: Record<string, TierLocation> = {}
        tierData.locations.forEach((location) => {
          // location_id matches the idProperty in the Mapbox layer
          tierLookup[location.location_id] = location.tier_level
          locationData[location.location_id] = location
        })

        // Store in refs for event handlers to access
        tierLookupRef.current = tierLookup
        locationDataRef.current = locationData

        const featureIds = Object.keys(tierLookup)
        setFeatureCount(featureIds.length)

        if (featureIds.length === 0) {
          // No tier data available - hide layer
          clear()
          return
        }

        // Apply styling to Mapbox layer
        mapAPI.withMap((mapRef) => {
          const map = mapRef.getMap()

          // Check if layer exists
          const layer = map.getLayer(layerId)
          if (!layer) {
            console.warn(
              `Layer "${layerId}" not found in map style`,
            )
            return
          }

          // Build filter expression:
          // Show only features matching Class (if applicable) AND having tier data
          const classFilter = config.classFilter
            ? ["==", ["get", "Class"], config.classFilter]
            : true

          // Filter to only feature IDs that have tier data
          const idFilter = ["in", ["get", idProperty], ["literal", featureIds]]

          // Combine filters
          map.setFilter(layerId, ["all", classFilter, idFilter])

          // Build color expression based on tier data
          // This creates: ["match", ["get", idProperty], "id1", color1, "id2", color2, ..., defaultColor]
          const colorPairs: (string | number)[] = []

          Object.entries(tierLookup).forEach(([featureId, tierLevel]) => {
            colorPairs.push(featureId)
            colorPairs.push(
              tierColors[tierLevel as TierLevel] || theme.palette.grey[500],
            )
          })

          const colorExpression: MapboxExpression = [
            "match",
            ["get", idProperty],
            ...colorPairs,
            theme.palette.grey[500], // Default color (fallback)
          ]

          // Apply paint properties for fill
          map.setPaintProperty(
            layerId,
            "fill-color",
            colorExpression,
          )

          // Fill opacity decreases as you zoom in (more detail visible)
          // At zoom 5: 0.75 opacity, at zoom 10: 0.4 opacity
          map.setPaintProperty(layerId, "fill-opacity", [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0.75, // Zoomed out: more opaque
            8,
            0.55, // Medium zoom
            10,
            0.35, // Zoomed in: more transparent
          ])

          // Make fill layer visible
          map.setLayoutProperty(layerId, "visibility", "visible")

          // Fade in the basemap overlay layer for better visibility
          fadeBasemapDim(map, true)

          // Style outline layer with tier colors for better visibility
          // Create outline layer dynamically if it doesn't exist
          if (!map.getLayer(outlineId)) {
            const fillLayer = map.getLayer(layerId)
            if (fillLayer) {
              const sourceId = fillLayer.source as string
              const sourceLayer = (fillLayer as { "source-layer"?: string })[
                "source-layer"
              ]

              map.addLayer(
                {
                  id: outlineId,
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
          if (map.getLayer(outlineId)) {
            map.setFilter(outlineId, [
              "all",
              classFilter,
              idFilter,
            ])
            map.setPaintProperty(
              outlineId,
              "line-color",
              colorExpression,
            )
            // Stroke width: thin at low zoom to prevent jumbling, thicker as you zoom in
            map.setPaintProperty(outlineId, "line-width", [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              0.5, // Very thin at low zoom
              7,
              1, // Slightly thicker
              9,
              2, // Medium
              11,
              3, // Full thickness when zoomed in
            ])
            map.setPaintProperty(outlineId, "line-opacity", 1)
            map.setPaintProperty(outlineId, "line-offset", [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              -0.25,
              7,
              -0.5,
              9,
              -1,
              11,
              -1.5,
            ])
            map.setLayoutProperty(
              outlineId,
              "visibility",
              "visible",
            )
          }

          // Move river layers to the top so they're always visible above polygons
          RIVER_LAYER_IDS.forEach((layerId) => {
            try {
              if (map.getLayer(layerId)) {
                map.moveLayer(layerId)
              }
            } catch {
              // Layer might not exist, ignore
            }
          })
        })

        // This is a SEPARATE withMap call to ensure zoom happens even if styling encounters issues
        // and to always trigger when switching outcomes (regardless of previous map state)
        // Skip zoom when skipCameraControl is true (e.g., Explore mode where useTierMapData handles zoom)
        if (!cancelled && !skipCameraControl) {
          mapAPI.withMap((mapRef) => {
            const map = mapRef.getMap()
            const currentCenter = map.getCenter()

            const targetZoom = 6.5

            console.log(
              `[useOutcomeMapLayer] Zooming to level ${targetZoom} for "${outcome}" (keeping current center)`,
            )
            map.easeTo({
              zoom: targetZoom,
              center: currentCenter, // Keep current center
              duration: 1000,
            })
          })
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error styling outcome map layer:", err)
          setError(
            err instanceof Error ? err.message : "Failed to load map data",
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
  }, [
    outcome,
    strategy,
    visible,
    skipCameraControl,
    config,
    tierColors,
    theme,
    mapAPI,
    clear,
    fadeBasemapDim,
  ])

  // Set up hover events for tooltips - works for both demand-units and WBA layers
  useEffect(() => {
    if (!visible || !outcome || !config) {
      setHoveredFeature(null)
      return
    }

    // Determine which layer to listen to based on config
    const layerId = config.layerType === "wba" ? WBA_LAYER_ID : DEMAND_UNITS_LAYER_ID
    const idProperty = config.idProperty

    // Mapbox GL mouse event handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mouseEnterHandler: ((e: any) => void) | null = null
    let mouseLeaveHandler: (() => void) | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mouseMoveHandler: ((e: any) => void) | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let clickHandler: ((e: any) => void) | null = null

    // Helper to build feature info from event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildFeatureInfo = (e: any): HoveredFeatureInfo | null => {
      if (!e.features || e.features.length === 0) return null

      const feature = e.features[0]
      const props = feature.properties || {}
      const featureId = props[idProperty]
      const tierLevel = tierLookupRef.current[featureId] || 0
      const locationInfo = locationDataRef.current[featureId]

      if (!featureId || tierLevel === 0) return null

      // Use the mouse position as the tooltip anchor
      const [lng, lat] = e.lngLat.toArray()

      if (config.layerType === "wba") {
        return {
          longitude: lng,
          latitude: lat,
          layerType: "wba",
          featureId,
          tierLevel,
          tierLabel: getTierLabel(tierLevel),
          locationName: locationInfo?.location_name || null,
          tierValue: locationInfo?.tier_value ?? null,
          hydroRegion: props.HydroRegion || null,
          gisAcres: props.GIS_Acres ? Number(props.GIS_Acres) : null,
          urbName: null,
          modName: null,
          subName: null,
          comments: null,
          type: null,
          classType: null,
        }
      } else {
        return {
          longitude: lng,
          latitude: lat,
          layerType: "demand-units",
          featureId,
          tierLevel,
          tierLabel: getTierLabel(tierLevel),
          locationName: locationInfo?.location_name || null,
          tierValue: locationInfo?.tier_value ?? null,
          urbName: props.Urb_Name || null,
          modName: props.Mod_Name || null,
          subName: props.Sub_Name || null,
          comments: props.Comments || null,
          type: props.Type || null,
          classType: props.Class || null,
          hydroRegion: null,
          gisAcres: null,
        }
      }
    }

    // Track if we clicked on a polygon (to prevent map click from clearing)
    let clickedOnPolygon = false

    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      if (!map.getLayer(layerId)) return

      // Mouse enter - change cursor
      mouseEnterHandler = () => {
        map.getCanvas().style.cursor = "pointer"
      }

      // Mouse leave - reset cursor and clear hover (but not pinned)
      mouseLeaveHandler = () => {
        map.getCanvas().style.cursor = ""
        setHoveredFeature(null)
      }

      // Mouse move - update hovered feature
      mouseMoveHandler = (e) => {
        const info = buildFeatureInfo(e)
        setHoveredFeature(info)
      }

      // Click on polygon - pin the tooltip
      clickHandler = (e) => {
        clickedOnPolygon = true
        const info = buildFeatureInfo(e)
        if (info) {
          setPinnedFeature(info)
        }
        // Reset flag after a short delay
        setTimeout(() => {
          clickedOnPolygon = false
        }, 100)
      }

      // Click on map (not on polygon) - clear pinned tooltip
      const mapClickHandler = () => {
        // Only clear if we didn't click on a polygon
        if (!clickedOnPolygon) {
          setPinnedFeature(null)
        }
      }

      map.on("mouseenter", layerId, mouseEnterHandler)
      map.on("mouseleave", layerId, mouseLeaveHandler)
      map.on("mousemove", layerId, mouseMoveHandler)
      map.on("click", layerId, clickHandler)
      map.on("click", mapClickHandler)

      // Store mapClickHandler reference for cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mouseEnterHandler as any)._mapClickHandler = mapClickHandler
    })

    return () => {
      mapAPI.withMap((mapRef) => {
        const map = mapRef.getMap()
        if (mouseEnterHandler) {
          map.off("mouseenter", layerId, mouseEnterHandler)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapClickHandler = (mouseEnterHandler as any)._mapClickHandler
          if (mapClickHandler) {
            map.off("click", mapClickHandler)
          }
        }
        if (mouseLeaveHandler)
          map.off("mouseleave", layerId, mouseLeaveHandler)
        if (mouseMoveHandler)
          map.off("mousemove", layerId, mouseMoveHandler)
        if (clickHandler)
          map.off("click", layerId, clickHandler)
      })
      setHoveredFeature(null)
      setPinnedFeature(null)
    }
  }, [visible, outcome, config, mapAPI])

  // Clear pinned tooltip when outcome changes (clicking another glyph)
  useEffect(() => {
    setPinnedFeature(null)
  }, [outcome])

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
    hoveredFeature,
    pinnedFeature,
    clearPinned,
    clear,
  }
}

/**
 * Check if an outcome uses polygon visualization (demand units layer)
 * Returns true for outcomes like "Community deliveries" and "Agricultural revenue"
 * that are rendered as polygons on the map rather than point markers.
 */
export function outcomeUsesPolygons(outcome: string): boolean {
  return outcome in OUTCOME_LAYER_CONFIG
}
