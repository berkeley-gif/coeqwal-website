"use client"

import { useEffect, useMemo } from "react"
import { Layer, Marker, Source, useMap } from "@repo/map"
import { mcCloudRiver, salmonMigrationPath } from "@repo/data"
import { Box } from "@repo/ui/mui"
import {
  InfrastructureColor,
  FreshWaterColor,
} from "../../helpers/colorPalette"
import { useLazyMount } from "../hooks/useLazyMount"

const MCCLOUD_RIVER_SOURCE_ID = "mccloud-river-source"
const MCCLOUD_HEADWATER_SOURCE_ID = "mccloud-headwater-source"
const MCCLOUD_HEADWATER_SOURCE_LAYER = "McCloud_headwater.zip-hypvk0"
const MCCLOUD_SPRINGS_SOURCE_ID = "mccloud-springs-source"
const MCCLOUD_SPRINGS_SOURCE_LAYER = "McCloud_springs.zip-phame5"
const SPRING_RIPPLE_LAYER_IDS = [
  "mccloud-springs-ripple-1",
  "mccloud-springs-ripple-2",
] as const
const MOVING_POINT_RANGE: [number, number] = [0.12, 0.38]
const MOVING_POINT_EXIT_PROGRESS = 0.9
const SHASTA_DAM_COORDINATE: Coordinate = [-122.42, 40.718]

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
  if (geometry.type === "LineString")
    return [geometry.coordinates as Coordinate[]]
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

function interpolate(
  a: Coordinate,
  b: Coordinate,
  progress: number,
): Coordinate {
  return [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress]
}

