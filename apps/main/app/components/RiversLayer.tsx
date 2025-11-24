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
        {/* Layer 1: Outer glow - creates soft atmospheric effect */}
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
        
        {/* Layer 2: Main river body - solid water color */}
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
        
        {/* Layer 3: Inner highlight - creates depth and shine */}
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
              "text-color": "#4A90C9",
              "text-halo-color": "#ffffff",
              "text-halo-width": 3,
              "text-halo-blur": 1,
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
        {/* Layer 1: Outer glow - creates soft atmospheric effect */}
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
        
        {/* Layer 2: Main river body - solid water color */}
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
        
        {/* Layer 3: Inner highlight - creates depth and shine */}
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
              "text-color": "#4A90C9",
              "text-halo-color": "#ffffff",
              "text-halo-width": 3,
              "text-halo-blur": 1,
              "text-opacity": 1,
            }}
          />
        )}
      </Source>
    </>
  )
}
