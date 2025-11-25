"use client"

import { useEffect, useRef } from "react"
import { Map, NavigationControl, Marker, useMap } from "@repo/map"
import { Box } from "@repo/ui/mui"
import CalSimLayers from "./CalSimLayers"
import BasinsLayer from "./BasinsLayer"
import RiversLayer from "./RiversLayer"
import BasinInflowArrows from "./BasinInflowArrows"
import HotspotMarkers from "./HotspotMarkers"
import { useCalSimToggle } from "./CalSimContext"
import "./MapboxControlStyles.css"

// Map view states
interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
}

// Initial view of California
export const CALIFORNIA_VIEW: MapViewState = {
  longitude: -119.4,
  latitude: 37.5,
  zoom: 4,
  bearing: 0,
  pitch: 0,
}

// Central Valley view
export const CENTRAL_VALLEY_VIEW: MapViewState = {
  longitude: -120.8,
  latitude: 38.5,
  zoom: 5.82,
  bearing: 0,
  pitch: 0,
}

const PANEL_VIEW_STATES: Record<string, MapViewState> = {
  "calsim-call": CALIFORNIA_VIEW,
  "central-valley-importance": CENTRAL_VALLEY_VIEW,
}

interface CaliforniaMapPanelProps {
  id?: string
  mapboxToken?: string
}

export default function CaliforniaMapPanel({
  id = "california-map",
  mapboxToken,
}: CaliforniaMapPanelProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const map = useMap()
  const {
    isPanelsExpanded,
    geocoderMarker,
    showBasins,
    showRivers,
    riversAnimationProgress,
    showInflowArrows,
    inflowArrowsOpacity,
    activePanel,
  } = useCalSimToggle()

  const previousPanelRef = useRef<string | null>(null)

  // Scroll-driven zoom: Update map view when active panel changes
  // Only applies to initial panels (California view and Central Valley zoom)
  useEffect(() => {
    if (!activePanel || !map.mapRef?.current) {
      return
    }

    // Skip if panel hasn't actually changed
    if (previousPanelRef.current === activePanel) {
      return
    }

    const viewState = PANEL_VIEW_STATES[activePanel]
    if (!viewState) {
      previousPanelRef.current = activePanel
      return
    }

    previousPanelRef.current = activePanel

    // Only allow camera movements for the first two panels
    // After that, camera should stay fixed
    const allowedPanels = ["calsim-call", "central-valley-importance"]
    if (!allowedPanels.includes(activePanel)) {
      return
    }

    // Use easeTo for smooth camera transitions
    map.mapRef.current.easeTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      bearing: viewState.bearing,
      pitch: viewState.pitch,
      duration: 2000,
      easing: (t: number) => t * (2 - t), // ease-out-quad
    })
  }, [activePanel, map])

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
        initialViewState={CALIFORNIA_VIEW}
        minZoom={4}
        maxZoom={18}
        maxBounds={[
          [-135.0, 25.0], // Southwest - wider bounds for positioning flexibility
          [-105.0, 48.0], // Northeast - wider bounds for positioning flexibility
        ]}
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

        {/* Basins GeoJSON Layer - shows when scrolling to "three basins" panel */}
        <BasinsLayer visible={showBasins} />

        {/* Rivers GeoJSON Layer - shows when scrolling to "rivers" panel */}
        <RiversLayer visible={showRivers} progress={riversAnimationProgress} />

        {/* Basin Inflow Arrows - shows when scrolling to "water flow" panel */}
        <BasinInflowArrows
          visible={showInflowArrows}
          opacity={inflowArrowsOpacity}
        />

        {/* HIGH-PERFORMANCE: CalSim layers using Mapbox GL (GPU accelerated) */}
        {/* Hide CalSim layers when hotspot markers are shown */}
        {!isPanelsExpanded && <CalSimLayers />}

        {/* Hotspot markers - appear when progressive panels are expanded */}
        <HotspotMarkers visible={isPanelsExpanded} />

        {/* Geocoder marker - shows the selected location from basin search */}
        {geocoderMarker && (
          <Marker
            longitude={geocoderMarker[0]}
            latitude={geocoderMarker[1]}
            anchor="center"
          >
            <Box
              sx={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                fontSize: "28px",
                lineHeight: 1,
              }}
            >
              📍
            </Box>
          </Marker>
        )}

        {/* LEGACY: DOM-based CalSim markers (comment out to use layers only) */}
        {/* <CalSimMarkers /> */}
      </Map>
    </Box>
  )
}