function getPointAlongLine(
  line: Coordinate[],
  progress: number,
): Coordinate | null {
  if (line.length === 0) return null
  if (line.length === 1) return line[0]!

  const clampedProgress = Math.max(0, Math.min(1, progress))
  const segmentLengths = line
    .slice(1)
    .map((point, index) => getDistance(line[index]!, point))
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

function easeOutQuad(progress: number) {
  return 1 - (1 - progress) * (1 - progress)
}

function splitLineAtClosestPoint(line: Coordinate[], target: Coordinate) {
  if (line.length === 0) {
    return {
      before: [] as Coordinate[],
      after: [] as Coordinate[],
    }
  }

  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  line.forEach((point, index) => {
    const distance = getDistance(point, target)

    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })

  return {
    before: line.slice(0, closestIndex + 1),
    after: line.slice(closestIndex),
  }
}

const SALMON_MIGRATION_FULL_PATH = [
  ...getLongestLine(salmonMigrationPath as unknown as LineFeatureCollection),
].reverse()
const {
  before: SALMON_MIGRATION_TO_SHASTA_PATH,
  after: SALMON_MIGRATION_AFTER_SHASTA_PATH,
} = splitLineAtClosestPoint(SALMON_MIGRATION_FULL_PATH, SHASTA_DAM_COORDINATE)
export default function ShastaMcCloudLayer({
  visible,
  progress,
  sectionProgress = 0,
  showMigration = false,
  migrationOnly = false,
  showRiver = !migrationOnly,
  salmonIconSrc,
}: {
  visible: boolean
  progress: number
  sectionProgress?: number
  showMigration?: boolean
  migrationOnly?: boolean
  showRiver?: boolean
  salmonIconSrc?: string
}) {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const { mapRef } = useMap()
  const shouldMount = useLazyMount(visible)
  const movingPointProgress = getRangeProgress(
    sectionProgress,
    MOVING_POINT_RANGE,
  )
  const postShastaProgress = getRangeProgress(sectionProgress, [
    MOVING_POINT_RANGE[1],
    MOVING_POINT_EXIT_PROGRESS,
  ])
  const movingPointCoordinate = useMemo(() => {
    if (movingPointProgress < 1) {
      return getPointAlongLine(
        SALMON_MIGRATION_TO_SHASTA_PATH,
        easeOutQuad(movingPointProgress),
      )
    }

    return getPointAlongLine(
      SALMON_MIGRATION_AFTER_SHASTA_PATH,
      postShastaProgress,
    )
  }, [movingPointProgress, postShastaProgress])
  const showMovingPoint =
    visible &&
    showMigration &&
    sectionProgress >= MOVING_POINT_RANGE[0] &&
    sectionProgress < MOVING_POINT_EXIT_PROGRESS
  const trimOffset = useMemo<[number, number]>(
    () => [clampedProgress, 1],
    [clampedProgress],
  )
  const visibilityValue = visible ? "visible" : "none"

  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map || !visible || !shouldMount) return

    let animationFrame = 0
    const animateRipples = (time: number) => {
      SPRING_RIPPLE_LAYER_IDS.forEach((layerId, index) => {
        if (!map.getLayer(layerId)) return

        const phase = (time / 4000 + index / SPRING_RIPPLE_LAYER_IDS.length) % 1
        map.setPaintProperty(layerId, "circle-radius", 5 + phase * 17)
        map.setPaintProperty(
          layerId,
          "circle-opacity",
          0.48 * Math.pow(1 - phase, 1.35),
        )
        map.setPaintProperty(
          layerId,
          "circle-stroke-opacity",
          0.9 * Math.pow(1 - phase, 1.25),
        )
      })

      animationFrame = requestAnimationFrame(animateRipples)
    }

    animationFrame = requestAnimationFrame(animateRipples)
    return () => cancelAnimationFrame(animationFrame)
  }, [mapRef, shouldMount, visible])

  if (!shouldMount) return null

  return (
    <>
      {showRiver ? (
        <>
          <Source
            id={MCCLOUD_HEADWATER_SOURCE_ID}
            type="vector"
            url="mapbox://coeqwal.4ymc2w"
          >
            <Layer
              id="mccloud-headwater-halo"
              type="line"
              source-layer={MCCLOUD_HEADWATER_SOURCE_LAYER}
              paint={{
                "line-color": "#07142c",
                "line-width": 4,
                "line-opacity": 0.55,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
                visibility: visibilityValue,
              }}
            />
            <Layer
              id="mccloud-headwater-body"
              type="line"
              source-layer={MCCLOUD_HEADWATER_SOURCE_LAYER}
              paint={{
                "line-color": FreshWaterColor,
                "line-width": 2.5,
                "line-opacity": 0.9,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
                visibility: visibilityValue,
              }}
            />
          </Source>

          <Source
            id={MCCLOUD_RIVER_SOURCE_ID}
            type="geojson"
            data={mcCloudRiver}
            lineMetrics={true}
          >
            <Layer
              id="mccloud-river-halo"
              type="line"
              paint={{
                "line-color": "#07142c",
                "line-width": 9,
                "line-opacity": 0.75,
                "line-trim-offset": trimOffset,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
                visibility: visibilityValue,
              }}
            />
            <Layer
              id="mccloud-river-body"
              type="line"
              paint={{
                "line-color": FreshWaterColor,
                "line-width": 5,
                "line-opacity": 1,
                "line-trim-offset": trimOffset,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
                visibility: visibilityValue,
              }}
            />
          </Source>

          <Source
            id={MCCLOUD_SPRINGS_SOURCE_ID}
            type="vector"
            url="mapbox://coeqwal.zct2ss"
          >
            {SPRING_RIPPLE_LAYER_IDS.map((layerId) => (
              <Layer
                key={layerId}
                id={layerId}
                type="circle"
                source-layer={MCCLOUD_SPRINGS_SOURCE_LAYER}
                paint={{
                  "circle-color": "rgba(0, 0, 0, 0)",
                  "circle-radius": 7,
                  "circle-opacity": 0.48,
                  "circle-stroke-color": FreshWaterColor,
                  "circle-stroke-opacity": 0.9,
                  "circle-stroke-width": 2.25,
                }}
                layout={{ visibility: visibilityValue }}
              />
            ))}
            <Layer
              id="mccloud-springs-center"
              type="circle"
              source-layer={MCCLOUD_SPRINGS_SOURCE_LAYER}
              paint={{
                "circle-color": FreshWaterColor,
                "circle-radius": 6,
                "circle-opacity": 1,
                "circle-stroke-color": "#fcfbfa",
                "circle-stroke-width": 1.5,
              }}
              layout={{ visibility: visibilityValue }}
            />
          </Source>
        </>
      ) : null}

      {visible ? (
        <>
          {showMovingPoint && movingPointCoordinate ? (
            <Marker
              longitude={movingPointCoordinate[0]}
              latitude={movingPointCoordinate[1]}
            >
              {salmonIconSrc ? (
                <Box
                  component="img"
                  src={salmonIconSrc}
                  alt=""
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    width: 30,
                    height: 18,
                    objectFit: "contain",
                    transform: "translate(-50%, -50%)",
                    filter: "drop-shadow(0 3px 5px rgba(0, 0, 0, 0.45))",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: "absolute",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: InfrastructureColor,
                    border: "2px solid #fcfbfa",
                    boxShadow: "0 0 0 6px rgba(242, 115, 34, 0.22)",
                  }}
                />
              )}
            </Marker>
          ) : null}
        </>
      ) : null}
    </>
  )
}
