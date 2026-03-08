"use client"

/**
 * RiversLayer - Sacramento and San Joaquin rivers
 *
 * Renders river lines with labels. Visibility controlled via Mapbox layout property.
 * Handles its own visualization coloring for Salmon abundance outcome.
 */

import { useMemo, useEffect } from "react"
import { Source, Layer, useMap } from "@repo/map"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"
import { FreshWaterColor } from "../../helpers/colorPalette"

export const RIVER_LAYER_IDS = [
  "sacramento-river-trough",
  "sacramento-river-outline",
  "sacramento-river-body",
  "san-joaquin-river-trough",
  "san-joaquin-river-outline",
  "san-joaquin-river-body",
] as const

const RIVER_BODY_COLOR = FreshWaterColor // rgb(4, 47, 103)
const RIVER_TROUGH_COLOR = "#080c46"

interface RiversLayerProps {
  visible: boolean
  progress: number
}

export default function MajorRiversLayer({
  visible,
  progress,
}: RiversLayerProps) {
  const { mapRef } = useMap()

  const clampedProgress = Math.max(0, Math.min(1, progress))
  const trimOffset = useMemo<[number, number]>(
    () => [clampedProgress, 1],
    [clampedProgress],
  )
  const visibilityValue = visible ? "visible" : "none"

  // Update layer properties when visibility, progress, or color changes
  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    // Sacramento layers
    if (map.getLayer("sacramento-river-trough")) {
      map.setLayoutProperty(
        "sacramento-river-trough",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "sacramento-river-trough",
        "line-trim-offset",
        trimOffset,
      )
    }
    if (map.getLayer("sacramento-river-body")) {
      map.setLayoutProperty(
        "sacramento-river-body",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "sacramento-river-body",
        "line-trim-offset",
        trimOffset,
      )
    }

    // San Joaquin layers
    if (map.getLayer("san-joaquin-river-trough")) {
      map.setLayoutProperty(
        "san-joaquin-river-trough",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "san-joaquin-river-trough",
        "line-trim-offset",
        trimOffset,
      )
    }
    if (map.getLayer("san-joaquin-river-body")) {
      map.setLayoutProperty(
        "san-joaquin-river-body",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "san-joaquin-river-body",
        "line-trim-offset",
        trimOffset,
      )
    }
  }, [visible, visibilityValue, trimOffset, mapRef])

  // Move rivers to top when visible
  useEffect(() => {
    if (!visible) return
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    RIVER_LAYER_IDS.forEach((id) => {
      try {
        if (map.getLayer(id)) map.moveLayer(id)
      } catch {
        // ignore
      }
    })
  }, [visible, mapRef])

  return (
    <>
      <Source
        id="sacramento-river-source"
        type="geojson"
        data={sacramentoRiverMainstem}
        lineMetrics={true}
      >
        <Layer
          id="sacramento-river-trough"
          type="line"
          paint={{
            "line-color": RIVER_TROUGH_COLOR,
            "line-width": 7,
            "line-opacity": 0.6,
            "line-trim-offset": trimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
        <Layer
          id="sacramento-river-body"
          type="line"
          paint={{
            "line-color": RIVER_BODY_COLOR,
            "line-width": 5,
            "line-opacity": 1,
            "line-trim-offset": trimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
      </Source>

      <Source
        id="san-joaquin-river-source"
        type="geojson"
        data={sanJoaquinRiverMainstem}
        lineMetrics={true}
      >
        <Layer
          id="san-joaquin-river-trough"
          type="line"
          paint={{
            "line-color": RIVER_TROUGH_COLOR,
            "line-width": 7,
            "line-opacity": 0.6,
            "line-trim-offset": trimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
        <Layer
          id="san-joaquin-river-body"
          type="line"
          paint={{
            "line-color": RIVER_BODY_COLOR,
            "line-width": 5,
            "line-opacity": 1,
            "line-trim-offset": trimOffset,
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
