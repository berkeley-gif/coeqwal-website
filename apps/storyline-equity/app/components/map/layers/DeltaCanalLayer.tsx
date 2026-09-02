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

export default function DeltaCanalLayer({
  visible,
  progress,
}: {
  visible: boolean
  progress: number
}) {
  // 0.50–0.60: historical waterways only
  // 0.60–0.65: historical waterways crossfade to current waterways
  // 0.65–0.70: current downstream waterways only
  // 0.70–0.75: canals fade in, then hold through 1.00
  const waterwayCrossfade = Math.min(1, Math.max(0, (progress - 0.6) / 0.05))
  const canalReveal = Math.min(1, Math.max(0, (progress - 0.7) / 0.05))
  const historicalOpacity = visible ? 1 - waterwayCrossfade : 0
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
