"use client"

import { useEffect, useMemo, useState } from "react"
import { Box } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { compile, morph } from "svg-path-morph"
import {
  mcCloudRiver,
  metroRiversEdited,
  sacramentoRiver,
  sanJoaquinRiverMainstem,
} from "@repo/data"
import { FreshWaterColor } from "../../helpers/colorPalette"
import type { LineFeatureCollection } from "../helpers/octilinearizeGeojson"

type Coordinate = [number, number]
type RiverLine = {
  key: string
  name: string
  color: string
  original: Coordinate[]
  metro: Coordinate[]
}
type ProjectedMorphPath = {
  key: string
  color: string
  originalD: string
  metroD: string
  compiled: ReturnType<typeof compile>
}

const MORPH_DURATION_MS = 900
const MORPH_ENDPOINT_EPSILON = 0.001
const DEFAULT_METRO_COLOR = FreshWaterColor
const DEFAULT_STROKE_WIDTH = 7
const MAX_MORPH_SOURCE_POINTS = 80

function getLineCoordinates(
  geometry: LineFeatureCollection["features"][number]["geometry"],
): Coordinate[][] {
  if (!geometry) return []
  if (geometry.type === "LineString")
    return [geometry.coordinates as Coordinate[]]
  return geometry.coordinates as Coordinate[][]
}

function getOriginalLines() {
  const sources = [
    { id: "mccloud", name: "McCloud River", data: mcCloudRiver },
    { id: "sacramento", name: "Sacramento River", data: sacramentoRiver },
    {
      id: "san_joaquin",
      name: "San Joaquin River",
      data: sanJoaquinRiverMainstem,
    },
  ]

  return new Map<string, { name: string; line: Coordinate[] }>(
    sources.flatMap(({ id, name, data }) =>
      ((data as LineFeatureCollection).features ?? []).flatMap(
        (feature, featureIndex) =>
          getLineCoordinates(feature.geometry).map(
            (line, lineIndex) =>
              [`${id}:${featureIndex}:${lineIndex}`, { name, line }] as const,
          ),
      ),
    ),
  )
}

function getEditedMetroLines(): RiverLine[] {
  const originals = getOriginalLines()

  return ((metroRiversEdited as LineFeatureCollection).features ?? []).flatMap(
    (feature) => {
      const properties = feature.properties ?? {}
      const riverId = String(properties.metro_river_id ?? "")
      const featureIndex = Number(properties.metro_feature_index ?? 0)
      const lineIndex = Number(properties.metro_line_index ?? 0)
      const key = `${riverId}:${featureIndex}:${lineIndex}`
      const original = originals.get(key)
      const metro = getLineCoordinates(feature.geometry)[0]

      if (!original || !metro || metro.length < 2) return []

      return [
        {
          key,
          name: String(properties.metro_river_name ?? original.name),
          color: String(properties.metro_color ?? DEFAULT_METRO_COLOR),
          original: original.line,
          metro,
        },
      ]
    },
  )
}

function getLineLength(line: Coordinate[]) {
  let length = 0
  for (let index = 1; index < line.length; index += 1) {
    const start = line[index - 1]!
    const end = line[index]!
    length += Math.hypot(end[0] - start[0], end[1] - start[1])
  }
  return length
}

function resampleLine(line: Coordinate[], count: number): Coordinate[] {
  if (line.length === 0) return []
  if (line.length === 1 || count <= 1) return [line[0]!]

  const total = getLineLength(line)
  if (total === 0) return Array.from({ length: count }, () => line[0]!)

  const result: Coordinate[] = []
  for (let pointIndex = 0; pointIndex < count; pointIndex += 1) {
    const target = (total * pointIndex) / (count - 1)
    let traveled = 0

    for (let segmentIndex = 1; segmentIndex < line.length; segmentIndex += 1) {
      const start = line[segmentIndex - 1]!
      const end = line[segmentIndex]!
      const segmentLength = Math.hypot(end[0] - start[0], end[1] - start[1])

      if (
        traveled + segmentLength >= target ||
        segmentIndex === line.length - 1
      ) {
        const t = segmentLength === 0 ? 0 : (target - traveled) / segmentLength
        result.push([
          start[0] + (end[0] - start[0]) * t,
          start[1] + (end[1] - start[1]) * t,
        ])
        break
      }

      traveled += segmentLength
    }
  }

  return result
}

