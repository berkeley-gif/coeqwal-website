"use client"

import React, { useState } from "react"
import { Map, MapProvider, useMap } from "@repo/map"
import { Box, Button, Typography } from "@repo/ui/mui"

// Layer colors
const WATER_COLORS = [
  "#0080ff", // Default blue
  "#46b3ff", // Light blue
  "#004c99", // Dark blue
  "#7adeee", // Turquoise
  "#003366", // Navy
]

const MapControls = () => {
  const [colorIndex, setColorIndex] = useState(0)
  const { flyTo, setPaintProperty, viewState, withMap } = useMap()

  // Handle changing water color
  const changeWaterColor = () => {
    const nextIndex = (colorIndex + 1) % WATER_COLORS.length
    setColorIndex(nextIndex)

    // Use direct access to map methods
    setPaintProperty("water", "fill-color", WATER_COLORS[nextIndex])
  }

  // Example flyTo locations
  const locations = [
    { name: "Sacramento", coords: [-121.4944, 38.5816] },
    { name: "San Francisco", coords: [-122.4194, 37.7749] },
    { name: "Los Angeles", coords: [-118.2437, 34.0522] },
  ]

  return (
    <Box
      sx={{
        position: "absolute",
        top: 200,
        right: 20,
        zIndex: 10,
        bgcolor: "rgba(255, 255, 255, 0.8)",
        p: 2,
        borderRadius: 2,
        boxShadow: 2,
        pointerEvents: "auto",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Map Controls
      </Typography>

      {/* Current view state display */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          Long: {viewState.longitude.toFixed(2)}, Lat:{" "}
          {viewState.latitude.toFixed(2)}, Zoom: {viewState.zoom.toFixed(1)}
        </Typography>
      </Box>

      {/* Location buttons */}
      <Box sx={{ mb: 2 }}>
        {locations.map((location) => (
          <Button
            key={location.name}
            variant="outlined"
            size="small"
            sx={{ mr: 1, mb: 1 }}
            onClick={() => {
              const lng = location.coords[0];
              const lat = location.coords[1];
              if (typeof lng === 'number' && typeof lat === 'number') {
                flyTo(lng, lat, 10);
              }
            }}
          >
            {location.name}
          </Button>
        ))}
      </Box>

      {/* Map styling */}
      <Button variant="contained" onClick={changeWaterColor} size="small">
        Change Water Color
      </Button>
    </Box>
  )
}

export default function MapWithControls() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  return (
    <MapProvider>
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
        <Map
          mapboxToken={mapboxToken}
          viewState={{
            longitude: -122.4,
            latitude: 37.8,
            zoom: 8,
            bearing: 0,
            pitch: 0,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          scrollZoom={true}
          style={{ width: "100%", height: "100%" }}
        />
        <MapControls />
      </Box>
    </MapProvider>
  )
}
