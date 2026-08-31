"use client"

import { Layer, Source } from "@repo/map"
import { riverNetwork } from "@repo/data"
import { FreshWaterColor } from "../../helpers/colorPalette"
import type { LineFeatureCollection } from "../helpers/octilinearizeGeojson"
import { useLazyMount } from "../hooks/useLazyMount"

const EXCLUDED_MAJOR_RIVERS = /Sacramento River|San Joaquin River/i
const RIVER_TROUGH_COLOR = "#080c46"

const indigenousContextRivers = {
  ...(riverNetwork as unknown as LineFeatureCollection),
  features: (riverNetwork as unknown as LineFeatureCollection).features.filter(
    (feature) => {
      const name = String(feature.properties?.GNIS_Name ?? "")
      return !EXCLUDED_MAJOR_RIVERS.test(name)
    },
  ),
}

export default function IndigenousRiverNetworkLayer({
  visible,
  opacity,
  deemphasized = false,
}: {
  visible: boolean
  opacity: number
  deemphasized?: boolean
}) {
  const shouldMount = useLazyMount(visible)
  const visibility = visible ? "visible" : "none"
  const layerOpacity = Math.max(0, Math.min(1, opacity))

  if (!shouldMount) return null

  return (
    <Source
      id="indigenous-context-river-network-source"
      type="geojson"
      data={indigenousContextRivers as unknown as GeoJSON.FeatureCollection}
    >
      <Layer
        id="indigenous-context-river-network-trough"
        type="line"
        paint={{
          "line-color": RIVER_TROUGH_COLOR,
          "line-width": 7,
          "line-opacity": (deemphasized ? 0.18 : 0.6) * layerOpacity,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
          visibility,
        }}
      />
      <Layer
        id="indigenous-context-river-network-body"
        type="line"
        paint={{
          "line-color": FreshWaterColor,
          "line-width": 5,
          "line-opacity": (deemphasized ? 0.24 : 1) * layerOpacity,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
          visibility,
        }}
      />
    </Source>
  )
}
