"use client"

import { useEffect, useRef } from "react"
import { Map, NavigationControl, Marker, useMap } from "@repo/map"
import { Box } from "@repo/ui/mui"
// import CalSimMarkers from "./CalSimMarkers" // Legacy DOM-based markers
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
  bearing?: number
  pitch?: number
}

const PANEL_VIEW_STATES: Record<string, MapViewState> = {
  // Panel 1: Wide view of California (initial state)
  "calsim-call": {
    longitude: -119.5,
    latitude: 37.0,
    zoom: 5,
    bearing: 0,
    pitch: 0,
  },
  // Panel 2+: Zoomed into Central Valley (stays here for all subsequent panels)
  "central-valley-importance": {
    longitude: -120.8,
    latitude: 37.9,
    zoom: 6.5,
    bearing: 0,
    pitch: 0,
  },
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
    showInflowArrows,
    inflowArrowsOpacity,
    activePanel,
  } = useCalSimToggle()

  // Track if this is the first panel change (skip zoom on initial load)
  const isInitialLoadRef = useRef(true)
  const previousPanelRef = useRef<string | null>(null)

  // Allow zoom after page has settled (prevent rapid-fire initial triggers)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[Map Zoom] Initial load period complete, zoom enabled')
      isInitialLoadRef.current = false
    }, 1000) // Wait 1 second for page to fully settle

    return () => clearTimeout(timer)
  }, [])

  // Scroll-driven zoom: Update map view when active panel changes
  useEffect(() => {
    if (!activePanel || !map.flyTo) {
      console.log(`[Map Zoom] Skipping - activePanel: ${activePanel}, map.flyTo: ${!!map.flyTo}`)
      return
    }

    // Skip zoom during initial load period
    if (isInitialLoadRef.current) {
      console.log(`[Map Zoom] Still in initial load period, panel: ${activePanel}, skipping zoom`)
      previousPanelRef.current = activePanel
      return
    }

    // Skip if panel hasn't actually changed
    if (previousPanelRef.current === activePanel) {
      console.log(`[Map Zoom] Panel unchanged: ${activePanel}, skipping`)
      return
    }

    const viewState = PANEL_VIEW_STATES[activePanel]
    if (!viewState) {
      console.log(`[Map Zoom] No view state found for panel: ${activePanel}`)
      previousPanelRef.current = activePanel
      return
    }

    console.log(`[Map Zoom] Panel changed from ${previousPanelRef.current} to ${activePanel}, zooming to:`, viewState)
    previousPanelRef.current = activePanel

    map.flyTo({
      longitude: viewState.longitude,
      latitude: viewState.latitude,
      zoom: viewState.zoom,
      bearing: viewState.bearing,
      pitch: viewState.pitch,
      transitionOptions: { duration: 2000 },
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
        initialViewState={{
          longitude: -119.5,
          latitude: 37.0,
          zoom: 5,
          bearing: 0,
          pitch: 0,
        }}
        minZoom={5}
        maxZoom={18} 
        maxBounds={[
          [-130.0, 28.0], // Southwest coordinates (west, south) - more generous
          [-108.0, 46.0], // Northeast coordinates (east, north) - more generous
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
        <RiversLayer visible={showRivers} />

        {/* Basin Inflow Arrows - shows when scrolling to "water flow" panel */}
        <BasinInflowArrows visible={showInflowArrows} opacity={inflowArrowsOpacity} />

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
