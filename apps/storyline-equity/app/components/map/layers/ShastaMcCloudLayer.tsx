"use client"

import { useEffect, useMemo, useState } from "react"
import { Layer, Marker, Source, useMap } from "@repo/map"
import { motion } from "@repo/motion"
import { mcCloudRiver, salmonMigrationPath } from "@repo/data"
import { Box, Typography } from "@repo/ui/mui"
import {
  InfrastructureColor,
  RiverWaterColor,
} from "../../helpers/colorPalette"
import TreeIcon from "../markers/TreeIcon"

const MCCLOUD_RIVER_SOURCE_ID = "mccloud-river-source"
const MCCLOUD_MARKER_PROGRESS = 0.5
const MOVING_POINT_RANGE: [number, number] = [0.12, 0.38]
const TREE_REVEAL_RANGE: [number, number] = [0.46, 0.82]
const TREE_EXIT_RANGE: [number, number] = [0.82, 0.9]
const TREE_BASE_ZOOM = 9.7
const TREE_MAX_ZOOM_SCALE = 1.55
const SHASTA_DAM_COORDINATE: Coordinate = [-122.42, 40.718]
const TREE_MARKERS = [
  { id: "center", x: 0, y: 0, size: 1, delay: 0 },
  { id: "left", x: -25, y: 5, size: 0.82, delay: 0.32 },
  { id: "right", x: 29, y: 3, size: 0.9, delay: 0.54 },
] as const

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

const MCCLOUD_RIVER_PATH = getLongestLine(
  mcCloudRiver as unknown as LineFeatureCollection,
)
const SALMON_MIGRATION_FULL_PATH = [
  ...getLongestLine(salmonMigrationPath as unknown as LineFeatureCollection),
].reverse()
const {
  before: SALMON_MIGRATION_TO_SHASTA_PATH,
  after: SALMON_MIGRATION_AFTER_SHASTA_PATH,
} = splitLineAtClosestPoint(SALMON_MIGRATION_FULL_PATH, SHASTA_DAM_COORDINATE)
const MCCLOUD_RIVER_MIDPOINT = getPointAlongLine(
  MCCLOUD_RIVER_PATH,
  MCCLOUD_MARKER_PROGRESS,
)

export default function ShastaMcCloudLayer({
  visible,
  progress,
  sectionProgress = 0,
}: {
  visible: boolean
  progress: number
  sectionProgress?: number
}) {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const { mapRef } = useMap()
  const [mapZoom, setMapZoom] = useState(TREE_BASE_ZOOM)
  const treeExitProgress = getRangeProgress(sectionProgress, TREE_EXIT_RANGE)
  const treeOpacity = 1 - treeExitProgress
  const showTrees =
    visible &&
    sectionProgress >= TREE_REVEAL_RANGE[0] &&
    sectionProgress < TREE_EXIT_RANGE[1]
  const movingPointProgress = getRangeProgress(
    sectionProgress,
    MOVING_POINT_RANGE,
  )
  const postShastaProgress = getRangeProgress(sectionProgress, [
    MOVING_POINT_RANGE[1],
    TREE_EXIT_RANGE[1],
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
    sectionProgress >= MOVING_POINT_RANGE[0] &&
    sectionProgress < TREE_EXIT_RANGE[1]
  const treeZoomScale = Math.min(
    TREE_MAX_ZOOM_SCALE,
    Math.max(1, 1 + (mapZoom - TREE_BASE_ZOOM) * 0.22),
  )
  const trimOffset = useMemo<[number, number]>(
    () => [clampedProgress, 1],
    [clampedProgress],
  )
  const visibilityValue = visible ? "visible" : "none"

  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map) return

    const updateZoom = () => setMapZoom(map.getZoom())
    updateZoom()
    map.on("zoom", updateZoom)

    return () => {
      map.off("zoom", updateZoom)
    }
  }, [mapRef])

  return (
    <>
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
            "line-color": RiverWaterColor,
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

      {visible ? (
        <>
          {showMovingPoint && movingPointCoordinate ? (
            <Marker
              longitude={movingPointCoordinate[0]}
              latitude={movingPointCoordinate[1]}
            >
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
            </Marker>
          ) : null}
          <Marker longitude={-122.42} latitude={40.718}>
            <Box
              sx={{
                position: "absolute",
                width: 10,
                height: 10,
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "#fcfbfa",
                border: `2px solid ${InfrastructureColor}`,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
              }}
            />
          </Marker>
          <Marker longitude={-122.42} latitude={40.718}>
            <Typography
              component="span"
              sx={{
                position: "absolute",
                left: 14,
                top: -8,
                whiteSpace: "nowrap",
                color: "#fcfbfa",
                fontSize: "0.75rem",
                fontWeight: 700,
                textShadow: "0 1px 6px rgba(0, 0, 0, 0.75)",
              }}
            >
              Shasta Dam
            </Typography>
          </Marker>
          <Marker longitude={-122.22} latitude={40.92}>
            <Typography
              component="span"
              sx={{
                position: "absolute",
                left: 10,
                top: -6,
                whiteSpace: "nowrap",
                color: "#fcfbfa",
                fontSize: "0.75rem",
                fontWeight: 700,
                textShadow: "0 1px 6px rgba(0, 0, 0, 0.75)",
              }}
            >
              McCloud River
            </Typography>
          </Marker>
          {showTrees && MCCLOUD_RIVER_MIDPOINT ? (
            <Marker
              longitude={MCCLOUD_RIVER_MIDPOINT[0]}
              latitude={MCCLOUD_RIVER_MIDPOINT[1]}
            >
              <Box
                aria-hidden="true"
                sx={{
                  position: "absolute",
                  width: 70,
                  height: 68,
                  transform: `translate(-50%, -100%) scale(${treeZoomScale})`,
                  transformOrigin: "50% 100%",
                  opacity: treeOpacity,
                  color: "#269d2c",
                  pointerEvents: "none",
                }}
              >
                {TREE_MARKERS.map((tree) => (
                  <Box
                    key={tree.id}
                    sx={{
                      position: "absolute",
                      left: `calc(50% + ${tree.x}px)`,
                      bottom: -tree.y,
                      width: 30,
                      height: 58,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 16, scale: tree.size * 0.72 }}
                      animate={{ opacity: 1, y: 0, scale: tree.size }}
                      transition={{
                        duration: 0.36,
                        delay: tree.delay,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        filter: "drop-shadow(0 8px 12px rgba(0, 0, 0, 0.35))",
                        transformOrigin: "50% 100%",
                      }}
                    >
                      <TreeIcon width="100%" height="100%" />
                    </motion.div>
                  </Box>
                ))}
              </Box>
            </Marker>
          ) : null}
        </>
      ) : null}
    </>
  )
}
