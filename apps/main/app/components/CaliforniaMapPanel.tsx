"use client"

import { Map, NavigationControl, Marker } from "@repo/map"
import { Box } from "@repo/ui/mui"
// import CalSimMarkers from "./CalSimMarkers" // Legacy DOM-based markers
import CalSimLayers from "./CalSimLayers"
import BasinsLayer from "./BasinsLayer"
import RiversLayer from "./RiversLayer"
import BasinInflowArrows from "./BasinInflowArrows"
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
  const {
    isPanelsExpanded,
    geocoderMarker,
    showBasins,
    showRivers,
    showInflowArrows,
    inflowArrowsOpacity,
  } = useCalSimToggle()

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
          latitude: 38.4,
          zoom: 6.0,
          bearing: 0,
          pitch: 0,
        }}
        minZoom={5}
        maxZoom={18} // Allow street-level detail
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
            color="red"
          />
        )}

        {/* LEGACY: DOM-based CalSim markers (comment out to use layers only) */}
        {/* <CalSimMarkers /> */}
      </Map>
    </Box>
  )
}
