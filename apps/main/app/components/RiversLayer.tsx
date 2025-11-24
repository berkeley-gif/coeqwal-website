"use client"

import { Source, Layer } from "@repo/map"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"

interface RiversLayerProps {
  visible: boolean
  /** Animation progress from 0 (not drawn) to 1 (fully drawn). Controlled by scroll. */
  progress: number
}

export default function RiversLayer({ visible, progress }: RiversLayerProps) {
  if (!visible) {
    return null
  }

  // Clamp progress to [0, 1] to avoid floating-point precision errors
  const clampedProgress = Math.max(0, Math.min(1, progress))
  
  // Debug: Log the line-trim-offset values
  console.log(`RiversLayer - progress: ${progress.toFixed(3)}, clampedProgress: ${clampedProgress.toFixed(3)}, line-trim-offset: [${clampedProgress.toFixed(3)}, 1]`)
  
  // Show labels when rivers are 10% drawn
  const showLabels = clampedProgress > 0.1

  return (
    <>
      <Source
        id="sacramento-river-source"
        type="geojson"
        data={sacramentoRiverMainstem}
        lineMetrics={true}
      >
        <Layer
          id="sacramento-river-layer"
          type="line"
          paint={{
            "line-color": "#64A4D6",
            "line-width": 2,
            "line-opacity": 1,
            "line-trim-offset": [clampedProgress, 1],
          }}
        />
        {showLabels && (
          <Layer
            id="sacramento-river-label"
            type="symbol"
            layout={{
              "text-field": "Sacramento River",
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 16,
              "symbol-placement": "line",
              "symbol-spacing": 500,
              "text-rotation-alignment": "map",
              "text-keep-upright": true,
              "text-max-angle": 45,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
              visibility: "visible",
            }}
            paint={{
              "text-color": "#64A4D6",
              "text-halo-color": "#ffffff",
              "text-halo-width": 3,
              "text-opacity": 1,
            }}
          />
        )}
      </Source>

      <Source
        id="san-joaquin-river-source"
        type="geojson"
        data={sanJoaquinRiverMainstem}
        lineMetrics={true}
      >
        <Layer
          id="san-joaquin-river-layer"
          type="line"
          paint={{
            "line-color": "#64A4D6",
            "line-width": 2,
            "line-opacity": 1,
            "line-trim-offset": [clampedProgress, 1],
          }}
        />
        {showLabels && (
          <Layer
            id="san-joaquin-river-label"
            type="symbol"
            layout={{
              "text-field": "San Joaquin River",
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 16,
              "symbol-placement": "line",
              "symbol-spacing": 500,
              "text-rotation-alignment": "map",
              "text-keep-upright": true,
              "text-max-angle": 45,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
              visibility: "visible",
            }}
            paint={{
              "text-color": "#64A4D6",
              "text-halo-color": "#ffffff",
              "text-halo-width": 3,
              "text-opacity": 1,
            }}
          />
        )}
      </Source>
    </>
  )
}
