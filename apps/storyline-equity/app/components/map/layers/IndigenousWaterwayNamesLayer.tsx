"use client"

import { useEffect } from "react"
import { Layer, Source, useMap } from "@repo/map"
import { OceanWaterColor } from "../../helpers/colorPalette"

const SOURCE_ID = "indigenous-waterway-names-source"
const SOURCE_LAYER = "indigenous_waterway_names.zip-bz7t28"
const LABEL_LAYER_ID = "indigenous-waterway-names-labels"

export default function IndigenousWaterwayNamesLayer({
  visible,
  opacity,
}: {
  visible: boolean
  opacity: number
}) {
  const { mapRef } = useMap()
  const layerOpacity = Math.max(0, Math.min(1, opacity))

  useEffect(() => {
    if (!visible) return

    const map = mapRef?.current?.getMap()
    if (!map) return

    const keepLabelsAboveRivers = () => {
      if (!map.isStyleLoaded() || !map.getLayer(LABEL_LAYER_ID)) return

      const layers = map.getStyle().layers
      if (layers[layers.length - 1]?.id === LABEL_LAYER_ID) return

      try {
        map.moveLayer(LABEL_LAYER_ID)
      } catch {
        // Layer order is best-effort while the Mapbox style settles.
      }
    }

    keepLabelsAboveRivers()
    map.on("styledata", keepLabelsAboveRivers)
    map.on("idle", keepLabelsAboveRivers)

    return () => {
      map.off("styledata", keepLabelsAboveRivers)
      map.off("idle", keepLabelsAboveRivers)
    }
  }, [mapRef, visible])

  return (
    <Source id={SOURCE_ID} type="vector" url="mapbox://coeqwal.dpvfu6">
      <Layer
        id={LABEL_LAYER_ID}
        type="symbol"
        source-layer={SOURCE_LAYER}
        layout={{
          "text-field": ["get", "name"],
          "text-font": ["Neue Haas Grotesk", "Arial Unicode MS Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 5, 11, 7, 14],
          "text-padding": 8,
          "text-max-width": 14,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          visibility: visible ? "visible" : "none",
        }}
        paint={{
          "text-color": "#fcfbfa",
          "text-opacity": layerOpacity,
          "text-halo-color": OceanWaterColor,
          "text-halo-width": 4,
          "text-halo-blur": 0.25,
        }}
      />
    </Source>
  )
}
