"use client"

import { useState, useEffect } from "react"
import { Source, Layer } from "@repo/map"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"

interface RiversLayerProps {
  visible: boolean
}

export default function RiversLayer({ visible }: RiversLayerProps) {
  const [animationProgress, setAnimationProgress] = useState(0)
  const [showLabels, setShowLabels] = useState(false)

  useEffect(() => {
    if (!visible) {
      setAnimationProgress(0)
      setShowLabels(false)
      return
    }

    const duration = 3000
    const startTime = performance.now()
    let frameId: number

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Clamp progress to [0, 1] to avoid floating-point precision errors
      const clampedProgress = Math.max(0, Math.min(1, progress))
      setAnimationProgress(clampedProgress)

      // Show labels immediately when visible
      if (elapsed > 100) {
        setShowLabels(true)
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [visible])

  if (!visible) {
    return null
  }

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
            "line-trim-offset": [animationProgress, 1],
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
            "line-trim-offset": [animationProgress, 1],
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
