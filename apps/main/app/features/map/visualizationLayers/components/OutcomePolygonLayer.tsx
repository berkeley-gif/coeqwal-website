"use client"

/**
 * OutcomePolygonLayer - Declarative polygon visualization layer
 *
 * Applies tier-based coloring to Mapbox polygon layers (demand-units, WBA, delta, reservoir).
 * The styling is controlled entirely through props - no imperative Mapbox calls from outside.
 *
 */

import { useEffect, useMemo, useRef } from "react"
import { useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import { useMapReady } from "../../store"
import type { TierColorMap, LayerType } from "../types"
import {
  LAYER_IDS,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../config/outcomeLayerRegistry"

// Mapbox filter type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterSpecification = any

// ============================================================================
// TYPES
// ============================================================================

interface OutcomePolygonLayerProps {
  /** Map from feature ID to hex color string */
  tierColorMap: TierColorMap
  /** Layer type identifier */
  layerType: LayerType
  /** Property name for feature ID matching */
  idProperty?: string
  /** List of feature IDs to show */
  featureIds: string[]
  /** Class filter for demand-units layer */
  classFilter?: "Agriculture" | "Urban" | "Refuge" | "N/A"
  /** Whether layer should be visible */
  visible: boolean
  /** Mapbox layer ID (optional, defaults based on layerType) */
  mapboxLayerId?: string
  /** Maps tier-data IDs to Mapbox feature property values */
  featureIdMap?: Record<string, string>
  /** Transparent fill with a broad tier-colored outline */
  outlineOnly?: boolean
}

// Mapbox expression type
type MapboxExpression = ["match", ["get", string], ...unknown[]]

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build a Mapbox match expression from a color map
 */
function buildColorExpression(
  tierColorMap: TierColorMap,
  idProperty: string,
  defaultColor: string,
): MapboxExpression | string {
  const colorPairs: (string | number)[] = []

  Object.entries(tierColorMap).forEach(([featureId, color]) => {
    colorPairs.push(featureId)
    colorPairs.push(color)
  })

  if (colorPairs.length === 0) {
    return defaultColor
  }

  return ["match", ["get", idProperty], ...colorPairs, defaultColor]
}

/**
 * Get Mapbox layer ID from layer type
 */
function getLayerIds(layerType: LayerType, mapboxLayerId?: string) {
  if (mapboxLayerId) {
    return { fillId: mapboxLayerId, outlineId: `${mapboxLayerId}-outline` }
  }

  switch (layerType) {
    case "demand-units":
      return {
        fillId: LAYER_IDS.demandUnits.fill,
        outlineId: LAYER_IDS.demandUnits.outline,
      }
    case "wba":
      return { fillId: LAYER_IDS.wba.fill, outlineId: LAYER_IDS.wba.outline }
    case "delta":
      return {
        fillId: LAYER_IDS.delta.fill,
        outlineId: LAYER_IDS.delta.outline,
      }
    case "reservoir":
      return {
        fillId: LAYER_IDS.reservoir.fill,
        outlineId: LAYER_IDS.reservoir.outline,
      }
    default:
      return { fillId: "", outlineId: "" }
  }
}

/**
 * Translate feature IDs using a mapping (API IDs → Mapbox property values).
 * Reservoir layer uses the hardcoded RESERVOIR_CALSIM_TO_GNISIDLABEL mapping;
 * other layers may supply a per-outcome featureIdMap from the registry.
 */
function translateFeatureIds(
  featureIds: string[],
  tierColorMap: TierColorMap,
  mapping: Record<string, string>,
): { translatedIds: string[]; translatedColorMap: TierColorMap } {
  const translatedIds = featureIds
    .map((id) => mapping[id])
    .filter((v): v is string => !!v)

  const uniqueIds = [...new Set(translatedIds)]

  const translatedColorMap: TierColorMap = {}
  Object.entries(tierColorMap).forEach(([id, color]) => {
    const mapped = mapping[id]
    if (mapped && !translatedColorMap[mapped]) {
      translatedColorMap[mapped] = color
    }
  })

  return { translatedIds: uniqueIds, translatedColorMap }
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Duration (ms) for the fill/outline fade-in when tier data first becomes available */
const FADE_IN_DURATION = 350

/** Duration (ms) for the color crossfade when data changes while already visible */
const COLOR_TRANSITION_DURATION = 400

// ============================================================================
// COMPONENT
// ============================================================================

export function OutcomePolygonLayer({
  tierColorMap,
  layerType,
  idProperty,
  featureIds,
  classFilter,
  visible,
  mapboxLayerId,
  featureIdMap,
  outlineOnly,
}: OutcomePolygonLayerProps) {
  const theme = useTheme()
  const { mapRef } = useMap()
  const mapReady = useMapReady()
  const outlineCreatedRef = useRef(false)
  /** RAF handle for the deferred fade-in; cancelled if the effect re-runs first */
  const fadeRafRef = useRef<number | null>(null)
  /** Tracks whether the layer was already showing colored data (for crossfade vs fade-in) */
  const wasShowingDataRef = useRef(false)
  const prevFillIdRef = useRef<string>("")

  // Get layer IDs based on type
  const { fillId, outlineId } = useMemo(
    () => getLayerIds(layerType, mapboxLayerId),
    [layerType, mapboxLayerId],
  )

  // Reset showing-data flag when the underlying Mapbox layer changes so we
  // always go through the full fade-in path for the new layer.
  if (fillId !== prevFillIdRef.current) {
    prevFillIdRef.current = fillId
    wasShowingDataRef.current = false
  }

  // Translate API IDs → Mapbox feature property values when needed
  const { translatedIds, translatedColorMap } = useMemo(() => {
    if (layerType === "reservoir") {
      return translateFeatureIds(
        featureIds,
        tierColorMap,
        RESERVOIR_CALSIM_TO_GNISIDLABEL,
      )
    }
    if (featureIdMap && Object.keys(featureIdMap).length > 0) {
      return translateFeatureIds(featureIds, tierColorMap, featureIdMap)
    }
    return { translatedIds: featureIds, translatedColorMap: tierColorMap }
  }, [layerType, featureIds, tierColorMap, featureIdMap])

  // Check if we have tier data loaded
  const hasTierData = Object.keys(translatedColorMap).length > 0

  // Build color expression
  const colorExpression = useMemo(() => {
    const colorMapEntries = Object.entries(translatedColorMap)

    // No tier data yet - will use transparent fill with white outline
    if (colorMapEntries.length === 0) {
      return "transparent"
    }

    // Single-feature outcome (no idProperty): use the first/only color directly
    if (!idProperty) {
      const firstEntry = colorMapEntries[0]
      return firstEntry ? firstEntry[1] : "transparent"
    }

    // Multi-feature outcome: build a match expression
    return buildColorExpression(
      translatedColorMap,
      idProperty,
      theme.palette.grey[500],
    )
  }, [translatedColorMap, idProperty, theme.palette.grey])

  // Build filter expression
  const filterExpression = useMemo((): FilterSpecification | null => {
    const conditions: FilterSpecification[] = []

    if (classFilter) {
      conditions.push(["==", ["get", "Class"], classFilter])
    }

    if (idProperty && translatedIds.length > 0) {
      conditions.push(["in", ["get", idProperty], ["literal", translatedIds]])
    }

    if (conditions.length === 0) return null
    if (conditions.length === 1) return conditions[0]
    return ["all", ...conditions] as FilterSpecification
  }, [classFilter, idProperty, translatedIds])

  // Apply styling effect
  useEffect(() => {
    if (!mapRef?.current || !fillId) return

    // Style is being reloaded — reset state so the next run (mapReady = true)
    // always uses the full fade-in path with proper paint initialization.
    if (!mapReady) {
      wasShowingDataRef.current = false
      outlineCreatedRef.current = false
      return
    }

    const map = mapRef.current.getMap()
    if (!map.getLayer(fillId)) {
      outlineCreatedRef.current = false
      wasShowingDataRef.current = false
      return
    }

    // Cancel any pending deferred fade-in from a previous run
    if (fadeRafRef.current !== null) {
      cancelAnimationFrame(fadeRafRef.current)
      fadeRafRef.current = null
    }

    if (!visible) {
      // Reset opacity to 0 instantly (no transition) so the next show always
      // starts from transparent and can fade in cleanly.
      map.setPaintProperty(fillId, "fill-opacity-transition", {
        duration: 0,
        delay: 0,
      })
      map.setPaintProperty(fillId, "fill-opacity", 0)
      map.setLayoutProperty(fillId, "visibility", "none")

      if (map.getLayer(outlineId)) {
        map.setPaintProperty(outlineId, "line-opacity-transition", {
          duration: 0,
          delay: 0,
        })
        map.setPaintProperty(outlineId, "line-opacity", 0)
        map.setLayoutProperty(outlineId, "visibility", "none")
      }
      wasShowingDataRef.current = false
      return
    }

    // Apply filter
    if (filterExpression) {
      map.setFilter(fillId, filterExpression)
    } else {
      map.setFilter(fillId, null)
    }

    // Loading state: keep fill invisible and suppress the outline entirely.
    if (!hasTierData) {
      map.setPaintProperty(fillId, "fill-color", "transparent")
      map.setPaintProperty(fillId, "fill-opacity-transition", {
        duration: 0,
        delay: 0,
      })
      map.setPaintProperty(fillId, "fill-opacity", 0)
      map.setLayoutProperty(fillId, "visibility", "visible")
      if (map.getLayer(outlineId)) {
        map.setLayoutProperty(outlineId, "visibility", "none")
      }
      wasShowingDataRef.current = false
      return
    }

    // ── Crossfade path: data was already showing, just update colors ──
    // Mapbox interpolates fill-color and line-color natively, so we only
    // need to set the transition duration and update the expression.
    // Always ensure visibility is "visible" — the layer may have been hidden
    // by a previous unmount cleanup when switching between different polygon
    // layer types (e.g. demand-units → calsim-wba).
    if (wasShowingDataRef.current) {
      map.setLayoutProperty(fillId, "visibility", "visible")
      map.setPaintProperty(fillId, "fill-color-transition", {
        duration: COLOR_TRANSITION_DURATION,
        delay: 0,
      })
      map.setPaintProperty(fillId, "fill-color", colorExpression)

      if (outlineOnly) {
        map.setPaintProperty(fillId, "fill-opacity", 0)
      }

      if (map.getLayer(outlineId)) {
        if (filterExpression) {
          map.setFilter(outlineId, filterExpression)
        }
        map.setLayoutProperty(outlineId, "visibility", "visible")
        map.setPaintProperty(outlineId, "line-color-transition", {
          duration: COLOR_TRANSITION_DURATION,
          delay: 0,
        })
        map.setPaintProperty(outlineId, "line-color", colorExpression)
      }
      return
    }

    // ── Initial fade-in path: first time data becomes available ──
    // Step 1 (this frame): apply colors, arm the transition spec, set opacity to 0,
    // and make the layer visible at opacity 0. Mapbox renders one frame at opacity 0.
    map.setPaintProperty(fillId, "fill-color", colorExpression)
    map.setPaintProperty(fillId, "fill-opacity-transition", {
      duration: FADE_IN_DURATION,
      delay: 0,
    })
    map.setPaintProperty(fillId, "fill-opacity", 0)
    map.setLayoutProperty(fillId, "visibility", "visible")

    // Reset stale ref if the outline was destroyed (e.g. basemap style change)
    if (!map.getLayer(outlineId) && outlineCreatedRef.current) {
      outlineCreatedRef.current = false
    }

    // Create outline layer if it doesn't exist, starting at opacity 0
    if (!map.getLayer(outlineId) && !outlineCreatedRef.current) {
      const fillLayer = map.getLayer(fillId)
      if (fillLayer) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sourceId = (fillLayer as any).source as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sourceLayer = (fillLayer as any)["source-layer"]

        try {
          map.addLayer({
            id: outlineId,
            type: "line",
            source: sourceId,
            "source-layer": sourceLayer,
            paint: {
              "line-color": colorExpression,
              "line-width": 0.5,
              "line-opacity": 0,
              "line-offset": -0.25,
            },
            layout: { visibility: "none" },
          })
          outlineCreatedRef.current = true
        } catch {
          // Layer might already exist
        }
      }
    }

    // Style outline (still at opacity 0, visibility none for now)
    if (map.getLayer(outlineId)) {
      if (filterExpression) {
        map.setFilter(outlineId, filterExpression)
      }
      map.setPaintProperty(outlineId, "line-color", colorExpression)
      map.setPaintProperty(outlineId, "line-opacity-transition", {
        duration: FADE_IN_DURATION,
        delay: 0,
      })
      map.setPaintProperty(outlineId, "line-opacity", 0)

      if (outlineOnly) {
        map.setPaintProperty(outlineId, "line-width", 4)
        map.setPaintProperty(outlineId, "line-offset", 0)
      } else if (layerType === "delta") {
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
    }

    // Step 2 (next frame): now that Mapbox has rendered one frame at opacity 0
    // with the transition spec already armed, changing the opacity triggers the
    // smooth fade-in. Without this RAF split, Mapbox batches the "set to 0" and
    // "set to target" in the same frame and skips the transition.
    fadeRafRef.current = requestAnimationFrame(() => {
      fadeRafRef.current = null
      if (!map.getLayer(fillId)) return

      if (outlineOnly) {
        map.setPaintProperty(fillId, "fill-opacity", 0)
      } else if (layerType === "delta") {
        map.setPaintProperty(fillId, "fill-opacity", 0.9)
      } else {
        map.setPaintProperty(fillId, "fill-opacity", [
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
      }

      if (map.getLayer(outlineId)) {
        map.setPaintProperty(outlineId, "line-opacity", 1)
        map.setLayoutProperty(outlineId, "visibility", "visible")
      }

      wasShowingDataRef.current = true
    })

    return () => {
      if (fadeRafRef.current !== null) {
        cancelAnimationFrame(fadeRafRef.current)
        fadeRafRef.current = null
      }
    }
  }, [
    mapRef,
    fillId,
    outlineId,
    visible,
    colorExpression,
    filterExpression,
    layerType,
    hasTierData,
    outlineOnly,
    mapReady,
  ])

  // Cleanup on unmount
  useEffect(() => {
    // Capture ref value at effect time to use in cleanup
    const currentMapRef = mapRef?.current

    return () => {
      if (!currentMapRef) return
      const map = currentMapRef.getMap()

      // Hide layers
      if (map.getLayer(fillId)) {
        map.setLayoutProperty(fillId, "visibility", "none")
        map.setFilter(fillId, ["==", idProperty || "id", ""])
      }

      if (map.getLayer(outlineId)) {
        if (outlineCreatedRef.current) {
          try {
            map.removeLayer(outlineId)
          } catch {
            /* ignore */
          }
          outlineCreatedRef.current = false
        } else {
          map.setLayoutProperty(outlineId, "visibility", "none")
        }
      }
    }
  }, [mapRef, fillId, outlineId, idProperty])

  // This component doesn't render anything - it just manages Mapbox layer styling
  return null
}
