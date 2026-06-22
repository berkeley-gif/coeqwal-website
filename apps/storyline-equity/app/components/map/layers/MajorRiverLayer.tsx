"use client"

/**
 * RiversLayer - Sacramento and San Joaquin rivers
 *
 * Renders river lines with labels. Visibility controlled via Mapbox layout property.
 * Handles its own visualization coloring for Salmon abundance outcome.
 */

import { useMemo, useEffect } from "react"
import { Source, Layer, Marker, useMap } from "@repo/map"
import {
  sacramentoRiverHeadwaters,
  sacramentoRiverMainstem,
  sanJoaquinRiverMainstem,
} from "@repo/data"
import { FreshWaterColor } from "../../helpers/colorPalette"

export const RIVER_LAYER_IDS = [
  "sacramento-headwaters-trough",
  "sacramento-headwaters-body",
  "sacramento-river-trough",
  "sacramento-river-outline",
  "sacramento-river-body",
  "san-joaquin-river-trough",
  "san-joaquin-river-outline",
  "san-joaquin-river-body",
] as const

const RIVER_BODY_COLOR = FreshWaterColor // rgb(4, 47, 103)
const RIVER_TROUGH_COLOR = "#080c46"
const MOVING_POINT_COLOR = "#fcfbfa"
const HEADWATERS_PHASE_END = 0.45
const MOVING_POINT_REVEAL_RANGE: [number, number] = [0.76, 0.96]

type Coordinate = [number, number]
type LineGeometry = {
  type: "LineString" | "MultiLineString"
  coordinates: Coordinate[] | Coordinate[][]
}
type FeatureWithLineGeometry = {
  geometry?: LineGeometry
}
type LineFeatureCollection = {
  features?: FeatureWithLineGeometry[]
}

function getLineCoordinates(geometry?: LineGeometry): Coordinate[][] {
  if (!geometry) return []
  if (geometry.type === "LineString") return [geometry.coordinates as Coordinate[]]
  if (geometry.type === "MultiLineString") {
    return geometry.coordinates as Coordinate[][]
  }
  return []
}

function getLongestLine(data: LineFeatureCollection): Coordinate[] {
  const lines = (data.features ?? []).flatMap((feature) =>
    getLineCoordinates(feature.geometry),
  )

  return lines.reduce<Coordinate[]>(
    (longest, line) => (line.length > longest.length ? line : longest),
    [],
  )
}

function getDistance(a: Coordinate, b: Coordinate) {
  const [lngA, latA] = a
  const [lngB, latB] = b
  const lngScale = Math.cos((((latA + latB) / 2) * Math.PI) / 180)
  const x = (lngB - lngA) * lngScale
  const y = latB - latA
  return Math.sqrt(x * x + y * y)
}

function interpolate(a: Coordinate, b: Coordinate, progress: number): Coordinate {
  return [
    a[0] + (b[0] - a[0]) * progress,
    a[1] + (b[1] - a[1]) * progress,
  ]
}

function getPointAlongLine(line: Coordinate[], progress: number): Coordinate | null {
  if (line.length === 0) return null
  if (line.length === 1) return line[0]!

  const clampedProgress = Math.max(0, Math.min(1, progress))
  const segmentLengths = line.slice(1).map((point, index) =>
    getDistance(line[index]!, point),
  )
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0)

  if (totalLength === 0) return line[0]!

  let traveled = 0
  const targetDistance = totalLength * clampedProgress

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index]!
    const nextTraveled = traveled + segmentLength

    if (targetDistance <= nextTraveled) {
      const segmentProgress =
        segmentLength === 0 ? 0 : (targetDistance - traveled) / segmentLength
      return interpolate(line[index]!, line[index + 1]!, segmentProgress)
    }

    traveled = nextTraveled
  }

  return line[line.length - 1]!
}

function getRangeProgress(progress: number, [start, end]: [number, number]) {
  if (end === start) return progress >= start ? 1 : 0
  return Math.max(0, Math.min(1, (progress - start) / (end - start)))
}

const SACRAMENTO_MAINSTEM_UPSTREAM_PATH = [
  ...getLongestLine(sacramentoRiverMainstem as unknown as LineFeatureCollection),
].reverse()

