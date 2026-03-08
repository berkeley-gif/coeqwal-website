"use client"

import { Source, Layer } from "@repo/map"
import { OffWhiteColor } from "../../helpers/colorPalette"

interface LayerProps {
  visible: boolean
}

export default function CityBoundaryLayer({ visible }: LayerProps) {
  const visibilityValue = visible ? "visible" : "none"

  return (
    <Source
      id="city-boundary-source"
      type="vector"
      url="mapbox://coeqwal.7j5glhyx"
    >
      <Layer
        id="city-boundary"
        type="line"
        source-layer="city_boundaries_bay_socal-ccd0v4"
        paint={{
          "line-color": OffWhiteColor,
          "line-width": 2,
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
