"use client"

import { Layer, Source } from "@repo/map"
import {
  FreshWaterColor,
  InfrastructureColor,
} from "../../helpers/colorPalette"

const LINE_WIDTH: [
  "interpolate",
  ["linear"],
  ["zoom"],
  number,
  number,
  number,
  number,
  number,
  number,
] = ["interpolate", ["linear"], ["zoom"], 7, 1.4, 10, 3.2, 12, 5]

const CANAL_LINE_WIDTH: typeof LINE_WIDTH = [
  "interpolate",
  ["linear"],
  ["zoom"],
  7,
  0.65,
  10,
  1.35,
  12,
  2.1,
]

const HISTORICAL_REVEAL_RANGE: [number, number] = [0.66, 0.7]
const WATERWAY_CROSSFADE_RANGE: [number, number] = [0.72, 0.78]
const CANAL_REVEAL_RANGE: [number, number] = [0.82, 0.88]

function normalizeProgress(progress: number, [start, end]: [number, number]) {
  if (end === start) return progress >= start ? 1 : 0
  return Math.max(0, Math.min(1, (progress - start) / (end - start)))
}

export default function DeltaCanalLayer({
  visible,
  progress,
}: {
  visible: boolean
  progress: number
}) {
  const historicalReveal = normalizeProgress(progress, HISTORICAL_REVEAL_RANGE)
  const waterwayCrossfade = normalizeProgress(
    progress,
    WATERWAY_CROSSFADE_RANGE,
  )
  const canalReveal = normalizeProgress(progress, CANAL_REVEAL_RANGE)
  const historicalOpacity = visible
    ? historicalReveal * (1 - waterwayCrossfade)
    : 0
  const modernOpacity = visible ? waterwayCrossfade : 0
  const canalOpacity = visible ? canalReveal * 0.95 : 0
  const visibilityValue = visible ? "visible" : "none"

  return (
    <>
      <Source
        id="delta-historical-waterway-source"
        type="vector"
        url="mapbox://coeqwal.dllw55"
      >
        <Layer
          id="delta-historical-waterway"
          type="line"
          source-layer="delta_historical_waterway.zip-fm6m77"
          paint={{
            "line-color": FreshWaterColor,
            "line-width": LINE_WIDTH,
            "line-opacity": historicalOpacity,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
      </Source>

      <Source
        id="delta-canal-source"
        type="vector"
        url="mapbox://coeqwal.coazg3"
      >
        <Layer
          id="delta-canal"
          type="line"
          source-layer="delta_canal.zip-ccbceq"
          paint={{
            "line-color": InfrastructureColor,
            "line-width": CANAL_LINE_WIDTH,
            "line-opacity": canalOpacity,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
      </Source>

      <Source
        id="delta-modern-waterway-source"
        type="vector"
        url="mapbox://coeqwal.gmhr0z"
      >
        <Layer
          id="delta-modern-waterway"
          type="line"
          source-layer="delta_modern_waterway.zip-p8uyhc"
          paint={{
            "line-color": FreshWaterColor,
            "line-width": LINE_WIDTH,
            "line-opacity": modernOpacity,
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
