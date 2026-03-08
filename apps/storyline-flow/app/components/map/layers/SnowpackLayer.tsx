"use client"

import { Source, Layer } from "@repo/map"
import { snowpackPaintStyle } from "./mapLayerStyle"
import { useSelectedMonthSnowpack } from "../../../store"

interface SnowpackLayerProps {
  visible: boolean
}

export default function SnowpackLayer({ visible }: SnowpackLayerProps) {
  const month = useSelectedMonthSnowpack()

  const filter = ["all", ["==", ["get", "month-adjusted"], month]]

  return (
    <Source id="snowpack-source" type="vector" url="mapbox://coeqwal.a5ader88">
      <Layer
        id="snowpack-layer"
        type="fill"
        filter={filter}
        source-layer="monthly_snowpack-745lqa"
        paint={{
          ...snowpackPaintStyle,
          "fill-opacity": visible ? 1 : 0,
        }}
      />
    </Source>
  )
}
