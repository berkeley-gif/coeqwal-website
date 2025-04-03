"use client"

import React from "react"
import { Map, MapProvider } from "@repo/map"
import { Box } from "@repo/ui/mui"

export default function MapContainer() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  return (
    <MapProvider>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "relative",
          pointerEvents: "auto", // Ensure map gets events
        }}
      >
        <Map
          mapboxToken={mapboxToken}
          viewState={{
            longitude: -122.4,
            latitude: 37.8,
            zoom: 8,
            bearing: 0,
            pitch: 0,
          }}
          mapStyle="mapbox://styles/digijill/cl122pj52001415qofin7bb1c"
          scrollZoom={true}
          style={{ width: "100%", height: "100%" }}
        />
      </Box>
    </MapProvider>
  )
}
