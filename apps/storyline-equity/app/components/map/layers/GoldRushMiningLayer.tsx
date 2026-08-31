"use client"

import { Layer, Source } from "@repo/map"
import { InfrastructureColor } from "../../helpers/colorPalette"

const MINE_SOURCE_ID = "gold-rush-gold-mines-source"
const MINE_SOURCE_LAYER = "goldrush_gold_mine.zip-0frcly"
const DITCH_SOURCE_ID = "gold-rush-ditches-source"
const DITCH_SOURCE_LAYER = "goldrush_ditches.zip-u1ob4t"

function revealProgress(progress: number, start: number, end: number) {
  return Math.min(1, Math.max(0, (progress - start) / (end - start)))
}

export default function GoldRushMiningLayer({
  visible,
  progress,
}: {
  visible: boolean
  progress: number
}) {
  const mineOpacity = visible ? revealProgress(progress, 0, 0.06) * 0.8 : 0
  const ditchOpacity = visible ? revealProgress(progress, 0.14, 0.24) : 0
  const visibility = visible ? "visible" : "none"

  return (
    <>
      <Source id={DITCH_SOURCE_ID} type="vector" url="mapbox://coeqwal.73yzte">
        <Layer
          id="gold-rush-ditches-lines"
          type="line"
          source-layer={DITCH_SOURCE_LAYER}
          paint={{
            "line-color": InfrastructureColor,
            "line-width": 3,
            "line-opacity": ditchOpacity,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
            visibility,
          }}
        />
      </Source>

      <Source id={MINE_SOURCE_ID} type="vector" url="mapbox://coeqwal.peazl7">
        <Layer
          id="gold-rush-gold-mines-points"
          type="circle"
          source-layer={MINE_SOURCE_LAYER}
          paint={{
            "circle-color": InfrastructureColor,
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 2, 9, 4],
            "circle-opacity": mineOpacity,
          }}
          layout={{ visibility }}
        />
      </Source>
    </>
  )
}
