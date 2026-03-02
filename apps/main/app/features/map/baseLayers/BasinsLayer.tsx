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

import { Source, Layer } from "@repo/map"
import { centralValleyBasins } from "@repo/data"
import { themeValues } from "@repo/ui/themes/theme"
import { useIsOutcomeVisualizationActive } from "../store"

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

  // When outcome visualization is active, fade labels and outlines
  const isOutcomeActive = useIsOutcomeVisualizationActive()

  // Fade outlines to 30% when outcome is active
  const outlineOpacity = isOutcomeActive ? 0.3 : 0.8
  const haloOpacity = isOutcomeActive ? 0.3 : 1

  // Hide all labels when outcome is active
  const labelsOpacity = isOutcomeActive ? 0 : riverBasinLabelsOpacity

  return (
    <Source id="basins-source" type="geojson" data={centralValleyBasins}>
      <Layer
        id="basins-layer"
        type="fill"
        layout={{ visibility }}
        paint={{
          "fill-color": "transparent",
          "fill-opacity": 0,
        }}
      />
      {/* Halo layer - thicker line underneath */}
      <Layer
        id="basins-outline-halo"
        type="line"
        layout={{ visibility }}
        paint={{
          "line-color": "rgb(61, 41, 41)",
          "line-width": 3,
          "line-opacity": haloOpacity,
        }}
      />
      {/* Main outline layer on top */}
      <Layer
        id="basins-outline-layer"
        type="line"
        layout={{ visibility }}
        paint={{
          "line-color": themeValues.palette.common.white,
          "line-width": 2,
          "line-opacity": outlineOpacity,
        }}
      />
      <Layer
        id="basins-labels"
        type="symbol"
        layout={{
          visibility,
          "text-field": ["get", "name"],
          "text-font": ["Neue Haas Grotesk", "Arial Unicode MS Bold"],
          "text-size": 16,
          "text-anchor": "center",
          "symbol-placement": "point",
          "text-offset": [
            "case",
            ["==", ["get", "name"], "Sacramento River Basin"],
            [0, 0],
            ["==", ["get", "name"], "San Joaquin River Basin"],
            [0, 0],
            [0, 1], // Tulare - slight adjustment down
          ],
        }}
        paint={{
          "text-color": themeValues.palette.common.white,
          "text-halo-color": "rgb(61, 41, 41)",
          "text-halo-width": 2,
          // Only fade Sacramento and San Joaquin labels; Tulare stays visible
          // All labels hidden when outcome visualization is active
          "text-opacity": [
            "case",
            ["==", ["get", "name"], "Sacramento River Basin"],
            labelsOpacity,
            ["==", ["get", "name"], "San Joaquin River Basin"],
            labelsOpacity,
            isOutcomeActive ? 0 : 1, // Tulare and other labels - hidden when outcome active
          ],
        }}
      />
    </Source>
  )
}
