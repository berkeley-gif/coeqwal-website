"use client"

import { Layer, Source } from "@repo/map"
import { INDIGENOUS_TERRITORY_PALETTE } from "./IndigenousTerritoriesLayer"

const SOURCE_ID = "current-indigenous-territories-source"
const SOURCE_LAYER = "indigenous_territories_curren-px68td"
const FILL_LAYER_ID = "current-indigenous-territories-fill"

// LAND_AREA_ provides a stable numeric seed so each territory receives a
// repeatable, palette-constrained color without relying on vector-tile order.
const COLOR_INDEX_EXPRESSION = [
  "%",
  ["floor", ["to-number", ["get", "LAND_AREA_"], 0]],
  INDIGENOUS_TERRITORY_PALETTE.length,
]

const FILL_COLOR_EXPRESSION = [
  "match",
  COLOR_INDEX_EXPRESSION,
  ...INDIGENOUS_TERRITORY_PALETTE.flatMap((color, index) => [index, color]),
  INDIGENOUS_TERRITORY_PALETTE[0],
]

export default function CurrentIndigenousTerritoriesLayer({
  visible,
  opacity,
}: {
  visible: boolean
  opacity: number
}) {
  const layerOpacity = Math.max(0, Math.min(1, opacity))

  return (
    <Source id={SOURCE_ID} type="vector" url="mapbox://coeqwal.dxc3qy">
      <Layer
        id={FILL_LAYER_ID}
        type="fill"
        source-layer={SOURCE_LAYER}
        paint={{
          "fill-color": FILL_COLOR_EXPRESSION as unknown as string,
          "fill-opacity": 0.62 * layerOpacity,
          "fill-outline-color": "rgba(255, 255, 255, 0.45)",
          "fill-antialias": true,
        }}
        layout={{ visibility: visible ? "visible" : "none" }}
      />
    </Source>
  )
}
