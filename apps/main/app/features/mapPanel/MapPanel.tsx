"use client"

import React, { useState } from "react"
import { Box, IconButton, Tabs, Tab, Checkbox, FormControlLabel } from "@repo/ui/mui"
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

interface MapControlsProps {
  isDrawingCustomRegion: boolean
  polygonPoints: Array<{lng: number, lat: number}>
  onSelectRegionOnMap: () => void
  onClearCustomRegion: () => void
}

const MapControls = ({ 
  isDrawingCustomRegion, 
  polygonPoints, 
  onSelectRegionOnMap, 
  onClearCustomRegion 
}: MapControlsProps) => {
  const { flyTo } = useMap()
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [isChartExpanded, setIsChartExpanded] = useState(false)
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)

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

  const handleChartExpand = (expanded: boolean) => {
    setIsChartExpanded(expanded)
  }

  const toggleRegionDropdown = () => {
    setShowRegionDropdown(!showRegionDropdown)
  }

  const handleSelectRegionOnMapClick = () => {
    onSelectRegionOnMap()
    setShowRegionDropdown(false) // Close dropdown when starting to draw
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
          {/* When chart is expanded, show the card header + expanded chart */}
          {isChartExpanded ? (
            <Box
              sx={{
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "16px",
                border: "1px solid",
                borderColor: (theme) => theme.palette.divider,
                padding: 3,
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 200px)",
                maxHeight: "600px",
                minHeight: "400px",
              }}
            >
              {/* Keep the header section visible */}
              <Box sx={{ mb: 2, flexShrink: 0 }}>
                <Box
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: (theme) => theme.palette.text.secondary,
                    mb: 1,
                  }}
                >
                  CHOOSE SCENARIOS. starting with:
                </Box>
                <Box
                  sx={{
                    fontSize: "1.5rem",
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: (theme) => theme.palette.text.primary,
                    mb: 2,
                  }}
                >
                  Current Operations Scenario
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box component="ul" sx={{ margin: 0, paddingLeft: "20px" }}>
                    <Box component="li" sx={{ fontSize: "0.95rem", fontWeight: 400, lineHeight: 1.4, marginBottom: "4px", color: "inherit" }}>
                      helps us understand how California manages water today
                    </Box>
                    <Box component="li" sx={{ fontSize: "0.95rem", fontWeight: 400, lineHeight: 1.4, marginBottom: "4px", color: "inherit" }}>
                      serves as a foundation to compare alternative scenarios
                    </Box>
                  </Box>
                </Box>
                
                {/* HR separator */}
                <Box
                  sx={{
                    borderBottom: "1px solid",
                    borderColor: (theme) => theme.palette.divider,
                    mb: 0,
                  }}
                />
              </Box>
              
              {/* Expanded chart content */}
              <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", mt: 0, pt: 0 }}>
                <OutcomesPanel onExpandChart={handleChartExpand} />
              </Box>
            </Box>
          ) : (
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
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      height: "calc(100vh - 200px)",
                      maxHeight: "600px",
                      minHeight: "400px", // Minimum height for usability
                    }}
                  >
                    {/* Normal view: Tab navigation and content */}
                    <Box sx={{ display: "flex", alignItems: "baseline", mb: 2, flexShrink: 0 }}>
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

                                      {/* Tab Content - Responsive height allocation */}
                  {activeTab === 0 && (
                    <Box sx={{ flexShrink: 0 }}>
                      <PresetsPanel onViewOnMap={handleViewOnMap} />
                    </Box>
                  )}
                  {activeTab === 1 && (
                    <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                      <OutcomesPanel onExpandChart={handleChartExpand} />
                    </Box>
                  )}
                  {activeTab === 2 && (
                    <Box sx={{ flexShrink: 0 }}>
                      <OperationsPanel />
                    </Box>
                  )}
                  </Box>
                ) : undefined
              }
              sx={{
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
              }}
            />
          )}
        </Box>

        {/* Center Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Region Selection Card */}
          <ScenarioCard
            topLine="CHOOSE A REGION. starting with:"
            headline="Central Valley"
            body={null} // No list for this card
            bottomLine={
              <Box
                onClick={toggleRegionDropdown}
                sx={{
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: (theme) => theme.palette.action.hover,
                  },
                }}
              >
                Choose a different region{" "}
                <span
                  style={{
                    fontSize: "0.875em",
                    lineHeight: 1,
                    verticalAlign: "baseline",
                    display: "inline-block",
                    transform: showRegionDropdown ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  ▼
                </span>
              </Box>
            }
            dropdownContent={
              showRegionDropdown ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                    p: 2,
                  }}
                >
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label="Sacramento Valley"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label="San Joaquin Valley"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label="Delta"
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label="Tulare Basin"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        size="small" 
                        checked={isDrawingCustomRegion || polygonPoints.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectRegionOnMapClick()
                          } else {
                            onClearCustomRegion()
                          }
                        }}
                      />
                    }
                    label="Select region on map"
                    sx={{ gridColumn: "1 / -1" }} // Span full width
                  />
                </Box>
              ) : undefined
            }
            sx={{
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          />

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
  
  // Polygon drawing state, lifted to main component
  const [isDrawingCustomRegion, setIsDrawingCustomRegion] = useState(false)
  const [polygonPoints, setPolygonPoints] = useState<Array<{lng: number, lat: number}>>([])

  const handleSelectRegionOnMap = () => {
    setIsDrawingCustomRegion(true)
    setPolygonPoints([])
  }

  const handlePolygonComplete = () => {
    if (polygonPoints.length >= 3) {
      setIsDrawingCustomRegion(false)
      console.log('Custom region polygon completed:', polygonPoints)
    }
  }

  const handleClearCustomRegion = () => {
    setIsDrawingCustomRegion(false)
    setPolygonPoints([])
  }

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
        mapStyle="mapbox://styles/mapbox/streets-v12"
        initialViewState={{
          longitude: -120.759,
          latitude: 38.032,
          zoom: 6.3,
        }}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
        touchZoom={true}
        touchRotate={false}
        cursor={isDrawingCustomRegion ? "crosshair" : "default"}
        onClick={isDrawingCustomRegion ? (evt: {lngLat: {lng: number, lat: number}}) => {
          const { lng, lat } = evt.lngLat
          const newPoint = { lng, lat }
          setPolygonPoints((prev: Array<{lng: number, lat: number}>) => [...prev, newPoint])
        } : undefined}
        onDblClick={isDrawingCustomRegion ? (evt: {preventDefault: () => void}) => {
          evt.preventDefault()
          handlePolygonComplete()
        } : undefined}
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

      {/* Polygon Drawing Instructions */}
      {isDrawingCustomRegion && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: 2,
            borderRadius: 1,
            zIndex: (theme) => theme.zIndex.tooltip,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <Box sx={{ fontSize: "0.9rem", fontWeight: 500, mb: 0.5 }}>
            Draw Custom Region
          </Box>
          <Box sx={{ fontSize: "0.8rem", opacity: 0.9 }}>
            Click to add points • Double-click to finish
            {polygonPoints.length > 0 && ` • ${polygonPoints.length} points`}
          </Box>
        </Box>
      )}

      {/* Overlay Controls */}
      <MapControls 
        isDrawingCustomRegion={isDrawingCustomRegion}
        polygonPoints={polygonPoints}
        onSelectRegionOnMap={handleSelectRegionOnMap}
        onClearCustomRegion={handleClearCustomRegion}
      />
    </Box>
  )
}
