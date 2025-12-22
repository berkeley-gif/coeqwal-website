/**
 * Hook for applying Mapbox layer styling
 * 
 * Responsibilities:
 * - Apply filters and colors to polygon layers
 * - Create and manage outline layers
 * - Handle basemap dimming animation
 * - Ensure river layers stay on top
 */

import { useCallback, useEffect, useMemo } from "react"
import { useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import { getTierColorsFromTheme, TierLevel } from "../../../content/tiers"
import { RIVER_LAYER_IDS } from "../layers/RiversLayer"
import {
  type PolygonLayerConfig,
  LAYER_IDS,
  BASEMAP_DIM_OPACITY,
  getLayerIds,
} from "../config/polygonLayers"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapInstance = any

// Mapbox expression type
type MapboxExpression = ["match", ["get", string], ...unknown[]]

// ============================================================================
// HOOK
// ============================================================================

interface UseLayerStylingProps {
  /** Layer config from registry */
  config: PolygonLayerConfig | null
  /** Lookup: feature ID -> tier level */
  tierLookup: Record<string, number>
  /** List of feature IDs to show */
  featureIds: string[]
  /** Whether styling should be applied */
  enabled: boolean
}

interface UseLayerStylingResult {
  /** Clear all layer styling */
  clear: () => void
}

/**
 * Hook to apply Mapbox layer styling based on tier data
 */
export function useLayerStyling({
  config,
  tierLookup,
  featureIds,
  enabled,
}: UseLayerStylingProps): UseLayerStylingResult {
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
            paint: {
              "fill-color": "#000000",
              "fill-opacity": 0,
            },
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
        const currentOpacity = startOpacity + (endOpacity - startOpacity) * eased

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

  // Clear layer styling
  const clear = useCallback(() => {
    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      // Hide demand-units layers
      const duIds = LAYER_IDS.demandUnits
      if (map.getLayer(duIds.fill)) {
        map.setLayoutProperty(duIds.fill, "visibility", "none")
        map.setFilter(duIds.fill, ["==", "DU_ID", ""])
      }
      if (map.getLayer(duIds.outline)) {
        map.removeLayer(duIds.outline)
      }

      // Hide WBA layers
      const wbaIds = LAYER_IDS.wba
      if (map.getLayer(wbaIds.fill)) {
        map.setLayoutProperty(wbaIds.fill, "visibility", "none")
        map.setFilter(wbaIds.fill, ["==", "WBA_ID", ""])
      }
      if (map.getLayer(wbaIds.outline)) {
        map.removeLayer(wbaIds.outline)
      }

      // Fade out basemap dim
      if (map.getLayer(LAYER_IDS.basemapDim)) {
        fadeBasemapDim(map, false)
      }
    })
  }, [mapAPI, fadeBasemapDim])

  // Apply styling when data changes
  useEffect(() => {
    if (!enabled || !config || featureIds.length === 0) {
      clear()
      return
    }

    // Always clear before applying new styling (prevents accumulation)
    clear()

    // Small delay to ensure clear() completes
    const timeoutId = setTimeout(() => {
      mapAPI.withMap((mapRef) => {
        const map = mapRef.getMap()
        const layerIds = getLayerIds(config.layerType)
        const { fill: layerId, outline: outlineId } = layerIds
        const { idProperty, classFilter } = config

        // Check if fill layer exists
        if (!map.getLayer(layerId)) {
          console.warn(`Layer "${layerId}" not found in map style`)
          return
        }

        // Build filter expression
        const classFilterExpr = classFilter
          ? ["==", ["get", "Class"], classFilter]
          : true
        const idFilter = ["in", ["get", idProperty], ["literal", featureIds]]
        map.setFilter(layerId, ["all", classFilterExpr, idFilter])

        // Build color expression
        const colorPairs: (string | number)[] = []
        Object.entries(tierLookup).forEach(([featureId, tierLevel]) => {
          colorPairs.push(featureId)
          colorPairs.push(tierColors[tierLevel as TierLevel] || theme.palette.grey[500])
        })

        const colorExpression: MapboxExpression = [
          "match",
          ["get", idProperty],
          ...colorPairs,
          theme.palette.grey[500],
        ]

        // Apply fill styling
        map.setPaintProperty(layerId, "fill-color", colorExpression)
        map.setPaintProperty(layerId, "fill-opacity", [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 0.75,
          8, 0.55,
          10, 0.35,
        ])
        map.setLayoutProperty(layerId, "visibility", "visible")

        // Fade in basemap dim
        fadeBasemapDim(map, true)

        // Create outline layer if needed
        if (!map.getLayer(outlineId)) {
          const fillLayer = map.getLayer(layerId)
          if (fillLayer) {
            const sourceId = fillLayer.source as string
            const sourceLayer = (fillLayer as { "source-layer"?: string })["source-layer"]

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

        // Style outline layer
        if (map.getLayer(outlineId)) {
          map.setFilter(outlineId, ["all", classFilterExpr, idFilter])
          map.setPaintProperty(outlineId, "line-color", colorExpression)
          map.setPaintProperty(outlineId, "line-width", [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, 0.5,
            7, 1,
            9, 2,
            11, 3,
          ])
          map.setPaintProperty(outlineId, "line-opacity", 1)
          map.setPaintProperty(outlineId, "line-offset", [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, -0.25,
            7, -0.5,
            9, -1,
            11, -1.5,
          ])
          map.setLayoutProperty(outlineId, "visibility", "visible")
        }

        // Move river layers to top
        RIVER_LAYER_IDS.forEach((riverId) => {
          try {
            if (map.getLayer(riverId)) {
              map.moveLayer(riverId)
            }
          } catch {
            // Layer might not exist
          }
        })
      })
    }, 10)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [enabled, config, tierLookup, featureIds, tierColors, theme, mapAPI, clear, fadeBasemapDim])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear()
    }
  }, [clear])

  return { clear }
}
