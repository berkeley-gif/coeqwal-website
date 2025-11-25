"use client"

import React, { useState } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import {
  Map,
  NavigationControl,
  GeolocateControl,
  MapProvider,
} from "@repo/map"
import SearchSortBar from "../../components/SearchSortBar"
import ScenarioPanel from "./components/ScenarioPanel"
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
        height: "100%",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      {/* Left Panel: Scenarios */}
      <Box
        sx={{
          width: "45%",
          display: "flex",
          flexDirection: "column",
          borderRight: theme.border.standard,
          borderColor: theme.palette.grey[300],
          backgroundColor: theme.palette.common.white,
        }}
      >
        <SearchSortBar placeholder="Search scenarios..." showReset={false} />
        <ScenarioPanel onTierClick={handleTierClick} />
      </Box>

      {/* Right Panel: Map */}
      <Box
        sx={{
          width: "55%",
          position: "relative",
        }}
      >
        <Map
          mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
          mapStyle="mapbox://styles/coeqwal/cmh2f40sm000w01qy8m0gaea8"
          initialViewState={{
            longitude: -118,
            latitude: 39,
            zoom: 4,
          }}
          minZoom={4}
          maxZoom={18}
          maxBounds={[
            [-126, 30], // Southwest
            [-112, 44], // Northeast
          ]}
          scrollZoom={true}
          touchZoom={true}
          doubleClickZoom={true}
          dragPan={true}
          dragRotate={false}
          touchRotate={false}
          keyboard={true}
          style={{ width: "100%", height: "100%" }}
          projection={{ name: "mercator" }}
        >
          <NavigationControl position="bottom-right" />
          <GeolocateControl position="bottom-right" />

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
            left: theme.spacing(2),
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
              fontSize: theme.typography.body2.fontSize,
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
