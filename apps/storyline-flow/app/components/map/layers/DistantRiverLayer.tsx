"use client"

import { Source, Layer } from "@repo/map"
import { FreshWaterColor } from "../../helpers/colorPalette"
import { flowDrinkingRivers } from "@repo/data"

interface LayerProps {
  visible: boolean
}

export default function DistantRiversLayer({ visible }: LayerProps) {
  const visibilityValue = visible ? "visible" : "none"

  return (
    <>
      <Source
        id="distant-river-source"
        type="geojson"
        data={flowDrinkingRivers}
        lineMetrics={true}
      >
        <Layer
          id="distant-river-body"
          type="line"
          paint={{
            "line-color": FreshWaterColor,
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
    </>
  )
}
