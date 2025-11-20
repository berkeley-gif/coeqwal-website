"use client"

import { useState, useEffect } from "react"
import { Source, Layer } from "@repo/map"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"

interface RiversLayerProps {
  visible: boolean
}

export default function RiversLayer({ visible }: RiversLayerProps) {
  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    if (!visible) {
      setAnimationProgress(0)
      return
    }

    const duration = 3000
    const startTime = performance.now()
    let frameId: number

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimationProgress(progress)
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
      </Source>
    </>
  )
}

