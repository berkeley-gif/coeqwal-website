"use client"

import React, { useState } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import {
  Map,
  NavigationControl,
  GeolocateControl,
  MapProvider,
} from "@repo/map"
import ListView from "../ListView/ListView"
import TierMarkers from "../../components/TierMarkers"
import { useTierMapData } from "../../hooks/useTierMapData"

/**
 * MapView
 * Left side: Scenario selection panel
 * Right side: Map with location-based tier data
 * Shows which scenarios perform best at specific locations
 */
function MapViewContent() {
  const theme = useTheme()
  const [selectedTier, setSelectedTier] = useState<{
    strategy: string
    outcome: string
  } | null>(null)

  const { tierData } = useTierMapData({
    selectedTier,
  })

  const handleTierClick = (strategy: string, outcome: string) => {
    setSelectedTier({ strategy, outcome })
  }

  return (
    <Box
      sx={{
        display: "flex",
        // Account for header (40px) + tabs (~48px) + banner (~60px) + search (~56px) + padding
        height: "calc(100vh - 220px)",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      {/* Left Panel: Scenarios (scrollable via ListView) */}
      <Box
        sx={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          borderRight: theme.border.standard,
          borderColor: theme.palette.grey[300],
          backgroundColor: theme.palette.common.white,
        }}
      >
        <ListView compact onTierClick={handleTierClick} />
      </Box>

      {/* Right Panel: Map (fixed) */}
      <Box
        sx={{
          width: "50%",
          height: "80vh",
          position: "relative",
          // Offset map controls up from bottom
          "& .mapboxgl-ctrl-bottom-left": {
            bottom: "80px",
          },
        }}
      >
        <Map
          mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
          mapStyle="mapbox://styles/coeqwal/cmh2f40sm000w01qy8m0gaea8"
          initialViewState={{
            longitude: -120.5,
            latitude: 37.5,
            zoom: 5.8,
          }}
          minZoom={4}
          maxZoom={18}
          maxBounds={[
            [-126, 30], // Southwest
            [-112, 44], // Northeast
          ]}
          scrollZoom={false}
          touchZoom={true}
          doubleClickZoom={true}
          dragPan={true}
          dragRotate={false}
          touchRotate={false}
          keyboard={true}
          style={{ width: "100%", height: "100%" }}
          projection={{ name: "mercator" }}
        >
          <NavigationControl position="bottom-left" />
          <GeolocateControl position="bottom-left" />

          {/* Tier location markers */}
          {tierData && tierData.features && tierData.features.length > 0 && (
            <TierMarkers data={tierData} />
          )}
        </Map>

        {/* Info overlay */}
        <Box
          sx={{
            position: "absolute",
            top: theme.spacing(2),
            right: theme.spacing(2),
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: theme.borderRadius.rounded,
            padding: theme.spacing(2),
            boxShadow: theme.shadow.subtle,
            maxWidth: theme.spacing(40),
          }}
        >
          <Box
            component="p"
            sx={{
              margin: 0,
              fontSize: theme.typography.compact.subtitle.fontSize,
              color: theme.palette.text.primary,
            }}
          >
            Click on a scenario outcome in the left panel to see outcomes at
            specific locations.
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

// Exported wrapper that provides its own MapProvider context
export default function MapView() {
  return (
    <MapProvider>
      <MapViewContent />
    </MapProvider>
  )
}
