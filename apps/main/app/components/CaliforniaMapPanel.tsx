"use client"

import { useEffect } from "react"
import { Map, NavigationControl, useMap } from "@repo/map"
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

// Component to handle map centering based on panel visibility
function MapCenterController() {
  const { isPanelsVisible } = useCalSimToggle()
  const { flyTo, mapRef } = useMap()

  useEffect(() => {
    if (!flyTo) return

    // Add a small delay to ensure map is fully loaded
    setTimeout(() => {
      try {
        if (isPanelsVisible) {
          // Use the map package's context API flyTo method
          flyTo(-125, 38.073, 7.0, 0, 0, {
            duration: 1000,
            essential: true,
          })
        } else {
          flyTo(-119, 38.073, 6.3, 0, 0, {
            duration: 2000,
            essential: true,
          })
        }
      } catch (error) {
        console.error("Error executing flyTo:", error)
      }
    }, 200)
  }, [isPanelsVisible, flyTo, mapRef])

  return null // This component only handles side effects
}

export default function CaliforniaMapPanel({
  id = "california-map",
  mapboxToken,
}: CaliforniaMapPanelProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { showBasins, isPanelsExpanded } = useCalSimToggle()

  return (
    <Box
      id={id}
      sx={{
        position: "sticky",
        top: 0,
        width: "100vw",
        height: "100vh",
        zIndex: (theme) => theme.zIndex.basement, // Map when used as background element
        pointerEvents: "auto", // Ensure map can receive pointer events
      }}
    >
      <Map
        mapboxToken={token}
        mapStyle="mapbox://styles/digijill/clz4h7lfm00mn01rih4x75g46"
        initialViewState={{
          longitude: -119,
          latitude: 38.073,
          zoom: 6.3,
          bearing: 0,
          pitch: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
        touchZoom={true}
        touchRotate={false}
        dragPan={true}
        dragRotate={false}
        doubleClickZoom={true}
        keyboard={true}
        interactive={true}
      >
        {/* Map center controller for panel expansion */}
        <MapCenterController />

        {/* Map Controls in lower left */}
        <NavigationControl position="bottom-left" />

        {/* Basins GeoJSON Layer */}
        <BasinsLayer visible={showBasins} />

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
