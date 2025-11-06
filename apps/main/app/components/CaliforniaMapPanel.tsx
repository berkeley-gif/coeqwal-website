"use client"

import { Map, NavigationControl } from "@repo/map"
import { Box } from "@repo/ui/mui"
// import CalSimMarkers from "./CalSimMarkers" // Legacy DOM-based markers
import CalSimLayers from "./CalSimLayers"
import BasinsLayer from "./BasinsLayer"
import HotspotMarkers from "./HotspotMarkers"
import { useCalSimToggle } from "./CalSimContext"
import "./MapboxControlStyles.css"

interface CaliforniaMapPanelProps {
  id?: string
  mapboxToken?: string
}

export default function CaliforniaMapPanel({
  id = "california-map",
  mapboxToken,
}: CaliforniaMapPanelProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { isPanelsExpanded } = useCalSimToggle()

  return (
    <Box
      id={id}
      sx={{
        position: "sticky",
        top: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0, // Map when used as background element
        pointerEvents: "auto", // Ensure map can receive pointer events
      }}
    >
      <Map
        mapboxToken={token}
        mapStyle="mapbox://styles/coeqwal/cmh2f40sm000w01qy8m0gaea8"
        initialViewState={{
          longitude: -120.9,
          latitude: 39,
          zoom: 5.8,
          bearing: 0,
          pitch: 0,
        }}
        minZoom={5}
        maxZoom={10}
        // maxBounds={[
        //   [-124.5, 32.5], // Southwest coordinates (west, south)
        //   [-114.0, 42.0], // Northeast coordinates (east, north)
        // ]}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
        touchZoom={true}
        touchRotate={false}
        dragPan={true}
        dragRotate={false}
        doubleClickZoom={true}
        keyboard={true}
        interactive={true}
        projection={{ name: "mercator" }}
      >
        {/* Map Controls in lower left */}
        <NavigationControl position="bottom-left" />

        {/* Basins GeoJSON Layer - always visible */}
        <BasinsLayer visible={true} />

        {/* HIGH-PERFORMANCE: CalSim layers using Mapbox GL (GPU accelerated) */}
        {/* Hide CalSim layers when hotspot markers are shown */}
        {!isPanelsExpanded && <CalSimLayers />}

        {/* Hotspot markers - appear when progressive panels are expanded */}
        <HotspotMarkers visible={isPanelsExpanded} />

        {/* LEGACY: DOM-based CalSim markers (comment out to use layers only) */}
        {/* <CalSimMarkers /> */}
      </Map>
    </Box>
  )
}
