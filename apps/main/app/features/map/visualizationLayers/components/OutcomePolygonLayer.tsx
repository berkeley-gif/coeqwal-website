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
import type { TierColorMap, LayerType } from "../types"
import { LAYER_IDS, RESERVOIR_CALSIM_TO_GNISIDLABEL } from "../../config/outcomeLayerRegistry"

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
      return { fillId: LAYER_IDS.delta.fill, outlineId: LAYER_IDS.delta.outline }
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
 * Translate CalSim IDs to gnisidlabel for reservoir layer
 */
function translateReservoirIds(
  featureIds: string[],
  tierColorMap: TierColorMap,
): { translatedIds: string[]; translatedColorMap: TierColorMap } {
  const translatedIds = featureIds
    .map((id) => RESERVOIR_CALSIM_TO_GNISIDLABEL[id])
    .filter((v): v is string => !!v)

  // Dedupe (SLUIS_CVP and SLUIS_SWP both map to "San Luis Reservoir")
  const uniqueIds = [...new Set(translatedIds)]

  const translatedColorMap: TierColorMap = {}
  Object.entries(tierColorMap).forEach(([calsimId, color]) => {
    const gnisLabel = RESERVOIR_CALSIM_TO_GNISIDLABEL[calsimId]
    if (gnisLabel) {
      // Keep the first color (or could take worst tier)
      if (!translatedColorMap[gnisLabel]) {
        translatedColorMap[gnisLabel] = color
      }
    }
  })

  return { translatedIds: uniqueIds, translatedColorMap }
}

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
}: OutcomePolygonLayerProps) {
  const theme = useTheme()
  const { mapRef } = useMap()
  const outlineCreatedRef = useRef(false)

  // Get layer IDs based on type
  const { fillId, outlineId } = useMemo(
    () => getLayerIds(layerType, mapboxLayerId),
    [layerType, mapboxLayerId],
  )

  // For reservoir layer, translate IDs
  const { translatedIds, translatedColorMap } = useMemo(() => {
    if (layerType === "reservoir") {
      return translateReservoirIds(featureIds, tierColorMap)
    }
    return { translatedIds: featureIds, translatedColorMap: tierColorMap }
  }, [layerType, featureIds, tierColorMap])

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

    const map = mapRef.current.getMap()
    if (!map.getLayer(fillId)) return

    // Apply visibility
    map.setLayoutProperty(fillId, "visibility", visible ? "visible" : "none")

    if (!visible) {
      // Hide outline too
      if (map.getLayer(outlineId)) {
        map.setLayoutProperty(outlineId, "visibility", "none")
      }
      return
    }

    // Apply filter
    if (filterExpression) {
      map.setFilter(fillId, filterExpression)
    } else {
      map.setFilter(fillId, null)
    }

    // Special handling for reservoir: keep natural fill color
    if (layerType === "reservoir") {
      // Reservoir layer just shows/hides, labels are handled separately
      return
    }

    // Loading state: transparent fill (outline will be white)
    if (!hasTierData) {
      map.setPaintProperty(fillId, "fill-color", "transparent")
      map.setPaintProperty(fillId, "fill-opacity", 0)
    }
    // Special handling for Delta: single-feature, apply tier color directly
    else if (layerType === "delta") {
      map.setPaintProperty(fillId, "fill-color", colorExpression)
      map.setPaintProperty(fillId, "fill-opacity", 0.9)
    } else {
      // Apply fill color and opacity for demand-units, WBA, etc.
      map.setPaintProperty(fillId, "fill-color", colorExpression)
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

    // Determine outline color: white for loading state, tier color otherwise
    const outlineColor = hasTierData ? colorExpression : "#ffffff"

    // Create outline layer if it doesn't exist
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
              "line-color": outlineColor,
              "line-width": hasTierData ? 0.5 : 1,
              "line-opacity": hasTierData ? 1 : 0.30,
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

    // Style outline layer
    if (map.getLayer(outlineId)) {
      if (filterExpression) {
        map.setFilter(outlineId, filterExpression)
      }
      map.setPaintProperty(outlineId, "line-color", outlineColor)

      // Loading state: thin white outline
      if (!hasTierData) {
        map.setPaintProperty(outlineId, "line-width", 1)
        map.setPaintProperty(outlineId, "line-opacity", 0.30)
        map.setPaintProperty(outlineId, "line-offset", 0)
      } else if (layerType === "delta") {
        map.setPaintProperty(outlineId, "line-width", 0.5)
        map.setPaintProperty(outlineId, "line-opacity", 1)
        map.setPaintProperty(outlineId, "line-offset", 0)
      } else {
        map.setPaintProperty(outlineId, "line-opacity", 1)
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
  }, [
    mapRef,
    fillId,
    outlineId,
    visible,
    colorExpression,
    filterExpression,
    layerType,
    hasTierData,
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

      // Remove outline layer we created
      if (map.getLayer(outlineId) && outlineCreatedRef.current) {
        try {
          map.removeLayer(outlineId)
        } catch {
          /* ignore */
        }
        outlineCreatedRef.current = false
      }
    }
  }, [mapRef, fillId, outlineId, idProperty])

  // This component doesn't render anything - it just manages Mapbox layer styling
  return null
}

