"use client"

import React, { useState } from "react"
import { Box, Typography, useTheme, TextField, Tabs, Tab } from "@repo/ui/mui"
import {
  DashboardPanel,
  DashboardGrid,
  DashboardCardContainer,
  SectionHeader,
  InfoTooltip,
  DocumentListIcon,
  DocumentCheckedIcon,
  DocumentExpandedIcon,
  DocumentCollapsedIcon,
  MapIcon as MapViewIcon,
} from "@repo/ui"
import { Map, NavigationControl, GeolocateControl } from "@repo/map"
import { motion } from "@repo/motion"

// Custom hooks
import { useScenarioData } from "./hooks/useScenarioData"
import { useExploreInteractions } from "./hooks/useExploreInteractions"
import { useMapIntegration } from "./hooks/useMapIntegration"

// Components
import StrategyGrid from "./components/StrategyGrid"
import HydroclimateCard from "./components/HydroclimateCard"
import TogglePair from "./components/TogglePair"
import TierMarkers from "./components/TierMarkers"
import TierTooltipContent from "./components/TierTooltipContent"

// Hooks
import { useTierMapData } from "./hooks/useTierMapData"

/**
 * ScenarioExplorer
 *
 * Allows users to explore water management strategies and their tiered outcomes
 * with both table and map views. Uses custom hooks for clean separation
 * of data management, UI state, and map integration.
 */
