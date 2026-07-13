"use client"

import { Layer, Source } from "@repo/map"
import { metroRiversEdited } from "@repo/data"
import { FreshWaterColor } from "../../helpers/colorPalette"
import type { LineFeatureCollection } from "../helpers/octilinearizeGeojson"

interface MetroRiverPrototypeLayerProps {
  visible: boolean
}

const RIVER_BODY_COLOR = FreshWaterColor
const RIVER_TROUGH_COLOR = "#080c46"

export default function MetroRiverPrototypeLayer({
  visible,
}: MetroRiverPrototypeLayerProps) {
  const visibilityValue = visible ? "visible" : "none"

  return (
    <Source
      id="metro-river-prototype"
      type="geojson"
      data={
        metroRiversEdited as unknown as LineFeatureCollection as unknown as GeoJSON.FeatureCollection
      }
    >
      <Layer
        id="metro-river-prototype-trough"
        type="line"
        paint={{
          "line-color": RIVER_TROUGH_COLOR,
          "line-width": 9,
          "line-opacity": 0.65,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
          visibility: visibilityValue,
        }}
      />
      <Layer
        id="metro-river-prototype-body"
        type="line"
        paint={{
          "line-color": RIVER_BODY_COLOR,
          "line-width": 6,
          "line-opacity": 1,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
          visibility: visibilityValue,
        }}
      />
    </Source>
  )
}