function pathFromScreenPoints(points: Coordinate[]) {
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(" ")
}

function getProjectedPath(
  coordinates: Coordinate[],
  project: (coordinate: Coordinate) => Coordinate | null,
  count?: number,
) {
  const sampled = count ? resampleLine(coordinates, count) : coordinates
  const projected = sampled.flatMap((coordinate) => {
    const point = project(coordinate)
    return point ? [point] : []
  })

  return projected.length === sampled.length
    ? pathFromScreenPoints(projected)
    : null
}

export default function MetroRiverMorphOverlay({
  visible,
  morphToMetro,
}: {
  visible: boolean
  morphToMetro: boolean
}) {
  const { mapRef } = useMap()
  const riverLines = useMemo(() => getEditedMetroLines(), [])
  const [mapVersion, setMapVersion] = useState(0)
  const [morphProgress, setMorphProgress] = useState(morphToMetro ? 1 : 0)

  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map) return

    const update = () => setMapVersion((version) => version + 1)
    update()
    map.on("move", update)
    map.on("zoom", update)
    map.on("resize", update)

    return () => {
      map.off("move", update)
      map.off("zoom", update)
      map.off("resize", update)
    }
  }, [mapRef])

  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const from = morphProgress
    const to = morphToMetro ? 1 : 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / MORPH_DURATION_MS)
      const eased = t * (2 - t)
      setMorphProgress(from + (to - from) * eased)

      if (t < 1) frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
    // Intentionally start from the current progress when visibility flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morphToMetro])

  const projectedPaths = useMemo<ProjectedMorphPath[]>(() => {
    void mapVersion
    const map = mapRef?.current
    if (!map) return []

    const project = ([lng, lat]: Coordinate): Coordinate | null => {
      const point = map.project({ lng, lat })
      return point ? [point.x, point.y] : null
    }

    return riverLines.flatMap((line) => {
      const morphPointCount = Math.max(
        12,
        line.metro.length,
        Math.min(line.original.length, MAX_MORPH_SOURCE_POINTS),
      )
      const originalD = getProjectedPath(line.original, project)
      const metroD = getProjectedPath(line.metro, project)
      const originalMorphD = getProjectedPath(
        line.original,
        project,
        morphPointCount,
      )
      const metroMorphD = getProjectedPath(line.metro, project, morphPointCount)

      if (!originalD || !metroD || !originalMorphD || !metroMorphD) return []

      return [
        {
          key: line.key,
          color: line.color,
          originalD,
          metroD,
          compiled: compile([originalMorphD, metroMorphD]),
        },
      ]
    })
  }, [mapRef, riverLines, mapVersion])

  const paths = useMemo(
    () =>
      projectedPaths.map((path) => ({
        key: path.key,
        color: path.color,
        originalD: path.originalD,
        d:
          morphProgress <= MORPH_ENDPOINT_EPSILON
            ? path.originalD
            : morphProgress >= 1 - MORPH_ENDPOINT_EPSILON
              ? path.metroD
              : morph(path.compiled, [1 - morphProgress, morphProgress]),
      })),
    [projectedPaths, morphProgress],
  )

  if (!visible) return null

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <svg width="100%" height="100%">
        {paths.map((path) => (
          <g key={path.key}>
            <path
              d={path.originalD}
              fill="none"
              stroke="#0a1020"
              strokeWidth={Math.max(2, DEFAULT_STROKE_WIDTH - 2)}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={morphProgress <= MORPH_ENDPOINT_EPSILON ? 0 : 0.32}
            />
            <path
              d={path.d}
              fill="none"
              stroke="#07142c"
              strokeWidth={DEFAULT_STROKE_WIDTH + 4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.68}
            />
            <path
              d={path.d}
              fill="none"
              stroke={path.color}
              strokeWidth={DEFAULT_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={1}
            />
          </g>
        ))}
      </svg>
    </Box>
  )
}
