"use client"

import { Source, Layer } from "@repo/map"
import { wetlandPaintStyle } from "./mapLayerStyle"
import { FreshWaterColor } from "../../helpers/colorPalette"

interface WetlandLayerProps {
  visible: boolean
}

export default function DeltaWetlandLayer({ visible }: WetlandLayerProps) {
  return (
    <>
      <Source
        id="detla-water-source"
        type="vector"
        url="mapbox://coeqwal.97rr9qs8"
      >
        <Layer
          id="delta-water-layer"
          type="fill"
          source-layer="delta_freshwater_flow-2cexx5"
          paint={{
            "fill-color": FreshWaterColor,
            "fill-opacity": visible ? 1 : 0,
          }}
        />
      </Source>
      <Source
        id="detla-wetland-source"
        type="vector"
        url="mapbox://coeqwal.29dkicxr"
      >
        <Layer
          id="delta-wetland-layer"
          type="fill"
          source-layer="delta_freshwater_wetland-dle9vo"
          paint={{
            ...wetlandPaintStyle,
            "fill-opacity": visible ? 1 : 0,
          }}
        />
      </Source>
    </>
  )
}
