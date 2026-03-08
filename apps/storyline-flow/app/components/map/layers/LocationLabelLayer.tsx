import React from "react"
import { Marker } from "@repo/map"
import { motion } from "@repo/motion"
import { OceanWaterColor } from "../../helpers/colorPalette"
import { Box } from "@repo/ui/mui"
import { LocationLabel } from "../config/locationPresets"

const MotionBox = motion.create(Box)

export default function LocationLabelLayer({
  locationLabels,
}: {
  locationLabels: LocationLabel[]
}) {
  return (
    <>
      {locationLabels.map((child, idx) => (
        <Marker
          key={`location-${idx}`}
          longitude={child.longitude}
          latitude={child.latitude}
        >
          {React.createElement(TextMarker, { text: child.name })}
        </Marker>
      ))}
    </>
  )
}

//TODO: animation isn't quite smooth
function TextMarker({ text }: { text: string }) {
  return (
    <MotionBox
      sx={{
        color: "common.white",
        typography: "caption",
        backgroundColor: OceanWaterColor,
        position: "relative", // Parent container for positioning
        display: "inline-block",
        padding: "5px 10px", // Padding to create space around the text
        lineHeight: "1", // Ensures the text height matches its line height
        textAlign: "center", // Centers the text horizontally
        textAnchor: "middle", // Centers the text vertically
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { type: "easeInOut", duration: 1 } }}
      exit={{ opacity: 0 }}
    >
      {text}
    </MotionBox>
  )
}