interface RiversLayerProps {
  visible: boolean
  progress: number
  sectionProgress?: number
}

export default function MajorRiversLayer({
  visible,
  progress,
  sectionProgress = 0,
}: RiversLayerProps) {
  const { mapRef } = useMap()

  const clampedProgress = Math.max(0, Math.min(1, progress))
  const headwatersProgress = Math.min(
    clampedProgress / HEADWATERS_PHASE_END,
    1,
  )
  const mainstemProgress = Math.max(
    0,
    (clampedProgress - HEADWATERS_PHASE_END) / (1 - HEADWATERS_PHASE_END),
  )
  const headwatersTrimOffset = useMemo<[number, number]>(
    () => [headwatersProgress, 1],
    [headwatersProgress],
  )
  const mainstemTrimOffset = useMemo<[number, number]>(
    () => [mainstemProgress, 1],
    [mainstemProgress],
  )
  const movingPointProgress = getRangeProgress(
    sectionProgress,
    MOVING_POINT_REVEAL_RANGE,
  )
  const movingPointCoordinate = useMemo(
    () => getPointAlongLine(SACRAMENTO_MAINSTEM_UPSTREAM_PATH, movingPointProgress),
    [movingPointProgress],
  )
  const showMovingPoint =
    visible && sectionProgress >= MOVING_POINT_REVEAL_RANGE[0]
  const visibilityValue = visible ? "visible" : "none"

  // Update layer properties when visibility, progress, or color changes
  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    // Sacramento headwaters layers
    if (map.getLayer("sacramento-headwaters-trough")) {
      map.setLayoutProperty(
        "sacramento-headwaters-trough",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "sacramento-headwaters-trough",
        "line-trim-offset",
        headwatersTrimOffset,
      )
    }
    if (map.getLayer("sacramento-headwaters-body")) {
      map.setLayoutProperty(
        "sacramento-headwaters-body",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "sacramento-headwaters-body",
        "line-trim-offset",
        headwatersTrimOffset,
      )
    }

    // Sacramento mainstem layers
    if (map.getLayer("sacramento-river-trough")) {
      map.setLayoutProperty(
        "sacramento-river-trough",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "sacramento-river-trough",
        "line-trim-offset",
        mainstemTrimOffset,
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
        mainstemTrimOffset,
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
  }, [
    visible,
    visibilityValue,
    headwatersTrimOffset,
    mainstemTrimOffset,
    mapRef,
  ])

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
        id="sacramento-headwaters-source"
        type="geojson"
        data={sacramentoRiverHeadwaters}
        lineMetrics={true}
      >
        <Layer
          id="sacramento-headwaters-trough"
          type="line"
          paint={{
            "line-color": RIVER_TROUGH_COLOR,
            "line-width": 7,
            "line-opacity": 0.6,
            "line-trim-offset": headwatersTrimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
        <Layer
          id="sacramento-headwaters-body"
          type="line"
          paint={{
            "line-color": RIVER_BODY_COLOR,
            "line-width": 5,
            "line-opacity": 1,
            "line-trim-offset": headwatersTrimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
      </Source>

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
            "line-trim-offset": mainstemTrimOffset,
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
            "line-trim-offset": mainstemTrimOffset,
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
            "line-opacity": 1,
            "line-trim-offset": mainstemTrimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
      </Source>

      {showMovingPoint && movingPointCoordinate ? (
        <Marker
          longitude={movingPointCoordinate[0]}
          latitude={movingPointCoordinate[1]}
        >
          <div
            style={{
              position: "absolute",
              width: 18,
              height: 18,
              borderRadius: "999px",
              transform: "translate(-50%, -50%)",
              background: MOVING_POINT_COLOR,
              border: `3px solid ${RIVER_BODY_COLOR}`,
              boxShadow:
                "0 0 0 5px rgba(252, 251, 250, 0.18), 0 8px 18px rgba(0, 0, 0, 0.35)",
              pointerEvents: "none",
            }}
          />
        </Marker>
      ) : null}
    </>
  )
}
