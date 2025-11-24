"use client"

import { Source, Layer } from "@repo/map"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"

interface RiversLayerProps {
  visible: boolean
  /** Animation progress from 0 (not drawn) to 1 (fully drawn). Controlled by scroll. */
  progress: number
}

export default function RiversLayer({ visible, progress }: RiversLayerProps) {
  if (!visible) return null

  // Clamp progress to [0, 1] to avoid floating-point precision errors
  const clampedProgress = Math.max(0, Math.min(1, progress))

  // Always show labels when rivers are visible (labels render independently of line animation)
  const showLabels = visible

  return (
    <>
      {/* SACRAMENTO RIVER */}
      <Source
        id="sacramento-river-source"
        type="geojson"
        data={sacramentoRiverMainstem}
        lineMetrics={true}
      >
        {/* Layer 1: Outer glow */}
        <Layer
          id="sacramento-river-glow"
          type="line"
          paint={{
            "line-color": "#4A90C9",
            "line-width": 7,
            "line-blur": 6,
            "line-opacity": 0.3,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 2: Main river body */}
        <Layer
          id="sacramento-river-body"
          type="line"
          paint={{
            "line-color": "#5B9DD6",
            "line-width": 3.5,
            "line-opacity": 0.85,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 3: Inner highlight */}
        <Layer
          id="sacramento-river-highlight"
          type="line"
          paint={{
            "line-color": "#8BBEE8",
            "line-width": 1.5,
            "line-opacity": 0.6,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

         {/* Layer 4: Label */}
          <Layer
            id="sacramento-river-label"
            type="symbol"
            layout={{
              "text-field": "Sacramento River",
              "text-font": ["Arial Unicode MS Regular"],
              "text-size": 16,
              "symbol-placement": "line",
              "text-rotation-alignment": "map",
              "text-keep-upright": true,
              "text-max-angle": 90,
              "symbol-spacing": 300,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
              "text-optional": false,
              visibility: showLabels ? "visible" : "none",
            }}
            paint={{
              "text-color": "#3182BD",
              "text-halo-color": "#ffffff",
              "text-halo-width": 2,
              "text-opacity": showLabels ? 1 : 0,
            }}
          />
      </Source>

      {/* SAN JOAQUIN RIVER */}
      <Source
        id="san-joaquin-river-source"
        type="geojson"
        data={sanJoaquinRiverMainstem}
        lineMetrics={true}
      >
        {/* Layer 1: Outer glow */}
        <Layer
          id="san-joaquin-river-glow"
          type="line"
          paint={{
            "line-color": "#4A90C9",
            "line-width": 7,
            "line-blur": 6,
            "line-opacity": 0.3,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 2: Main river body */}
        <Layer
          id="san-joaquin-river-body"
          type="line"
          paint={{
            "line-color": "#5B9DD6",
            "line-width": 3.5,
            "line-opacity": 0.85,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 3: Inner highlight */}
        <Layer
          id="san-joaquin-river-highlight"
          type="line"
          paint={{
            "line-color": "#8BBEE8",
            "line-width": 1.5,
            "line-opacity": 0.6,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

         {/* Layer 4: Label */}
          <Layer
            id="san-joaquin-river-label"
            type="symbol"
            layout={{
              "text-field": "San Joaquin River",
              "text-font": ["Arial Unicode MS Regular"],
              "text-size": 16,
              "symbol-placement": "line",
              "text-rotation-alignment": "map",
              "text-keep-upright": true,
              "text-max-angle": 90,
              "symbol-spacing": 300,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
              "text-optional": false,
              visibility: showLabels ? "visible" : "none",
            }}
            paint={{
              "text-color": "#3182BD",
              "text-halo-color": "#ffffff",
              "text-halo-width": 2,
              "text-opacity": showLabels ? 1 : 0,
            }}
          />
      </Source>
    </>
  )
}