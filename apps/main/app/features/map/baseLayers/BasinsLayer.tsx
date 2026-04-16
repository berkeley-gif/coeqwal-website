"use client"

/**
 * BasinsLayer - Map layer for Central Valley basins
 *
 * Displays basin polygons with fill and outline styling.
 * Visibility controlled by outcome visualization state.
 *
 * TODO: evaluate whether or not to use mapbox tile layer for this
 * (needs to be able to transfer geolocation outcomes to frontend)
 */

import { useMemo } from "react"
import { Source, Layer } from "@repo/map"
import { centralValleyBasins } from "@repo/data"
import { themeValues } from "@repo/ui/themes/theme"
import { useIsOutcomeVisualizationActive } from "../store"

const BASINS_FILL_PAINT = { "fill-color": "transparent", "fill-opacity": 0 }

interface BasinsLayerProps {
  visible: boolean
  /** Opacity for Sacramento/San Joaquin labels (0-1). Currently, Tulare label stays at full opacity bc always visible (no fade-in, fade-out). */
  riverBasinLabelsOpacity?: number
}

export default function BasinsLayer({
  visible,
  riverBasinLabelsOpacity = 1,
}: BasinsLayerProps) {
  const visibility = visible ? "visible" : "none"

  const isOutcomeActive = useIsOutcomeVisualizationActive()

  const outlineOpacity = isOutcomeActive ? 0.3 : 0.8
  const haloOpacity = isOutcomeActive ? 0.3 : 1
  const labelsOpacity = isOutcomeActive ? 0 : riverBasinLabelsOpacity

  const visibilityLayout = useMemo(() => ({ visibility }), [visibility])

  const haloPaint = useMemo(
    () => ({
      "line-color": "rgb(61, 41, 41)",
      "line-width": 3,
      "line-opacity": haloOpacity,
    }),
    [haloOpacity],
  )

  const outlinePaint = useMemo(
    () => ({
      "line-color": themeValues.palette.common.white,
      "line-width": 2,
      "line-opacity": outlineOpacity,
    }),
    [outlineOpacity],
  )

  const labelsLayout = useMemo(
    () => ({
      visibility,
      "text-field": ["get", "name"] as ["get", string],
      "text-font": ["Neue Haas Grotesk", "Arial Unicode MS Bold"],
      "text-size": 16,
      "text-anchor": "center" as const,
      "symbol-placement": "point" as const,
      "text-offset": [
        "case",
        ["==", ["get", "name"], "Sacramento River Basin"],
        [0, 0],
        ["==", ["get", "name"], "San Joaquin River Basin"],
        [0, 0],
        [0, 1],
      ],
    }),
    [visibility],
  )

  const labelsPaint = useMemo(
    () => ({
      "text-color": themeValues.palette.common.white,
      "text-halo-color": "rgb(61, 41, 41)",
      "text-halo-width": 2,
      "text-opacity": [
        "case",
        ["==", ["get", "name"], "Sacramento River Basin"],
        labelsOpacity,
        ["==", ["get", "name"], "San Joaquin River Basin"],
        labelsOpacity,
        isOutcomeActive ? 0 : 1,
      ],
    }),
    [labelsOpacity, isOutcomeActive],
  )

  return (
    <Source id="basins-source" type="geojson" data={centralValleyBasins}>
      <Layer
        id="basins-layer"
        type="fill"
        layout={visibilityLayout}
        paint={BASINS_FILL_PAINT}
      />
      <Layer
        id="basins-outline-halo"
        type="line"
        layout={visibilityLayout}
        paint={haloPaint}
      />
      <Layer
        id="basins-outline-layer"
        type="line"
        layout={visibilityLayout}
        paint={outlinePaint}
      />
      <Layer
        id="basins-labels"
        type="symbol"
        layout={labelsLayout}
        paint={labelsPaint}
      />
    </Source>
  )
}