export default function ScenarioExplorer() {
  const theme = useTheme()

  // Local state for resizable map overlay
  const [overlayHeight, setOverlayHeight] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartHeight, setDragStartHeight] = useState(0)

  // State for selected tier visualization on map
  const [selectedTier, setSelectedTier] = useState<{
    strategy: string
    outcome: string
  } | null>(null)
  const [overlayTab, setOverlayTab] = useState<"hydroclimate" | "tier">(
    "hydroclimate",
  )

  // Data management
  const { getChartDataForStrategy, outcomeNames, isLoading, error } =
    useScenarioData()

  // UI state and interaction management
  const {
    showMapView,
    setMapView,
    showOnlyChosen,
    setShowOnlyChosen,
    showDefinitions,
    setShowDefinitions,
    searchQuery,
    setSearchQuery,
    isSearching,
    anySelectedOutcome,
    handleOutcomeSelect,
    handleSearchSubmit,
  } = useExploreInteractions()

  // Map integration
  useMapIntegration(showMapView, anySelectedOutcome || null)

  // Tier map data and visualization
  const { tierData, clearTierData } = useTierMapData({
    selectedTier,
  })

  // Handle tier chart click in map view
  const handleTierClick = (strategy: string, outcome: string) => {
    setSelectedTier({ strategy, outcome })
    setOverlayTab("tier") // Switch to tier tab
  }

  // Handle drag to resize overlay
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragStartY(e.clientY)
    setDragStartHeight(overlayHeight)
    setIsDragging(true)
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()

      // Calculate new height based on drag distance
      const dragDistance = e.clientY - dragStartY
      const newHeight = dragStartHeight + dragDistance

      // Constrain between min and max
      setOverlayHeight(
        Math.max(150, Math.min(newHeight, window.innerHeight * 0.8)),
      )
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      // Set cursor on body to override everything during drag
      document.body.style.cursor = "ns-resize !important"
      document.body.style.userSelect = "none"

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragStartY, dragStartHeight])

  // Handle loading and error states
  if (isLoading) {
    return (
      <DashboardPanel
        backgroundColor={theme.palette.grey[100]}
        color={theme.palette.text.primary}
        headerHeight={theme.layout.headerHeight}
        sx={{ pointerEvents: "auto" }}
      >
        <Box sx={{ padding: theme.spacing(3) }}>
          <Typography>Loading scenario data...</Typography>
        </Box>
      </DashboardPanel>
    )
  }

  if (error) {
    return (
      <DashboardPanel
        backgroundColor={theme.palette.grey[100]}
        color={theme.palette.text.primary}
        headerHeight={theme.layout.headerHeight}
        sx={{ pointerEvents: "auto" }}
      >
        <Box sx={{ padding: theme.spacing(3) }}>
          <Typography color="error">Error loading data: {error}</Typography>
        </Box>
      </DashboardPanel>
    )
  }

  return (
    <DashboardPanel
      backgroundColor={theme.palette.grey[100]}
      color={theme.palette.text.primary}
      headerHeight={theme.layout.headerHeight}
      includeHeaderSpacing={true}
      sx={{ pointerEvents: "auto" }}
    >
      <DashboardGrid spacing={theme.cards.spacing.standard}>
        {/* Left section: controls and configuration cards */}
        <DashboardCardContainer
          width={{
            xs: "100%",
            sm: "100%",
            md: "100%",
            lg: "100%",
            xl: "100%",
          }}
        >
          {/* Section header */}
          <SectionHeader variant="h5">
            Choose water management strategies to explore
          </SectionHeader>

          <Typography
            variant="body2"
            sx={{
              ml: 0.25,
              mb: theme.spacing(2),
            }}
          >
            Use these descriptions to choose water management strategies to
            explore in more depth.
          </Typography>

          {/* Strategy Explorer */}
          {!showMapView && (
            <motion.div
              animate={{ height: "auto", overflow: "visible" }}
              transition={{ type: "tween", duration: 0.6, ease: "easeInOut" }}
            >
              <StrategyGrid
                getChartDataForStrategy={getChartDataForStrategy}
                outcomeNames={outcomeNames || []}
                onOutcomeSelect={handleOutcomeSelect}
              />

              {/* Hydroclimate card */}
              <Box sx={{ mt: theme.spacing(3) }}>
                <HydroclimateCard />
              </Box>
            </motion.div>
          )}
        </DashboardCardContainer>

        {/* Map view */}
        {showMapView && (
          <DashboardCardContainer
            width={{
              xs: "100%",
              sm: "100%",
              md: "100%",
              lg: "100%",
              xl: "100%",
            }}
          >
            <Box
              sx={{
                position: "relative",
                height: "calc(100vh - 48px)",
                width: "100%",
                borderRadius: theme.borderRadius.rounded,
                overflow: "hidden",
              }}
            >
              <Map
                mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
                mapStyle="mapbox://styles/mapbox/light-v11"
                initialViewState={{
                  longitude: -121.4,
                  latitude: 38.5,
                  zoom: 6,
                }}
                scrollZoom={false}
                touchZoom={false}
                doubleClickZoom={false}
                dragPan={true}
                dragRotate={false}
                touchRotate={false}
                keyboard={false}
                style={{ width: "100%", height: "100%" }}
              >
                <NavigationControl position="bottom-right" />
                <GeolocateControl position="bottom-right" />

                {/* Tier location markers */}
                {tierData &&
                  tierData.features &&
                  tierData.features.length > 0 && (
                    <TierMarkers data={tierData} />
                  )}
              </Map>

              {/* Search bar overlay - bottom right */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: theme.spacing(theme.cards.spacing.standard),
                  right: theme.spacing(8),
                  zIndex: 1001,
                }}
              >
                <Box
                  component="form"
                  onSubmit={handleSearchSubmit}
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: theme.borderRadius.rounded,
                    padding: theme.spacing(theme.cards.spacing.standard / 2),
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                    minWidth: "250px",
                  }}
                >
                  <TextField
                    size="small"
                    placeholder={
                      isSearching ? "Searching..." : "Search for a location"
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSearching}
                    fullWidth
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "white",
                        borderRadius: theme.borderRadius.rounded,
                        fontSize: "0.9rem",
                      },
                      "& .MuiOutlinedInput-input": {
                        padding: theme.spacing(
                          theme.cards.spacing.standard / 2,
                        ),
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Strategy overlay at top of map */}
              <Box
                sx={{
                  position: "absolute",
                  top: theme.spacing(theme.cards.spacing.standard),
                  left: theme.spacing(theme.cards.spacing.standard),
                  right: theme.spacing(theme.cards.spacing.standard),
                  height: `${overlayHeight}px`,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: theme.borderRadius.rounded,
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Header and content wrapper with original padding */}
                <Box
                  sx={{
                    padding: theme.spacing(theme.cards.spacing.standard),
                    flex: 1,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Header row */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "32px minmax(0, 0.8fr) auto minmax(0, 2fr)",
                      gap: theme.spacing(1),
                      columnGap: theme.spacing(2),
                      alignItems: "center",
                      height: "48px",
                      mb: 1,
                      flexShrink: 0,
                    }}
                  >
                    {/* Empty first column (replaces Choose in table view) */}
                    <Box />

                    {/* Strategy column with toggles */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        ml: -0.5,
                      }}
                    >
                      <Typography variant="subtitle2">
                        Choose strategies
                      </Typography>

                      <InfoTooltip description="Show all strategies or only chosen ones">
                        <Box sx={{ ml: 10 }}>
                          <TogglePair
                            leftIcon={
                              <DocumentListIcon
                                active={!showOnlyChosen}
                                size={35}
                              />
                            }
                            rightIcon={
                              <DocumentCheckedIcon
                                active={showOnlyChosen}
                                size={35}
                              />
                            }
                            onLeftClick={() => setShowOnlyChosen(false)}
                            onRightClick={() => setShowOnlyChosen(true)}
                            gap={-0.5}
                          />
                        </Box>
                      </InfoTooltip>

                      <InfoTooltip description="Show or hide strategy details">
                        <Box>
                          <TogglePair
                          leftIcon={
                            <DocumentExpandedIcon
                              active={showDefinitions}
                              size={35}
                            />
                          }
                          rightIcon={
                            <DocumentCollapsedIcon
                              active={!showDefinitions}
                              size={35}
                            />
                          }
                          onLeftClick={() => setShowDefinitions(true)}
                          onRightClick={() => setShowDefinitions(false)}
                          gap={-0.5}
                          sx={{ ml: -1.5 }}
                        />
                        </Box>
                      </InfoTooltip>
                    </Box>

                    {/* Key operations column */}
                    <Box>
                      <Typography variant="subtitle2">
                        Key operations
                      </Typography>
                    </Box>

                    {/* Key outcomes column with view toggle */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        pl: 3,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="subtitle2">Key outcomes</Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.blue.bright,
                          }}
                        >
                          Click on a chart to see it on the map
                        </Typography>
                      </Box>

                      <InfoTooltip description="Switch between list and map view">
                        <Box>
                          <TogglePair
                            leftIcon={
                              <DocumentListIcon active={!showMapView} size={46} />
                            }
                            rightIcon={
                              <MapViewIcon active={showMapView} size={46} />
                            }
                            onLeftClick={() => setMapView(false)}
                            onRightClick={() => setMapView(true)}
                            gap={0.4}
                          />
                        </Box>
                      </InfoTooltip>
                    </Box>
                  </Box>

                  {/* Strategy table - scrollable */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      overflowX: "hidden",
                      minHeight: 0,
                    }}
                  >
                    <StrategyGrid
                      getChartDataForStrategy={getChartDataForStrategy}
                      outcomeNames={outcomeNames || []}
                      onOutcomeSelect={handleOutcomeSelect}
                      onTierClick={handleTierClick}
                    />
                  </Box>
                </Box>

                {/* Drag handle at bottom */}
                <Box
                  onMouseDown={handleMouseDown}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 1.5,
                    cursor: "ns-resize",
                    borderTop: `1px solid ${theme.palette.grey[300]}`,
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor: theme.palette.grey[100],
                    },
                    userSelect: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: "40px",
                      height: "4px",
                      borderRadius: "2px",
                      backgroundColor: theme.palette.grey[400],
                      transition: "background-color 0.2s ease",
                    }}
                  />
                </Box>
              </Box>

              {/* Tabbed overlay at bottom left: Hydroclimate / Tier Legend */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: theme.spacing(theme.cards.spacing.standard),
                  left: theme.spacing(theme.cards.spacing.standard),
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: theme.borderRadius.rounded,
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                  zIndex: 1000,
                  width: "380px",
                  height: "auto",
                  maxHeight: "50vh",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Tabs */}
                <Tabs
                  value={overlayTab}
                  onChange={(_, newValue) => setOverlayTab(newValue)}
                  sx={{
                    minHeight: "40px",
                    borderBottom: `1px solid ${theme.palette.grey[300]}`,
                    "& .MuiTab-root": {
                      minHeight: "40px",
                      fontSize: "0.875rem",
                      textTransform: "none",
                      color: theme.palette.text.primary,
                      "&.Mui-selected": {
                        color: theme.palette.blue.darkest,
                      },
                      "&:hover": {
                        color: theme.palette.blue.bright,
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    },
                  }}
                >
                  <Tab label="Hydroclimate" value="hydroclimate" />
                  <Tab
                    label="Outcome legend"
                    value="tier"
                    disabled={!selectedTier}
                  />
                </Tabs>

                {/* Tab content */}
                <Box
                  sx={{
                    padding: theme.spacing(theme.cards.spacing.standard),
                    overflowY: "auto",
                    height: "280px", // Fixed height so tabs don't jump
                  }}
                >
                  {overlayTab === "hydroclimate" && (
                    <HydroclimateCard
                      layout="vertical"
                      variant="compact"
                      showCard={false}
                    />
                  )}

                  {overlayTab === "tier" && selectedTier && (
                    <TierTooltipContent
                      outcome={selectedTier.outcome}
                      showTitle={true}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </DashboardCardContainer>
        )}
      </DashboardGrid>
    </DashboardPanel>
  )
}
