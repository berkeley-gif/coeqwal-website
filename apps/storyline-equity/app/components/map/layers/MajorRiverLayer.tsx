"use client"

/**
 * RiversLayer - Sacramento and San Joaquin rivers
 *
 * Renders river lines with labels. Visibility controlled via Mapbox layout property.
 * Handles its own visualization coloring for Salmon abundance outcome.
 */

import { useMemo, useEffect } from "react"
import { Source, Layer, useMap } from "@repo/map"
import { sacramentoRiver, sanJoaquinRiverMainstem } from "@repo/data"
import { FreshWaterColor } from "../../helpers/colorPalette"

export const RIVER_LAYER_IDS = [
  "sacramento-river-trough",
  "sacramento-river-body",
  "san-joaquin-river-trough",
  "san-joaquin-river-outline",
  "san-joaquin-river-body",
] as const

const RIVER_BODY_COLOR = FreshWaterColor // rgb(4, 47, 103)
const RIVER_TROUGH_COLOR = "#080c46"
const HEADWATERS_PHASE_END = 0.45

type Coordinate = [number, number]
type LineGeometry = {
  type: "LineString" | "MultiLineString"
  coordinates: Coordinate[] | Coordinate[][]
}

//NOTE: if performance is too heavy, then we can do two layers (one for headwaters, one for mainstem) and use trimoffset

type SacramentoRiverFeature = {
  type: "Feature"
  properties?: {
    flow_order?: number
  } | null
  geometry?: LineGeometry | null
}

type SacramentoRiverFeatureCollection = {
  type: "FeatureCollection"
  features: SacramentoRiverFeature[]
}

function getDistance(a: Coordinate, b: Coordinate) {
  const [lngA, latA] = a
  const [lngB, latB] = b
  const lngScale = Math.cos((((latA + latB) / 2) * Math.PI) / 180)
  const x = (lngB - lngA) * lngScale
  const y = latB - latA
  return Math.sqrt(x * x + y * y)
}

function interpolate(
  a: Coordinate,
  b: Coordinate,
  progress: number,
): Coordinate {
  return [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress]
}

function clipLine(line: Coordinate[], progress: number): Coordinate[] {
  if (line.length < 2 || progress <= 0) return []
  if (progress >= 1) return line

  const segmentLengths = line
    .slice(1)
    .map((point, index) => getDistance(line[index]!, point))
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0)

  if (totalLength === 0) return []

  const targetDistance = totalLength * progress
  const clipped: Coordinate[] = [line[0]!]
  let traveled = 0

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index]!
    const nextTraveled = traveled + segmentLength
    const nextPoint = line[index + 1]!

    if (nextTraveled < targetDistance) {
      clipped.push(nextPoint)
      traveled = nextTraveled
      continue
    }

    const segmentProgress =
      segmentLength === 0 ? 0 : (targetDistance - traveled) / segmentLength
    clipped.push(interpolate(line[index]!, nextPoint, segmentProgress))
    break
  }

  return clipped.length >= 2 ? clipped : []
}

function clipGeometry(
  geometry: LineGeometry,
  progress: number,
): LineGeometry | null {
  if (geometry.type === "LineString") {
    const coordinates = clipLine(geometry.coordinates as Coordinate[], progress)
    return coordinates.length >= 2 ? { ...geometry, coordinates } : null
  }

  const coordinates = (geometry.coordinates as Coordinate[][])
    .map((line) => clipLine(line, progress))
    .filter((line) => line.length >= 2)

  return coordinates.length > 0 ? { ...geometry, coordinates } : null
}

function getAnimatedSacramentoRiver(
  headwatersProgress: number,
  mainstemProgress: number,
) {
  const data = sacramentoRiver as SacramentoRiverFeatureCollection

  return {
    ...data,
    features: data.features.flatMap((feature) => {
      if (!feature.geometry) return []

      const flowOrder = feature.properties?.flow_order
      const featureProgress =
        flowOrder === 1
          ? headwatersProgress
          : flowOrder === 2
            ? mainstemProgress
            : 0
      const geometry = clipGeometry(feature.geometry, featureProgress)

      return geometry ? [{ ...feature, geometry }] : []
    }),
  }
}

type SacramentoRiverData = typeof sacramentoRiver

interface RiversLayerProps {
  visible: boolean
  progress: number
  deemphasized?: boolean
}

export default function MajorRiversLayer({
  visible,
  progress,
  deemphasized = false,
}: RiversLayerProps) {
  const { mapRef } = useMap()

  const clampedProgress = Math.max(0, Math.min(1, progress))
  const headwatersProgress = Math.min(clampedProgress / HEADWATERS_PHASE_END, 1)
  const mainstemProgress = Math.max(
    0,
    (clampedProgress - HEADWATERS_PHASE_END) / (1 - HEADWATERS_PHASE_END),
  )
  const mainstemTrimOffset = useMemo<[number, number]>(
    () => [mainstemProgress, 1],
    [mainstemProgress],
  )
  const animatedSacramentoRiver = useMemo(
    () => getAnimatedSacramentoRiver(headwatersProgress, mainstemProgress),
    [headwatersProgress, mainstemProgress],
  )
  const visibilityValue = visible ? "visible" : "none"

  // Update layer properties when visibility, progress, or color changes
  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    if (map.getLayer("sacramento-river-trough")) {
      map.setLayoutProperty(
        "sacramento-river-trough",
        "visibility",
        visibilityValue,
      )
    }
    if (map.getLayer("sacramento-river-body")) {
      map.setLayoutProperty(
        "sacramento-river-body",
        "visibility",
        visibilityValue,
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
        mainstemTrimOffset,
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
        mainstemTrimOffset,
      )
    }
  }, [visible, visibilityValue, mainstemTrimOffset, mapRef])

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
        data={animatedSacramentoRiver as SacramentoRiverData}
      >
        <Layer
          id="sacramento-river-trough"
          type="line"
          paint={{
            "line-color": RIVER_TROUGH_COLOR,
            "line-width": 7,
            "line-opacity": deemphasized ? 0.18 : 0.6,
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
            "line-opacity": deemphasized ? 0.24 : 1,
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
            "line-opacity": deemphasized ? 0.18 : 0.6,
            "line-trim-offset": mainstemTrimOffset,
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
            "line-opacity": deemphasized ? 0.24 : 1,
            "line-trim-offset": mainstemTrimOffset,
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
