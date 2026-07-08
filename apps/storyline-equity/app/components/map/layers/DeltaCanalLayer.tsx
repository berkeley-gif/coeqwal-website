"use client"

import { Layer, Source } from "@repo/map"
import { InfrastructureColor } from "../../helpers/colorPalette"

const DELTA_CANAL_SOURCE_ID = "delta-modern-canal-source"
const DELTA_CANAL_LAYER_ID = "delta-modern-canal"

export default function DeltaCanalLayer({ visible }: { visible: boolean }) {
  const visibilityValue = visible ? "visible" : "none"

  return (
    <Source
      id={DELTA_CANAL_SOURCE_ID}
      type="vector"
      url="mapbox://coeqwal.t4z82q"
    >
      <Layer
        id={DELTA_CANAL_LAYER_ID}
        type="line"
        source-layer="nocal_pipes.zip-e6z26z"
        paint={{
          "line-color": InfrastructureColor,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7,
            1.4,
            10,
            3.2,
            12,
            5,
          ],
          "line-opacity": visible ? 0.95 : 0,
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
