"use client"

import React from "react"
import { Box, Typography, IconButton, TextField, Button, Stack } from "@repo/ui/mui"
import { Card, ScenarioCard, ScenarioCardList } from "@repo/ui"
import { Map, useMap, NavigationControl, GeolocateControl } from "@repo/map"
import SearchIcon from "@mui/icons-material/Search"
import LayersIcon from "@mui/icons-material/Layers"
import FilterListIcon from "@mui/icons-material/FilterList"
import MyLocationIcon from "@mui/icons-material/MyLocation"

interface MapPanelProps {
  onOpenThemesDrawer?: (operationId?: string) => void
}

const MapControls = () => {
  const { flyTo } = useMap()

  const handleCenterOnCalifornia = () => {
    flyTo(-120.759, 38.032, 6.3) // Initial view of whole state
  }

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        pointerEvents: "none", // Refine for map interactions between map and overlay
        p: 3,
      }}
    >
      {/* Three Column Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 3,
          height: "100%",
        }}
      >
        {/* Left Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ScenarioCard
            topLine="CHOOSE SCENARIOS. STARTING WITH:"
            headline="Current Operations Scenario"
            body={
              <ScenarioCardList items={[
                "helps us understand how California manages water today",
                "serves as a foundation to compare alternative scenarios"
              ]} />
            }
                          bottomLine={
                <>
                  Choose alternative scenarios to compare{" "}
                  <span style={{ 
                    fontSize: '0.875em', 
                    lineHeight: 1,
                    verticalAlign: 'baseline',
                    display: 'inline-block'
                  }}>
                    ▼
                  </span>
                </>
              }
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          />
          
          {/* Search Interface */}
          <Card
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Search by location, operation, or outcome..."
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "action.active" }} />,
                }}
              />
              
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="outlined" size="small" startIcon={<FilterListIcon />}>
                  Operations
                </Button>
                <Button variant="outlined" size="small" startIcon={<FilterListIcon />}>
                  Outcomes
                </Button>
                <Button variant="outlined" size="small" startIcon={<FilterListIcon />}>
                  Climate
                </Button>
              </Box>
            </Stack>
          </Card>
        </Box>

        {/* Center Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ScenarioCard
            topLine="MAP VISUALIZATION"
            headline="Data Layers & Controls"
            body="Toggle different data layers to visualize water infrastructure, land use patterns, and environmental flows across California."
            bottomLine="4 layers available"
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          />
          
          {/* Layer Controls */}
          <Card
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          >
            <Stack spacing={1}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2">Water Infrastructure</Typography>
                <IconButton size="small">
                  <LayersIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2">Agricultural Areas</Typography>
                <IconButton size="small">
                  <LayersIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2">Urban Areas</Typography>
                <IconButton size="small">
                  <LayersIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2">Environmental Flows</Typography>
                <IconButton size="small">
                  <LayersIcon />
                </IconButton>
              </Box>
            </Stack>
          </Card>
        </Box>

        {/* Right Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Example Scenario Cards */}
          <ScenarioCard
            topLine="CURRENT OPERATIONS"
            headline="Baseline Water Management"
            body="This scenario represents how California manages water today, serving as a reference point for current operations and policies."
            bottomLine="12 scenarios available"
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          />
          
          <ScenarioCard
            topLine="ENVIRONMENTAL FLOWS"
            headline="Enhanced River Flows"
            body="Scenarios that prioritize environmental water needs with increased river flows to support ecosystem health and native species."
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          />
          
          <ScenarioCard
            topLine="GROUNDWATER MANAGEMENT"
            headline="Sustainable Pumping"
            body="Water futures that implement SGMA requirements for sustainable groundwater management across the Central Valley."
            bottomLine="8 scenarios available"
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          />

          {/* Quick Actions at bottom right */}
          <Box sx={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
            <Card
              sx={{
                p: 1,
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
              }}
            >
              <IconButton onClick={handleCenterOnCalifornia} size="small" title="Center on California">
                <MyLocationIcon />
              </IconButton>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function MapPanel({ onOpenThemesDrawer }: MapPanelProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  return (
    <Box
      id="map-panel"
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Full Screen Map */}
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/digijill/cl122pj52001415qofin7bb1c"
        initialViewState={{
          longitude: -120.759, // Center on California
          latitude: 38.032, // Center on California
          zoom: 6.3, // Optimal zoom level
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Built-in Mapbox Controls */}
        <NavigationControl position="top-right" showCompass={true} showZoom={true} />
        <GeolocateControl
          position="top-right"
          trackUserLocation={true}
          showUserHeading={true}
        />
      </Map>

      {/* Overlay Controls */}
      <MapControls />
    </Box>
  )
}
