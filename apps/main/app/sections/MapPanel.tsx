"use client"

import React from "react"
import { Map } from "@repo/map"

interface MapPanelProps {
  /** Mapbox access token */
  mapboxToken: string
  /** Initial map center longitude */
  initialLongitude?: number
  /** Initial map center latitude */
  initialLatitude?: number
  /** Initial zoom level */
  initialZoom?: number
  /** Map style URL */
  mapStyle?: string
}

export default function MapPanel({
  mapboxToken,
  initialLongitude = -120.954, // California Central Valley
  initialLatitude = 38.073,
  initialZoom = 6.3,
  mapStyle = "mapbox://styles/digijill/cmeum8zy2001b01s65c4d1l30",
}: MapPanelProps) {
  return (
    <div
      id="map-panel"
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <Map
          mapboxToken={mapboxToken}
          initialViewState={{
            longitude: initialLongitude,
            latitude: initialLatitude,
            zoom: initialZoom,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
          mapStyle={mapStyle}
          interactiveLayerIds={[]}
        />
      </div>
    </div>
  )
}
