"use client"

import { Source, Layer } from "@repo/map"
import { precipitationPaintStyle } from "./mapLayerStyle"

interface PrecipitationLayerProps {
  visible: boolean
}

export default function PrecipitationLayer({
  visible,
}: PrecipitationLayerProps) {
  return (
    <Source
      id="precipitation-source"
      type="vector"
      url="mapbox://coeqwal.6dxtit1i"
    >
      <Layer
        id="precipitation-layer"
        type="fill"
        source-layer="region"
        paint={{
          ...precipitationPaintStyle,
          "fill-opacity": visible ? 1 : 0,
        }}
      />
    </Source>
  )
}
