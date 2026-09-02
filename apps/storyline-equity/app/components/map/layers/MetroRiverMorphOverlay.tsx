"use client"

import { useEffect, useMemo, useState } from "react"
import { Box } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { canalNetwork, metroMap, riverNetwork } from "@repo/data"
import {
  FreshWaterColor,
  InfrastructureColor,
  InfrastructureOutlineColor,
  InfrastructureOutlineOpacity,
} from "../../helpers/colorPalette"
import type { LineFeatureCollection } from "../helpers/octilinearizeGeojson"

type Coordinate = [number, number]
type MetroLineFeature = {
  properties: {
    metro_river_id: "river" | "canal"
    metro_feature_index: number
    metro_line_index: number
  }
  geometry: { coordinates: Coordinate[] }
}
type NetworkLine = {
  key: string
  color: string
  strokeWidth: number
  original: Coordinate[]
  metro: Coordinate[]
}
type PreparedLine = NetworkLine & {
  morphOriginal: Coordinate[]
  morphMetro: Coordinate[]
}
type ProjectedLine = {
  key: string
  color: string
  strokeWidth: number
  originalD: string
  metroD: string
  morphOriginal: Coordinate[]
  morphMetro: Coordinate[]
}

const MORPH_ENDPOINT_EPSILON = 0.005
const UNIFORM_SAMPLE_LIMIT = 64
const NETWORKS = [
  {
    id: "river",
    color: FreshWaterColor,
    data: riverNetwork as LineFeatureCollection,
  },
  {
    id: "canal",
    color: InfrastructureColor,
    data: canalNetwork as LineFeatureCollection,
  },
] as const

function getGeometryLines(
  geometry: LineFeatureCollection["features"][number]["geometry"],
): Coordinate[][] {
  if (!geometry) return []
  if (geometry.type === "LineString") {
    return [geometry.coordinates as Coordinate[]]
  }
  return geometry.coordinates as Coordinate[][]
}

function lineLength(line: Coordinate[]) {
  let length = 0
  for (let index = 1; index < line.length; index += 1) {
    const start = line[index - 1]!
    const end = line[index]!
    length += Math.hypot(end[0] - start[0], end[1] - start[1])
  }
  return length
}

function lineVertexFractions(line: Coordinate[]) {
  if (line.length <= 1) return [0]
  const total = lineLength(line)
  if (total === 0) return line.map((_, index) => index / (line.length - 1))

  let traveled = 0
  return line.map((point, index) => {
    if (index > 0) {
      const previous = line[index - 1]!
      traveled += Math.hypot(point[0] - previous[0], point[1] - previous[1])
    }
    return traveled / total
  })
}

function resampleLineAtFractions(
  line: Coordinate[],
  fractions: number[],
): Coordinate[] {
  if (line.length === 0) return []
  if (line.length === 1) return fractions.map(() => [...line[0]!] as Coordinate)

  const cumulative = [0]
  for (let index = 1; index < line.length; index += 1) {
    const start = line[index - 1]!
    const end = line[index]!
    cumulative.push(
      cumulative[index - 1]! + Math.hypot(end[0] - start[0], end[1] - start[1]),
    )
  }

  const total = cumulative[cumulative.length - 1]!
  if (total === 0) return fractions.map(() => [...line[0]!] as Coordinate)

  let segmentIndex = 1
  return fractions.map((fraction) => {
    const target = Math.max(0, Math.min(1, fraction)) * total
    while (
      segmentIndex < line.length - 1 &&
      cumulative[segmentIndex]! < target
    ) {
      segmentIndex += 1
    }
    const start = line[segmentIndex - 1]!
    const end = line[segmentIndex]!
    const segmentStart = cumulative[segmentIndex - 1]!
    const segmentLength = cumulative[segmentIndex]! - segmentStart
    const t = segmentLength === 0 ? 0 : (target - segmentStart) / segmentLength
    return [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
    ]
  })
}

const networksById = new Map(NETWORKS.map((network) => [network.id, network]))

