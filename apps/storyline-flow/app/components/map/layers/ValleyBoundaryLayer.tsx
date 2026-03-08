"use client"

/**
 * RiversLayer - Sacramento and San Joaquin rivers
 *
 * Renders river lines with labels. Visibility controlled via Mapbox layout property.
 * Handles its own visualization coloring for Salmon abundance outcome.
 */

import { useMemo, useEffect } from "react"
import { Source, Layer, useMap } from "@repo/map"
import { centralValleyBoundary } from "@repo/data"
import { OffWhiteColor } from "../../helpers/colorPalette"

const BODY_COLOR = OffWhiteColor

interface BoundaryLayerProps {
  visible: boolean
  progress: number
}

export default function ValleyBoundaryLayer({
  visible,
  progress,
}: BoundaryLayerProps) {
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

    if (map.getLayer("central-valley-boundary")) {
      map.setLayoutProperty(
        "central-valley-boundary",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "central-valley-boundary",
        "line-trim-offset",
        trimOffset,
      )
    }
  }, [visible, visibilityValue, trimOffset, mapRef])

  return (
    <>
      <Source
        id="central-valley-boundary-source"
        type="geojson"
        data={centralValleyBoundary}
        lineMetrics={true}
      >
        <Layer
          id="central-valley-boundary"
          type="line"
          paint={{
            "line-color": BODY_COLOR,
            "line-width": 6,
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
