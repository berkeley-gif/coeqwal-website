"use client"

import { Layer, Source } from "@repo/map"
import { OceanWaterColor } from "../../helpers/colorPalette"

const SOURCE_ID = "indigenous-waterway-names-source"
const SOURCE_LAYER = "indigenous_waterway_names.zip-bz7t28"

export default function IndigenousWaterwayNamesLayer({
  visible,
  opacity,
}: {
  visible: boolean
  opacity: number
}) {
  const layerOpacity = Math.max(0, Math.min(1, opacity))

  return (
    <Source id={SOURCE_ID} type="vector" url="mapbox://coeqwal.dpvfu6">
      <Layer
        id="indigenous-waterway-names-labels"
        type="symbol"
        source-layer={SOURCE_LAYER}
        layout={{
          "text-field": ["get", "name"],
          "text-font": ["Neue Haas Grotesk", "Arial Unicode MS Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 5, 11, 7, 14],
          "text-padding": 8,
          "text-max-width": 14,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          visibility: visible ? "visible" : "none",
        }}
        paint={{
          "text-color": "#fcfbfa",
          "text-opacity": layerOpacity,
          "text-halo-color": OceanWaterColor,
          "text-halo-width": 4,
          "text-halo-blur": 0.25,
        }}
      />
    </Source>
  )
}
