"use client"

import { canalNetwork } from "@repo/data"
import { Layer, Source } from "@repo/map"
import {
  InfrastructureColor,
  InfrastructureOutlineColor,
  InfrastructureOutlineOpacity,
} from "../../helpers/colorPalette"

const SOURCE_ID = "infrastructure-canal-network-source"

export default function InfrastructureCanalNetworkLayer({
  visible,
}: {
  visible: boolean
}) {
  return (
    <Source
      id={SOURCE_ID}
      type="geojson"
      data={canalNetwork as unknown as GeoJSON.FeatureCollection}
    >
      <Layer
        id="infrastructure-canal-network-outline"
        type="line"
        paint={{
          "line-color": InfrastructureOutlineColor,
          "line-opacity": InfrastructureOutlineOpacity,
          "line-width": 7,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
          visibility: visible ? "visible" : "none",
        }}
      />
      <Layer
        id="infrastructure-canal-network-lines"
        type="line"
        paint={{
          "line-color": InfrastructureColor,
          "line-opacity": 1,
          "line-width": 5,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
          visibility: visible ? "visible" : "none",
        }}
      />
    </Source>
  )
}
