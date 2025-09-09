import { motion } from "@repo/motion"
import { InfrastructureColor, OceanWaterColor } from "./colorPalette"
import { Marker } from "@repo/map"
import React from "react"

export type MarkerType = {
  id: string
  name: string
  latitude: number
  longitude: number
  captions?: string[]
  source?: string
  images?: string[]
  anchor?: string
  rotation?: number
}

export function TextMarkersLayer({
  markers,
  styledMarker = TextMarker,
}: {
  markers: MarkerType[]
  styledMarker?: React.FC<{ text: string }>
}) {
  return (
    <>
      {markers.map((child, idx) => (
        <Marker key={idx} longitude={child.longitude} latitude={child.latitude}>
          {React.createElement(styledMarker, { text: child.name })}
        </Marker>
      ))}
    </>
  )
}

export function TextMarker({ text }: { text: string }) {
  return (
    <motion.div
      style={{
        fontFamily: "akzidenz-grotesk-next-pro",
        position: "relative", // Parent container for positioning
        display: "inline-block",
        backgroundColor: `${text.includes("Delta") ? InfrastructureColor : OceanWaterColor}`, // Background color
        padding: "4px 8px", // Padding to create space around the text
        color: "#f2f0ef", // Text color
        fontSize: "1rem", // Font size
        lineHeight: "1", // Ensures the text height matches its line height
        textAlign: "center", // Centers the text horizontally
        textAnchor: "middle", // Centers the text vertically
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
    >
      {text}
    </motion.div>
  )
}
