"use client"

import { useMemo } from "react"
import { Marker } from "@repo/map"
import { motion } from "@repo/motion"
import { dams } from "@repo/data"
import { Box, Typography } from "@repo/ui/mui"
import { InfrastructureColor } from "../../helpers/colorPalette"

type DamFeature = {
  type: "Feature"
  properties: {
    Dam_Name?: string
    Year_Built?: string
    Capacity_acre_feet?: number
  }
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
}

type DamMarker = {
  id: string
  name: string
  year: number
  longitude: number
  latitude: number
  capacity: number
}

const INFRASTRUCTURE_REVEAL_RANGE: [number, number] = [0.08, 0.78]

function normalizeProgress(
  progress: number,
  [start, end]: [number, number],
) {
  if (end === start) return progress >= start ? 1 : 0
  return Math.max(0, Math.min(1, (progress - start) / (end - start)))
}

function parseBuiltYear(value?: string) {
  if (!value?.trim()) return null

  const year = Number(value)
  return Number.isFinite(year) ? year : null
}

function readDamMarkers(): DamMarker[] {
  const features = "features" in dams ? (dams.features as DamFeature[]) : []

  return features
    .map((feature, index) => {
      const year = parseBuiltYear(feature.properties.Year_Built)
      const [longitude, latitude] = feature.geometry.coordinates

      if (year === null) return null

      return {
        id: `${feature.properties.Dam_Name ?? "dam"}-${index}`,
        name: feature.properties.Dam_Name ?? "Dam",
        year,
        longitude,
        latitude,
        capacity: feature.properties.Capacity_acre_feet ?? 0,
      }
    })
    .filter((marker): marker is DamMarker => marker !== null)
    .sort((a, b) => a.year - b.year)
}

export default function DamChronologyLayer({
  visible,
  progress,
}: {
  visible: boolean
  progress: number
}) {
  const markers = useMemo(() => readDamMarkers(), [])
  const yearRange = useMemo(() => {
    const years = markers.map((marker) => marker.year)
    return {
      min: Math.min(...years),
      max: Math.max(...years),
    }
  }, [markers])

  if (!visible || markers.length === 0) return null

  const revealProgress = normalizeProgress(progress, INFRASTRUCTURE_REVEAL_RANGE)
  const currentYear =
    yearRange.min + revealProgress * (yearRange.max - yearRange.min)

  return (
    <>
      {markers.map((marker) => {
        if (marker.year > currentYear) return null

        const size = Math.max(
          12,
          Math.min(26, 10 + Math.sqrt(marker.capacity) / 52),
        )
        const height = size * 0.866

        return (
          <Marker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
          >
            <Box
              title={`${marker.name}, built ${marker.year}`}
              sx={{
                position: "absolute",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            >
              <motion.svg
                width={size}
                height={height}
                viewBox={`0 0 ${size} ${height}`}
                initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{
                  display: "block",
                  filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35))",
                }}
              >
                <polygon
                  points={`${size / 2},0 ${size},${height} 0,${height}`}
                  fill={InfrastructureColor}
                  stroke="#fcfbfa"
                  strokeWidth="1"
                />
              </motion.svg>
            </Box>
          </Marker>
        )
      })}

      <Typography
        component="div"
        sx={{
          position: "fixed",
          right: "calc(35% - 1rem)",
          bottom: "1.5rem",
          transform: "translateX(100%)",
          zIndex: 1,
          color: "#fcfbfa",
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
          pointerEvents: "none",
        }}
      >
        Dam construction through {Math.floor(currentYear)}
      </Typography>
    </>
  )
}
