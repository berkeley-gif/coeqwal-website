"use client"

import { Layer, Marker, Source } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { InfrastructureColor } from "../../helpers/colorPalette"
import MiningIcon from "../markers/MiningIcon"
import {
  GOLD_RUSH_DITCHES_PROGRESS,
  GOLD_RUSH_MINES_PROGRESS,
} from "../../../store"

const MINE_SOURCE_ID = "gold-rush-gold-mines-source"
const MINE_SOURCE_LAYER = "goldrush_gold_mine.zip-0frcly"
const DITCH_SOURCE_ID = "gold-rush-ditches-source"
const DITCH_SOURCE_LAYER = "goldrush_ditches.zip-u1ob4t"
const MINING_ICON_COORDINATE: [number, number] = [-121.1, 39.09]

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
  const showMines = visible && progress >= GOLD_RUSH_MINES_PROGRESS
  const showDitches = visible && progress >= GOLD_RUSH_DITCHES_PROGRESS
  const mineOpacity = showMines
    ? revealProgress(progress, GOLD_RUSH_MINES_PROGRESS, 0.36)
    : 0
  const ditchOpacity = showDitches
    ? revealProgress(progress, GOLD_RUSH_DITCHES_PROGRESS, 0.52) * 0.7
    : 0
  const visibility = visible ? "visible" : "none"

  return (
    <>
      {showDitches ? (
        <Source
          id={DITCH_SOURCE_ID}
          type="vector"
          url="mapbox://coeqwal.73yzte"
        >
          <Layer
            id="gold-rush-ditches-lines"
            type="line"
            source-layer={DITCH_SOURCE_LAYER}
            paint={{
              "line-color": "#c76427",
              "line-width": 5,
              "line-opacity": ditchOpacity,
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
              visibility,
            }}
          />
        </Source>
      ) : null}

      {showMines ? (
        <Source id={MINE_SOURCE_ID} type="vector" url="mapbox://coeqwal.peazl7">
          <Layer
            id="gold-rush-gold-mines-points"
            type="circle"
            source-layer={MINE_SOURCE_LAYER}
            paint={{
              "circle-color": InfrastructureColor,
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                1,
                9,
                3,
              ],
              "circle-opacity": mineOpacity,
            }}
            layout={{ visibility }}
          />
        </Source>
      ) : null}

      {showMines ? (
        <Marker
          longitude={MINING_ICON_COORDINATE[0]}
          latitude={MINING_ICON_COORDINATE[1]}
        >
          <Box
            sx={{
              position: "absolute",
              width: 150,
              color: InfrastructureColor,
              opacity: mineOpacity,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            <MiningIcon width="100%" height="auto" />
          </Box>
        </Marker>
      ) : null}
    </>
  )
}
