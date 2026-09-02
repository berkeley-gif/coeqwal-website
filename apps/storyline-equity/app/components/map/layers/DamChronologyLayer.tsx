"use client"

import { Marker } from "@repo/map"
import { motion } from "@repo/motion"
import { dams } from "@repo/data"
import { Box } from "@repo/ui/mui"
import {
  InfrastructureColor,
  InfrastructureOutlineColor,
  InfrastructureOutlineOpacity,
} from "../../helpers/colorPalette"

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

function parseBuiltYear(value?: string) {
  if (!value?.trim()) return null

  const year = Number(value)
  return Number.isFinite(year) && year > 0 ? year : null
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

const damMarkers = readDamMarkers()
const post2000Years = damMarkers
  .map((marker) => marker.year)
  .filter((year) => year >= 2000)
const damChronologyPhases = [
  { endYear: 1899, label: "before 1900" },
  ...Array.from({ length: 10 }, (_, index) => {
    const decade = 1900 + index * 10
    return { endYear: decade + 9, label: `the ${decade}s` }
  }),
  ...(post2000Years.length > 0
    ? [
        {
          endYear: Math.max(...post2000Years),
          label: "2000 and later",
        },
      ]
    : []),
]

function getDamChronologyPhase(progress: number) {
  const phaseIndex = Math.min(
    damChronologyPhases.length - 1,
    Math.floor(progress * damChronologyPhases.length),
  )
  return damChronologyPhases[Math.max(0, phaseIndex)]!
}

export function getDamConstructionLabel(progress: number) {
  const phase = getDamChronologyPhase(progress)
  return `Dam construction ${phase.label.startsWith("before") ? "" : "through "}${phase.label}`
}

export default function DamChronologyLayer({
  visible,
  progress,
}: {
  visible: boolean
  progress: number
}) {
  if (!visible || damMarkers.length === 0) return null

  const revealProgress = progress
  const currentPhase = getDamChronologyPhase(revealProgress)

  return (
    <>
      {damMarkers.map((marker) => {
        if (marker.year > currentPhase.endYear) return null

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
                }}
              >
                <polygon
                  points={`${size / 2},0 ${size},${height} 0,${height}`}
                  fill={InfrastructureColor}
                  stroke={InfrastructureOutlineColor}
                  strokeOpacity={InfrastructureOutlineOpacity}
                  strokeWidth="1"
                />
              </motion.svg>
            </Box>
          </Marker>
        )
      })}
    </>
  )
}
