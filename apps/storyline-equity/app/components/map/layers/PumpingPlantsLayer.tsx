"use client"

import { Layer, Source } from "@repo/map"
import {
  InfrastructureColor,
  InfrastructureOutlineColor,
  InfrastructureOutlineOpacity,
} from "../../helpers/colorPalette"

const SOURCE_ID = "swp-pumping-plants-source"
const SOURCE_LAYER = "swp_pumping_plants.zip-1f1uv8"

export default function PumpingPlantsLayer({ visible }: { visible: boolean }) {
  return (
    <Source id={SOURCE_ID} type="vector" url="mapbox://coeqwal.b5cgnr">
      <Layer
        id="swp-pumping-plants-points"
        type="circle"
        source-layer={SOURCE_LAYER}
        paint={{
          "circle-color": InfrastructureColor,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 9, 6],
          "circle-opacity": 0.95,
          "circle-stroke-color": InfrastructureOutlineColor,
          "circle-stroke-width": 1,
          "circle-stroke-opacity": InfrastructureOutlineOpacity,
        }}
        layout={{ visibility: visible ? "visible" : "none" }}
      />
    </Source>
  )
}
