"use client"

import React from "react"
import { MapboxMapWithContext, useMapInteractions } from "@repo/map"
import { Box } from "@repo/ui/mui"

const MapControls = () => {
  const { flyTo } = useMapInteractions()

  return (
    <Box sx={{ position: "absolute", top: 200, right: 20, zIndex: 10 }}>
      <button onClick={() => flyTo(-122.4, 37.8, 10)}>Controls go here</button>
    </Box>
  )
}

export default function MapWithControls() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
      }}
    >
      <MapboxMapWithContext
        mapboxToken={mapboxToken}
        viewState={{
          longitude: -122.4,
          latitude: 37.8,
          zoom: 8,
          bearing: 0,
          pitch: 0,
        }}
      />
      <MapControls />
    </Box>
  )
}
