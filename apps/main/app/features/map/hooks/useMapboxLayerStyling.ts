/**
 * Hook for applying Mapbox layer styling
 *
 * Handles all geometry types:
 * - Polygons: fill + line layers with tier colors
 * - Points: circle layers with tier colors
 * - Lines: line layers with tier colors (for rivers)
 * - Single-feature layers (delta, salmon): simple show/hide with highlight
 */

import { useCallback, useEffect, useMemo } from "react"
import { useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import { getTierColorsFromTheme, TierLevel } from "../../../content/tiers"
import {
  type OutcomeLayerConfig,
  LAYER_IDS,
  BASEMAP_DIM_OPACITY,
  RIVER_LAYER_IDS,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../config/outcomeLayerRegistry"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapInstance = any

// Mapbox expression type
type MapboxExpression = ["match", ["get", string], ...unknown[]]

// ============================================================================
// HOOK
// ============================================================================

interface UseMapboxLayerStylingProps {
  /** Layer config from registry */
  config: OutcomeLayerConfig | null
  /** Lookup: feature ID -> tier level */
  tierLookup: Record<string, number>
  /** List of feature IDs to show */
  featureIds: string[]
  /** Whether styling should be applied */
  enabled: boolean
}

interface UseMapboxLayerStylingResult {
  /** Clear all layer styling */
  clear: () => void
}

/**
 * Hook to apply Mapbox layer styling based on tier data
 */
export function useMapboxLayerStyling({
  config,
  tierLookup,
  featureIds,
  enabled,
}: UseMapboxLayerStylingProps): UseMapboxLayerStylingResult {
  const theme = useTheme()
  const mapAPI = useMap()

  // Tier colors from theme
  const tierColors = useMemo(() => getTierColorsFromTheme(theme), [theme])

  // Fade the basemap dim layer
  const fadeBasemapDim = useCallback(
    (map: MapInstance, fadeIn: boolean, duration: number = 500) => {
      const dimLayerId = LAYER_IDS.basemapDim

      // Create the dim layer if it doesn't exist
      if (!map.getLayer(dimLayerId)) {
        if (!map.getSource(dimLayerId)) {
          map.addSource(dimLayerId, {
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

        map.addLayer(
          {
            id: dimLayerId,
            type: "fill",
            source: dimLayerId,
            paint: { "fill-color": "#000000", "fill-opacity": 0 },
          },
          LAYER_IDS.demandUnits.fill,
        )
      }

      // Animate opacity
      const startOpacity = fadeIn ? 0 : BASEMAP_DIM_OPACITY
      const endOpacity = fadeIn ? BASEMAP_DIM_OPACITY : 0
      const startTime = performance.now()

      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const currentOpacity =
          startOpacity + (endOpacity - startOpacity) * eased

        if (map.getLayer(dimLayerId)) {
          map.setPaintProperty(dimLayerId, "fill-opacity", currentOpacity)
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    },
    [],
  )

  // Clear all outcome layers (called when switching outcomes)
  const clear = useCallback(() => {
    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      // Clear demand-units layers
      if (map.getLayer(LAYER_IDS.demandUnits.fill)) {
        map.setLayoutProperty(LAYER_IDS.demandUnits.fill, "visibility", "none")
        map.setFilter(LAYER_IDS.demandUnits.fill, ["==", "DU_ID", ""])
      }
      if (map.getLayer(LAYER_IDS.demandUnits.outline)) {
        try {
          map.removeLayer(LAYER_IDS.demandUnits.outline)
        } catch {
          /* ignore */
        }
      }

      // Clear WBA layers
      if (map.getLayer(LAYER_IDS.wba.fill)) {
        map.setLayoutProperty(LAYER_IDS.wba.fill, "visibility", "none")
        map.setFilter(LAYER_IDS.wba.fill, ["==", "WBA_ID", ""])
      }
      if (map.getLayer(LAYER_IDS.wba.outline)) {
        try {
          map.removeLayer(LAYER_IDS.wba.outline)
        } catch {
          /* ignore */
        }
      }

      // Clear reservoir layers
      if (map.getLayer(LAYER_IDS.reservoir.fill)) {
        map.setLayoutProperty(LAYER_IDS.reservoir.fill, "visibility", "none")
        map.setFilter(LAYER_IDS.reservoir.fill, ["==", "gnisidlabel", ""])
      }
      if (map.getLayer(LAYER_IDS.reservoir.outline)) {
        try {
          map.removeLayer(LAYER_IDS.reservoir.outline)
        } catch {
          /* ignore */
        }
      }
      if (map.getLayer(LAYER_IDS.reservoir.label)) {
        try {
          map.removeLayer(LAYER_IDS.reservoir.label)
        } catch {
          /* ignore */
        }
      }

      // Clear delta layer
      if (map.getLayer(LAYER_IDS.delta.fill)) {
        map.setLayoutProperty(LAYER_IDS.delta.fill, "visibility", "none")
      }
      if (map.getLayer(LAYER_IDS.delta.outline)) {
        try {
          map.removeLayer(LAYER_IDS.delta.outline)
        } catch {
          /* ignore */
        }
      }

      // Restore river layers to original styling
      if (map.getLayer(LAYER_IDS.sacramento.body)) {
        map.setPaintProperty(LAYER_IDS.sacramento.body, "line-color", "#116bb0")
        map.setPaintProperty(LAYER_IDS.sacramento.body, "line-width", 3)
      }
      if (map.getLayer(LAYER_IDS.sacramento.trough)) {
        map.setPaintProperty(
          LAYER_IDS.sacramento.trough,
          "line-color",
          "#1a3a52",
        )
        map.setPaintProperty(LAYER_IDS.sacramento.trough, "line-width", 7)
        map.setPaintProperty(LAYER_IDS.sacramento.trough, "line-opacity", 0.5)
      }
      if (map.getLayer(LAYER_IDS.sanJoaquin.body)) {
        map.setPaintProperty(LAYER_IDS.sanJoaquin.body, "line-color", "#116bb0")
        map.setPaintProperty(LAYER_IDS.sanJoaquin.body, "line-width", 3)
      }
      if (map.getLayer(LAYER_IDS.sanJoaquin.trough)) {
        map.setPaintProperty(
          LAYER_IDS.sanJoaquin.trough,
          "line-color",
          "#1a3a52",
        )
        map.setPaintProperty(LAYER_IDS.sanJoaquin.trough, "line-width", 7)
        map.setPaintProperty(LAYER_IDS.sanJoaquin.trough, "line-opacity", 0.5)
      }

      // Fade out basemap dim
      if (map.getLayer(LAYER_IDS.basemapDim)) {
        fadeBasemapDim(map, false)
      }
    })
  }, [mapAPI, fadeBasemapDim])

  // Apply styling when data changes
  useEffect(() => {
    if (!enabled || !config) {
      clear()
      return
    }

    // Always clear before applying new styling
    clear()

    const timeoutId = setTimeout(() => {
      mapAPI.withMap((mapRef) => {
        const map = mapRef.getMap()
        const {
          geometryType,
          mapboxLayerId,
          idProperty,
          classFilter,
          requiresIdMatching,
          layerType,
        } = config

        // Check if layer exists
        if (!map.getLayer(mapboxLayerId)) {
          return
        }

        // Build color expression based on tier data
        const buildColorExpression = (): MapboxExpression | string => {
          if (!requiresIdMatching || !idProperty) {
            // Single feature - use the actual tier from the data (first entry)
            const tierValues = Object.values(tierLookup)
            const tier = tierValues.length > 0 ? tierValues[0] : 3
            return tierColors[tier as TierLevel] || theme.palette.blue.medium
          }

          // For reservoir layer, translate CalSim IDs to gnisidlabel for color matching
          let lookupToUse = tierLookup
          if (config.layerType === "reservoir") {
            lookupToUse = {}
            Object.entries(tierLookup).forEach(([calsimId, tier]) => {
              const gnisLabel = RESERVOIR_CALSIM_TO_GNISIDLABEL[calsimId]
              if (gnisLabel) {
                // If multiple CalSim IDs map to same reservoir, use highest tier
                if (!lookupToUse[gnisLabel] || tier > lookupToUse[gnisLabel]) {
                  lookupToUse[gnisLabel] = tier
                }
              }
            })
          }

          const colorPairs: (string | number)[] = []
          Object.entries(lookupToUse).forEach(([featureId, tierLevel]) => {
            colorPairs.push(featureId)
            colorPairs.push(
              tierColors[tierLevel as TierLevel] || theme.palette.grey[500],
            )
          })

          if (colorPairs.length === 0) {
            return theme.palette.grey[500]
          }

          return [
            "match",
            ["get", idProperty],
            ...colorPairs,
            theme.palette.grey[500],
          ]
        }

        const colorExpression = buildColorExpression()

        // Apply styling based on geometry type
        switch (geometryType) {
          case "polygon":
            applyPolygonStyling(
              map,
              config,
              colorExpression,
              featureIds,
              classFilter,
              tierLookup,
            )
            break
          case "point":
            applyPointStyling(map, config, colorExpression, featureIds)
            break
          case "line":
            applyLineStyling(map, config, colorExpression)
            break
        }

        // Fade in basemap dim
        fadeBasemapDim(map, true)

        // River layers at top (reservoirs go above rivers)
        RIVER_LAYER_IDS.forEach((riverId) => {
          try {
            if (map.getLayer(riverId)) {
              map.moveLayer(riverId)
            }
          } catch {
            /* ignore */
          }
        })

        // Reservoirs go above the rivers
        if (layerType === "reservoir") {
          try {
            if (map.getLayer(LAYER_IDS.reservoir.fill)) {
              map.moveLayer(LAYER_IDS.reservoir.fill)
            }
            if (map.getLayer(LAYER_IDS.reservoir.outline)) {
              map.moveLayer(LAYER_IDS.reservoir.outline)
            }
          } catch {
            /* ignore */
          }
        }
      })
    }, 10)

    return () => clearTimeout(timeoutId)
  }, [
    enabled,
    config,
    tierLookup,
    featureIds,
    tierColors,
    theme,
    mapAPI,
    clear,
    fadeBasemapDim,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => clear()
  }, [clear])

  return { clear }
}

// ============================================================================
// STYLING HELPERS
// ============================================================================

function applyPolygonStyling(
  map: MapInstance,
  config: OutcomeLayerConfig,
  colorExpression: MapboxExpression | string,
  featureIds: string[],
  classFilter?: string,
  tierLookup?: Record<string, number>,
) {
  const { mapboxLayerId, idProperty, requiresIdMatching, layerType } = config
  const outlineId = `${mapboxLayerId}-outline`

  // For reservoir layer, translate CalSim IDs to gnisidlabel values
  let translatedFeatureIds = featureIds
  let translatedTierLookup = tierLookup
  if (layerType === "reservoir" && featureIds.length > 0) {
    translatedFeatureIds = featureIds
      .map((id) => RESERVOIR_CALSIM_TO_GNISIDLABEL[id])
      .filter((v): v is string => !!v)
    // TODO: sort out duplicates (SLUIS_CVP and SLUIS_SWP both map to "San Luis Reservoir")
    translatedFeatureIds = [...new Set(translatedFeatureIds)]

    // Also translate the tier lookup for color matching
    if (tierLookup) {
      translatedTierLookup = {}
      Object.entries(tierLookup).forEach(([calsimId, tier]) => {
        const gnisLabel = RESERVOIR_CALSIM_TO_GNISIDLABEL[calsimId]
        if (gnisLabel) {
          // If multiple CalSim IDs map to same reservoir, use highest tier
          if (
            !translatedTierLookup![gnisLabel] ||
            tier > translatedTierLookup![gnisLabel]
          ) {
            translatedTierLookup![gnisLabel] = tier
          }
        }
      })
    }
  }

  // Build filter
  const filter: unknown[] = ["all"]
  if (classFilter) {
    filter.push(["==", ["get", "Class"], classFilter])
  }
  if (requiresIdMatching && idProperty && translatedFeatureIds.length > 0) {
    filter.push(["in", ["get", idProperty], ["literal", translatedFeatureIds]])
  }

  // Apply filter
  if (filter.length > 1) {
    map.setFilter(mapboxLayerId, filter)
  } else {
    map.setFilter(mapboxLayerId, null)
  }

  // Special handling for reservoir: keep natural fill color
  // Labels are rendered via React component (ReservoirLabels) for better control
  if (layerType === "reservoir") {
    map.setLayoutProperty(mapboxLayerId, "visibility", "visible")
    return // Skip the normal fill/outline styling for reservoirs
  }

  // Special handling for Delta: keep fill color from Mapbox style but set opacity
  if (layerType === "delta") {
    map.setLayoutProperty(mapboxLayerId, "visibility", "visible")
    // Set opacity (layer might be at 0 opacity from previous hide)
    map.setPaintProperty(mapboxLayerId, "fill-opacity", 0.9)
    // Continue to outline styling below, but skip fill-color
  } else {
    // Apply fill styling (for non-reservoir, non-delta polygons)
    map.setPaintProperty(mapboxLayerId, "fill-color", colorExpression)
    map.setPaintProperty(mapboxLayerId, "fill-opacity", [
      "interpolate",
      ["linear"],
      ["zoom"],
      5,
      0.75,
      8,
      0.55,
      10,
      0.35,
    ])
    map.setLayoutProperty(mapboxLayerId, "visibility", "visible")
  }

  // Create/update outline layer
  if (!map.getLayer(outlineId)) {
    const fillLayer = map.getLayer(mapboxLayerId)
    if (fillLayer) {
      const sourceId = fillLayer.source as string
      const sourceLayer = (fillLayer as { "source-layer"?: string })[
        "source-layer"
      ]

      map.addLayer({
        id: outlineId,
        type: "line",
        source: sourceId,
        "source-layer": sourceLayer,
        paint: {
          "line-color": colorExpression,
          "line-width": 0.5,
          "line-opacity": 1,
          "line-offset": -0.25,
        },
        layout: { visibility: "none" },
      })
    }
  }

  if (map.getLayer(outlineId)) {
    if (filter.length > 1) {
      map.setFilter(outlineId, filter)
    }
    map.setPaintProperty(outlineId, "line-color", colorExpression)

    // Delta gets a fixed thin stroke, others get zoom-interpolated width
    if (layerType === "delta") {
      map.setPaintProperty(outlineId, "line-width", 0.5)
      map.setPaintProperty(outlineId, "line-offset", 0)
    } else {
      map.setPaintProperty(outlineId, "line-width", [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        0.5,
        7,
        1,
        9,
        2,
        11,
        3,
      ])
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
    }
    map.setLayoutProperty(outlineId, "visibility", "visible")
  }
}

function applyPointStyling(
  map: MapInstance,
  config: OutcomeLayerConfig,
  colorExpression: MapboxExpression | string,
  featureIds: string[],
) {
  const {
    mapboxLayerId,
    idProperty,
    requiresIdMatching,
    circleRadius = 8,
    circleStrokeWidth = 2,
  } = config

  // Build filter for ID matching
  let filter: unknown[] | null = null
  if (requiresIdMatching && idProperty && featureIds.length > 0) {
    filter = ["in", ["get", idProperty], ["literal", featureIds]]
  }

  // Apply filter if needed
  if (filter) {
    map.setFilter(mapboxLayerId, filter)
  }

  // Apply circle styling
  map.setPaintProperty(mapboxLayerId, "circle-color", colorExpression)
  map.setPaintProperty(mapboxLayerId, "circle-radius", [
    "interpolate",
    ["linear"],
    ["zoom"],
    5,
    circleRadius * 0.5,
    8,
    circleRadius,
    12,
    circleRadius * 1.5,
  ])
  map.setPaintProperty(mapboxLayerId, "circle-stroke-color", "#ffffff")
  map.setPaintProperty(mapboxLayerId, "circle-stroke-width", circleStrokeWidth)
  map.setPaintProperty(mapboxLayerId, "circle-opacity", 0.9)
  map.setLayoutProperty(mapboxLayerId, "visibility", "visible")
}

function applyLineStyling(
  map: MapInstance,
  config: OutcomeLayerConfig,
  colorExpression: MapboxExpression | string,
) {
  const { reactLayerIds, lineWidth = 5 } = config

  // For React-rendered layers (rivers), highlight by changing the color
  if (reactLayerIds) {
    // Color the body layer with the tier color
    const bodyLayerId = reactLayerIds.find((id) => id.includes("body"))
    if (bodyLayerId && map.getLayer(bodyLayerId)) {
      map.setPaintProperty(bodyLayerId, "line-color", colorExpression)
      map.setPaintProperty(bodyLayerId, "line-width", lineWidth)
    }

    // Also color the trough layer slightly darker for depth effect
    const troughLayerId = reactLayerIds.find((id) => id.includes("trough"))
    if (troughLayerId && map.getLayer(troughLayerId)) {
      // Trough uses same color but wider for outline effect
      map.setPaintProperty(troughLayerId, "line-color", "#1a3a52") // Keep dark outline
      map.setPaintProperty(troughLayerId, "line-width", lineWidth + 4)
      map.setPaintProperty(troughLayerId, "line-opacity", 0.7)
    }
  }
}
