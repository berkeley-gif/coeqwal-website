"use client"

import { useEffect, useRef } from "react"
import { Map, NavigationControl, Marker, useMap } from "@repo/map"
import { Box } from "@repo/ui/mui"
import BasinsLayer from "./layers/BasinsLayer"
import RiversLayer from "./layers/RiversLayer"
import BasinInflowArrows from "./layers/BasinInflowArrows"
import { useLearnMap } from "./LearnMapContext"
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
  longitude: -120.2,
  latitude: 37.5,
  zoom: 5,
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

// Map bounds
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-145.0, 20.0], // Southwest
  [-95.0, 55.0], // Northeast
]

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
    geocoderMarker,
    showBasins,
    showRivers,
    riversAnimationProgress,
    showInflowArrows,
    inflowArrowsOpacity,
    activePanel,
  } = useLearnMap()

  const previousPanelRef = useRef<string | null>(null)

  // Scroll-driven zoom: Update map view when active panel changes
  // Currently only applies to initial panels (California view and Central Valley zoom)
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
        maxBounds={MAP_BOUNDS}
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
        <NavigationControl position="bottom-left" />

        {/* Basins GeoJSON layer */}
        <BasinsLayer visible={showBasins} />

        {/* Rivers GeoJSON layer */}
        <RiversLayer visible={showRivers} progress={riversAnimationProgress} />

        {/* Basin inflow arrows */}
        <BasinInflowArrows
          visible={showInflowArrows}
          opacity={inflowArrowsOpacity}
        />

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
      </Map>
    </Box>
  )
}
