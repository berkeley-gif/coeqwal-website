"use client"

import { Layer, Source } from "@repo/map"
import { riverNetwork } from "@repo/data"
import { FreshWaterColor } from "../../helpers/colorPalette"
import type { LineFeatureCollection } from "../helpers/octilinearizeGeojson"
import { useLazyMount } from "../hooks/useLazyMount"

const RIVER_TROUGH_COLOR = "#080c46"
export const INDIGENOUS_RIVER_NETWORK_TROUGH_LAYER_ID =
  "indigenous-context-river-network-trough"

const indigenousContextRivers = {
  ...(riverNetwork as unknown as LineFeatureCollection),
  features: (riverNetwork as unknown as LineFeatureCollection).features,
}

export default function IndigenousRiverNetworkLayer({
  visible,
  opacity,
  deemphasized = false,
  highlightedRiver,
}: {
  visible: boolean
  opacity: number
  deemphasized?: boolean
  highlightedRiver?: string
}) {
  const shouldMount = useLazyMount(visible)
  const visibility = visible ? "visible" : "none"
  const layerOpacity = Math.max(0, Math.min(1, opacity))
  const getOpacity = (primary: number, subdued: number) =>
    highlightedRiver
      ? [
          "case",
          ["==", ["get", "GNIS_Name"], highlightedRiver],
          primary * layerOpacity,
          subdued * layerOpacity,
        ]
      : primary * layerOpacity

  if (!shouldMount) return null

  return (
    <Source
      id="indigenous-context-river-network-source"
      type="geojson"
      data={indigenousContextRivers as unknown as GeoJSON.FeatureCollection}
    >
      <Layer
        id={INDIGENOUS_RIVER_NETWORK_TROUGH_LAYER_ID}
        type="line"
        paint={{
          "line-color": RIVER_TROUGH_COLOR,
          "line-width": 7,
          "line-opacity": getOpacity(deemphasized ? 0.18 : 0.6, 0.12) as never,
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
          "line-opacity": getOpacity(deemphasized ? 0.24 : 1, 0.2) as never,
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