function getPreparedLines(): PreparedLine[] {
  const metroFeatures = (
    metroMap as unknown as { features: MetroLineFeature[] }
  ).features

  return metroFeatures.flatMap(({ properties, geometry }) => {
    const {
      metro_river_id: networkId,
      metro_feature_index: featureIndex,
      metro_line_index: lineIndex,
    } = properties
    const metro = geometry.coordinates
    const network = networksById.get(networkId)
    const feature = network?.data.features?.[featureIndex]
    const original = feature
      ? getGeometryLines(feature.geometry)[lineIndex]
      : undefined

    if (!network || !original || !metro || metro.length < 2) return []

    const key = `${networkId}:${featureIndex}:${lineIndex}`
    const uniformCount = Math.max(
      12,
      Math.min(original.length, UNIFORM_SAMPLE_LIMIT),
    )
    const fractions = Array.from(
      new Set([
        ...lineVertexFractions(metro),
        ...Array.from(
          { length: uniformCount },
          (_, index) => index / (uniformCount - 1),
        ),
      ]),
    ).sort((a, b) => a - b)
    return [
      {
        key,
        color: network.color,
        strokeWidth: 5,
        original,
        metro,
        morphOriginal: resampleLineAtFractions(original, fractions),
        morphMetro: resampleLineAtFractions(metro, fractions),
      },
    ]
  })
}

function pathFromPoints(points: Coordinate[]) {
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(" ")
}

function interpolatePreparedPath(
  source: Coordinate[],
  target: Coordinate[],
  progress: number,
) {
  const eased = progress * progress * (3 - 2 * progress)
  return source
    .map(([x, y], index) => {
      const [targetX, targetY] = target[index]!
      return `${index === 0 ? "M" : "L"} ${(x + (targetX - x) * eased).toFixed(2)} ${(y + (targetY - y) * eased).toFixed(2)}`
    })
    .join(" ")
}

export default function MetroRiverMorphOverlay({
  visible,
  progress,
  opacity = 1,
}: {
  visible: boolean
  progress: number
  opacity?: number
}) {
  const { mapRef } = useMap()
  const preparedLines = useMemo(() => getPreparedLines(), [])
  const [mapVersion, setMapVersion] = useState(0)
  const morphProgress = Math.max(0, Math.min(1, progress))
  const overlayOpacity = Math.max(0, Math.min(1, opacity))

  useEffect(() => {
    // Skip subscribing while hidden — camera easeTo/fitBounds transitions
    // fire "move" dozens of times per animation, and re-projecting every
    // prepared line on each tick is wasted work outside this section.
    if (!visible) return
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
  }, [mapRef, visible])

  const projectedLines = useMemo<ProjectedLine[]>(() => {
    void mapVersion
    if (!visible) return []
    const map = mapRef?.current
    if (!map) return []

    const projectLine = (line: Coordinate[]) =>
      line.map(([lng, lat]) => {
        const point = map.project({ lng, lat })
        return [point.x, point.y] as Coordinate
      })

    return preparedLines.map((line) => ({
      key: line.key,
      color: line.color,
      strokeWidth: line.strokeWidth,
      originalD: pathFromPoints(projectLine(line.original)),
      metroD: pathFromPoints(projectLine(line.metro)),
      morphOriginal: projectLine(line.morphOriginal),
      morphMetro: projectLine(line.morphMetro),
    }))
  }, [mapRef, mapVersion, preparedLines, visible])

  if (!visible) return null

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        opacity: overlayOpacity,
      }}
    >
      <svg width="100%" height="100%">
        {projectedLines.map((line) => {
          const d =
            morphProgress <= MORPH_ENDPOINT_EPSILON
              ? line.originalD
              : morphProgress >= 1 - MORPH_ENDPOINT_EPSILON
                ? line.metroD
                : interpolatePreparedPath(
                    line.morphOriginal,
                    line.morphMetro,
                    morphProgress,
                  )

          return (
            <g key={line.key}>
              <path
                d={d}
                fill="none"
                stroke={
                  line.key.startsWith("river:")
                    ? "#080c46"
                    : InfrastructureOutlineColor
                }
                strokeWidth={7}
                strokeOpacity={
                  line.key.startsWith("river:")
                    ? 0.6
                    : InfrastructureOutlineOpacity
                }
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={d}
                fill="none"
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )
        })}
      </svg>
    </Box>
  )
}
