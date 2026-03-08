"use client"

import { Source, Layer } from "@repo/map"
import { InfrastructureColor } from "../../helpers/colorPalette"
import { flowDrinkingAqueducts } from "@repo/data"

interface LayerProps {
  visible: boolean
}

export default function CanalLayer({ visible }: LayerProps) {
  const visibilityValue = visible ? "visible" : "none"

  return (
    <>
      <Source
        id="distant-aqueduct-source"
        type="geojson"
        data={flowDrinkingAqueducts}
        lineMetrics={true}
      >
        <Layer
          id="distant-aqueduct-body"
          type="line"
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
    </>
  )
}
