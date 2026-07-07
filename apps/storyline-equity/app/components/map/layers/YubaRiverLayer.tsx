"use client"

import { useEffect, useMemo } from "react"
import { Layer, Marker, Source, useMap } from "@repo/map"
import { yubaRiver } from "@repo/data"
import { Box, Typography } from "@repo/ui/mui"
import { RiverWaterColor } from "../../helpers/colorPalette"

const YUBA_RIVER_LAYER_IDS = ["yuba-river-halo", "yuba-river-body"] as const

const YUBA_RIVER_SOURCE_ID = "yuba-river-source"
const RIVER_HALO_COLOR = "#07142c"
const YUBA_RIVER_LABEL_COORDINATE: [number, number] = [-121.05, 39.28]
const HEADWATERS_PHASE_END = 0.58

type Coordinate = [number, number]
type LineGeometry = {
  type: "LineString" | "MultiLineString"
  coordinates: Coordinate[] | Coordinate[][]
}
type YubaRiverFeature = {
  type: "Feature"
  properties?: {
    flow_order?: number
    segment?: string
  } | null
  geometry?: LineGeometry | null
}
type YubaRiverFeatureCollection = {
  type: "FeatureCollection"
  features: YubaRiverFeature[]
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

function getAnimatedYubaRiver(
  headwatersProgress: number,
  mainstemProgress: number,
) {
  const data = yubaRiver as YubaRiverFeatureCollection

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

type YubaRiverData = typeof yubaRiver

export default function YubaRiverLayer({
  visible,
  progress,
}: {
  visible: boolean
  progress: number
}) {
  const { mapRef } = useMap()
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const headwatersProgress = Math.min(clampedProgress / HEADWATERS_PHASE_END, 1)
  const mainstemProgress = Math.max(
    0,
    (clampedProgress - HEADWATERS_PHASE_END) / (1 - HEADWATERS_PHASE_END),
  )
  const animatedYubaRiver = useMemo(
    () => getAnimatedYubaRiver(headwatersProgress, mainstemProgress),
    [headwatersProgress, mainstemProgress],
  )
  const visibilityValue = visible ? "visible" : "none"

  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    YUBA_RIVER_LAYER_IDS.forEach((id) => {
      if (!map.getLayer(id)) return

      map.setLayoutProperty(id, "visibility", visibilityValue)
    })
  }, [mapRef, visibilityValue])

  useEffect(() => {
    if (!visible) return
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    YUBA_RIVER_LAYER_IDS.forEach((id) => {
      try {
        if (map.getLayer(id)) map.moveLayer(id)
      } catch {
        // Layer order is best-effort while the Mapbox style settles.
      }
    })
  }, [mapRef, visible])

  return (
    <>
      <Source
        id={YUBA_RIVER_SOURCE_ID}
        type="geojson"
        data={animatedYubaRiver as YubaRiverData}
      >
        <Layer
          id="yuba-river-halo"
          type="line"
          paint={{
            "line-color": RIVER_HALO_COLOR,
            "line-width": 9,
            "line-opacity": 0.72,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
            visibility: visibilityValue,
          }}
        />
        <Layer
          id="yuba-river-body"
          type="line"
          paint={{
            "line-color": RiverWaterColor,
            "line-width": 5,
            "line-opacity": 1,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
            visibility: visibilityValue,
          }}
        />
      </Source>

      {visible ? (
        <Marker
          longitude={YUBA_RIVER_LABEL_COORDINATE[0]}
          latitude={YUBA_RIVER_LABEL_COORDINATE[1]}
        >
          <Box
            sx={{ position: "absolute", transform: "translate(-50%, -50%)" }}
          >
            <Typography
              component="span"
              sx={{
                position: "absolute",
                left: 12,
                top: -10,
                whiteSpace: "nowrap",
                color: "#fcfbfa",
                fontSize: "0.75rem",
                fontWeight: 700,
                textShadow: "0 1px 6px rgba(0, 0, 0, 0.75)",
              }}
            >
              Yuba River
            </Typography>
          </Box>
        </Marker>
      ) : null}
    </>
  )
}
