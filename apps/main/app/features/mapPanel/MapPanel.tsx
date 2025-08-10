"use client"

import React, { useState } from "react"
import { Box, IconButton, Tabs, Tab } from "@repo/ui/mui"
import { Card, ScenarioCard, ScenarioCardList } from "@repo/ui"
import { Map, useMap, NavigationControl, GeolocateControl } from "@repo/map"
import {
  PresetsPanel,
  OutcomesPanel,
  OperationsPanel,
} from "./cardContent/scenarioChoiceCard"
import MyLocationIcon from "@mui/icons-material/MyLocation"

interface MapPanelProps {
  onOpenThemesDrawer?: (operationId?: string) => void
}

const MapControls = () => {
  const { flyTo } = useMap()
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const handleCenterOnCalifornia = () => {
    flyTo({
      longitude: -120.759,
      latitude: 38.032,
      zoom: 6.3,
      transitionOptions: {
        duration: 2000, // Smooth 2-second transition
      },
    })
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleViewOnMap = (coordinates: {
    longitude: number
    latitude: number
    zoom: number
  }) => {
    flyTo({
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
      zoom: coordinates.zoom,
      transitionOptions: {
        duration: 1500, // Smooth 1.5-second transition for preset locations
      },
    })
  }

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.mapControls,
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
            topLine="CHOOSE SCENARIOS. starting with:"
            headline="Current Operations Scenario"
            body={
              <ScenarioCardList
                items={[
                  "helps us understand how California manages water today",
                  "serves as a foundation to compare alternative scenarios",
                ]}
              />
            }
            bottomLine={
              <Box
                onClick={toggleDropdown}
                sx={{
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: (theme) => theme.palette.action.hover,
                  },
                }}
              >
                Choose alternative scenarios to compare{" "}
                <span
                  style={{
                    fontSize: "0.875em",
                    lineHeight: 1,
                    verticalAlign: "baseline",
                    display: "inline-block",
                    transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  ▼
                </span>
              </Box>
            }
            dropdownContent={
              showDropdown ? (
                <Box>
                  {/* Tab Navigation with Label */}
                  <Box sx={{ display: "flex", alignItems: "baseline", mb: 2 }}>
                    <Box
                      component="span"
                      sx={{
                        mr: 2,
                        fontSize: "0.95rem",
                        fontWeight: 400,
                        color: (theme) => theme.palette.text.primary,
                        flexShrink: 0,
                      }}
                    >
                      Choose scenarios by:
                    </Box>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      sx={{ flex: 1 }}
                    >
                      <Tab label="Presets" />
                      <Tab label="Outcomes" />
                      <Tab label="Operations" />
                    </Tabs>
                  </Box>

                  {/* Tab Content */}
                  {activeTab === 0 && (
                    <PresetsPanel onViewOnMap={handleViewOnMap} />
                  )}
                  {activeTab === 1 && <OutcomesPanel />}
                  {activeTab === 2 && <OperationsPanel />}
                </Box>
              ) : undefined
            }
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          />
        </Box>

        {/* Center Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Search Interface */}
          {/* <Card
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
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "action.active" }} />
                  ),
                }}
              />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterListIcon />}
                >
                  Operations
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterListIcon />}
                >
                  Outcomes
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterListIcon />}
                >
                  Climate
                </Button>
              </Box>
            </Stack>
          </Card> */}

          {/* <ScenarioCard
            topLine="MAP VISUALIZATION"
            headline="Data Layers & Controls"
            body="Toggle different data layers to visualize water infrastructure, land use patterns, and environmental flows across California."
            bottomLine="4 layers available"
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          /> */}

          {/* Layer Controls */}
          {/* <Card
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          >
            <Stack spacing={1}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body2">Water Infrastructure</Typography>
                <IconButton size="small">
                  <LayersIcon />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body2">Agricultural Areas</Typography>
                <IconButton size="small">
                  <LayersIcon />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body2">Urban Areas</Typography>
                <IconButton size="small">
                  <LayersIcon />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body2">Environmental Flows</Typography>
                <IconButton size="small">
                  <LayersIcon />
                </IconButton>
              </Box>
            </Stack>
          </Card> */}
        </Box>

        {/* Right Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Example Scenario Cards */}
          {/* <ScenarioCard
            topLine="CURRENT OPERATIONS"
            headline="Baseline Water Management"
            body="This scenario represents how California manages water today, serving as a reference point for current operations and policies."
            bottomLine="12 scenarios available"
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          /> */}

          {/* <ScenarioCard
            topLine="ENVIRONMENTAL FLOWS"
            headline="Enhanced River Flows"
            body="Scenarios that prioritize environmental water needs with increased river flows to support ecosystem health and native species."
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          /> */}

          {/* <ScenarioCard
            topLine="GROUNDWATER MANAGEMENT"
            headline="Sustainable Pumping"
            body="Water futures that implement SGMA requirements for sustainable groundwater management across the Central Valley."
            bottomLine="8 scenarios available"
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          /> */}

          {/* Quick Actions at bottom right */}
          <Box
            sx={{
              marginTop: "auto",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Card
              sx={{
                p: 1,
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
              }}
            >
              <IconButton
                onClick={handleCenterOnCalifornia}
                size="small"
                title="Center on California"
              >
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
        mapStyle="mapbox://styles/digijill/cme5s9vy600r201rygw7q3agh"
        initialViewState={{
          longitude: -120.759,
          latitude: 38.032,
          zoom: 6.3,
        }}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
        touchZoom={true}
        touchRotate={false}
        onError={(evt: unknown) => {
          // Surface mapbox or ReactMapGL errors in the console (could be replaced with toast)
          console.error("🗺️ Map error:", evt)
        }}
      >
        {/* Built-in Mapbox Controls */}
        <NavigationControl
          position="top-right"
          showCompass={true}
          showZoom={true}
        />
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
