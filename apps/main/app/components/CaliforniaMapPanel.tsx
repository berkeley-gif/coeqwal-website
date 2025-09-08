"use client"

import { Map, NavigationControl, GeolocateControl } from "@repo/map"
import { Box } from "@repo/ui/mui"
import CalSimMarkers from "./CalSimMarkers"
import MapGeoSearch from "./MapGeoSearch"

interface CaliforniaMapPanelProps {
  id?: string
  mapboxToken?: string
}

export default function CaliforniaMapPanel({
  id = "california-map",
  mapboxToken,
}: CaliforniaMapPanelProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  return (
    <Box
      id={id}
      sx={{
        position: "sticky",
        top: 0,
        width: "100vw",
        height: "100vh",
        zIndex: (theme) => theme.zIndex.basement, // Map when used as background element
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
        touchZoom={false}
        touchRotate={false}
        dragPan={true}
        doubleClickZoom={true}
        interactive={true}
      >
        {/* Map Controls in lower left */}
        <NavigationControl position="bottom-left" />
        <GeolocateControl position="bottom-left" />
        
        {/* CalSim markers rendered as direct children of Map for proper interaction */}
        <CalSimMarkers />
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
