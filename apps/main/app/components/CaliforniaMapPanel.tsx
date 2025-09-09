"use client"

import { Map, NavigationControl, GeolocateControl } from "@repo/map"
import { Box } from "@repo/ui/mui"
// import CalSimMarkers from "./CalSimMarkers" // Legacy DOM-based markers
import CalSimLayers from "./CalSimLayers"
import MapGeoSearch from "./MapGeoSearch"
import BasinsLayer from "./BasinsLayer"
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
  const { showBasins } = useCalSimToggle()

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
        {/* Map Controls in lower left */}
        <NavigationControl position="bottom-left" />
        <GeolocateControl
          position="bottom-left"
          positionOptions={{
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0,
          }}
          trackUserLocation={false}
          showUserHeading={false}
          showAccuracyCircle={true}
          style={{
            position: "absolute",
            left: "60px",
            bottom: "30px", // Align with bottom of zoom controls
            zIndex: 1,
          }}
        />

        {/* Basins GeoJSON Layer */}
        <BasinsLayer visible={showBasins} />

        {/* HIGH-PERFORMANCE: CalSim layers using Mapbox GL (GPU accelerated) */}
        <CalSimLayers />

        {/* LEGACY: DOM-based CalSim markers (comment out to use layers only) */}
        {/* <CalSimMarkers /> */}
      </Map>

      {/* Geolocation search box positioned to avoid control overlap */}
      <MapGeoSearch
        position="bottom-left"
        mapboxToken={token}
        placeholder="Search California location..."
        onLocationSearch={(query) => {
          console.log("Location search completed:", query)
        }}
      />
    </Box>
  )
}
