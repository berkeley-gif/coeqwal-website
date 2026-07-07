"use client"

import { Layer, Source } from "@repo/map"
import { FreshWaterColor, RiverWaterColor } from "../../helpers/colorPalette"

const DELTA_NATURAL_RIVER_SOURCE_ID = "delta-natural-river-source"
const DELTA_NATURAL_RIVER_HALO_LAYER_ID = "delta-natural-river-halo"
const DELTA_NATURAL_RIVER_BODY_LAYER_ID = "delta-natural-river-body"

export default function DeltaNaturalRiverLayer({
  visible,
}: {
  visible: boolean
}) {
  const visibilityValue = visible ? "visible" : "none"

  return (
    <Source
      id={DELTA_NATURAL_RIVER_SOURCE_ID}
      type="vector"
      url="mapbox://coeqwal.4wb0q3"
    >
      <Layer
        id={DELTA_NATURAL_RIVER_HALO_LAYER_ID}
        type="line"
        source-layer="delta_natural_rivers.zip-q7htpc"
        paint={{
          "line-color": "#07142c",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7,
            3,
            10,
            6,
            12,
            9,
          ],
          "line-opacity": visible ? 0.72 : 0,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
          visibility: visibilityValue,
        }}
      />
      <Layer
        id={DELTA_NATURAL_RIVER_BODY_LAYER_ID}
        type="line"
        source-layer="delta_natural_rivers.zip-q7htpc"
        paint={{
          "line-color": RiverWaterColor,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7,
            1.8,
            10,
            3.6,
            12,
            5.8,
          ],
          "line-opacity": visible ? 1 : 0,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
          visibility: visibilityValue,
        }}
      />
      <Layer
        id="delta-natural-river-highlight"
        type="line"
        source-layer="delta_natural_rivers.zip-q7htpc"
        paint={{
          "line-color": FreshWaterColor,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7,
            0.8,
            10,
            1.4,
            12,
            2.2,
          ],
          "line-opacity": visible ? 0.36 : 0,
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
