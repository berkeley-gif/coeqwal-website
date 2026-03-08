"use client"

import { Source, Layer } from "@repo/map"
import { InfrastructureColor } from "../../helpers/colorPalette"

interface LayerProps {
  visible: boolean
}

export default function DeltaCanalLayer({ visible }: LayerProps) {
  const visibilityValue = visible ? "visible" : "none"

  return (
    <Source
      id="delta-canal-source"
      type="vector"
      url="mapbox://coeqwal.85rgmvo5"
    >
      <Layer
        id="delta-canal"
        type="line"
        source-layer="delta_canal_v2-8yjrvw"
        paint={{
          "line-color": InfrastructureColor,
          "line-width": 3,
          "line-opacity": 1,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
          visibility: visibilityValue,
        }}
      />
    </Source>
  )
}
