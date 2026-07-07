"use client"

import { Marker } from "@repo/map"
import { motion } from "@repo/motion"
import { Box } from "@repo/ui/mui"
import { OceanWaterColor } from "../../helpers/colorPalette"
import type { LocationLabel } from "../config/locationPresets"

const MotionBox = motion.create(Box)

export default function LocationLabelLayer({
  locationLabels,
  progress,
}: {
  locationLabels: LocationLabel[]
  progress: number
}) {
  const showLabels = progress >= 0.12

  if (!showLabels) return null

  return (
    <>
      {locationLabels.map((label) => (
        <Marker
          key={label.id}
          longitude={label.longitude}
          latitude={label.latitude}
        >
          <MotionBox
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            sx={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              color: "common.white",
              typography: "caption",
              fontWeight: 700,
              backgroundColor: OceanWaterColor,
              padding: "5px 10px",
              lineHeight: 1,
              whiteSpace: "nowrap",
              textAlign: "center",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.22)",
            }}
          >
            {label.name}
          </MotionBox>
        </Marker>
      ))}
    </>
  )
}
