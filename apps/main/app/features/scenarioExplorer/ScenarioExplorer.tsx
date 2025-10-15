"use client"

import React from "react"
import {
  Box,
  Typography,
  useTheme,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
} from "@repo/ui/mui"
import {
  DashboardPanel,
  DashboardGrid,
  DashboardCardContainer,
  SectionHeader,
  DocumentListIcon,
  DocumentCheckedIcon,
  DocumentExpandedIcon,
  DocumentCollapsedIcon,
  MapIcon as MapViewIcon,
} from "@repo/ui"
import { Map, NavigationControl, GeolocateControl } from "@repo/map"
import { motion } from "@repo/motion"
import { hydroclimateOptions } from "../../lib/scenarios"

// Custom hooks
import { useScenarioData } from "./hooks/useScenarioData"
import { useExploreInteractions } from "./hooks/useExploreInteractions"
import { useMapIntegration } from "./hooks/useMapIntegration"

// Components
import StrategyGrid from "./components/StrategyGrid"
import HydroclimateCard from "./components/HydroclimateCard"
import TogglePair from "./components/TogglePair"

/**
 * ScenarioExplorer
 *
 * Allows users to explore water management strategies and their tiered outcomes
 * with both table and map views. Uses custom hooks for clean separation
 * of data management, UI state, and map integration.
 */
export default function ScenarioExplorer() {
  const theme = useTheme()

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
              ml: 0.5,
              mb: theme.spacing(4),
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
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: theme.borderRadius.rounded,
                  padding: theme.spacing(theme.cards.spacing.standard),
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                  zIndex: 1000,
                }}
              >
                {/* Header row */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "auto minmax(0, 1fr) auto minmax(0, 1.5fr)",
                    gap: theme.spacing(1),
                    alignItems: "center",
                    height: "48px",
                    mb: 1,
                  }}
                >
                  {/* Empty first column (replaces Choose in table view) */}
                  <Box />

                  {/* Strategy column with toggles */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="subtitle2">Strategy</Typography>

                    <TogglePair
                      leftIcon={
                        <DocumentListIcon active={!showOnlyChosen} size={35} />
                      }
                      rightIcon={
                        <DocumentCheckedIcon
                          active={showOnlyChosen}
                          size={35}
                        />
                      }
                      onLeftClick={() => setShowOnlyChosen(false)}
                      onRightClick={() => setShowOnlyChosen(true)}
                    />

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
                    />
                  </Box>

                  {/* Key operations column */}
                  <Box>
                    <Typography variant="subtitle2">Key operations</Typography>
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
                    <Typography variant="subtitle2">Key outcomes</Typography>

                    <TogglePair
                      leftIcon={
                        <DocumentListIcon active={!showMapView} size={46} />
                      }
                      rightIcon={<MapViewIcon active={showMapView} size={46} />}
                      onLeftClick={() => setMapView(false)}
                      onRightClick={() => setMapView(true)}
                      gap={0.4}
                    />
                  </Box>
                </Box>

                {/* Strategy table for map overlay */}
                <StrategyGrid
                  getChartDataForStrategy={getChartDataForStrategy}
                  outcomeNames={outcomeNames || []}
                  onOutcomeSelect={handleOutcomeSelect}
                />
              </Box>

              {/* Hydroclimate overlay at bottom left of map */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: theme.spacing(theme.cards.spacing.standard),
                  left: theme.spacing(theme.cards.spacing.standard),
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: theme.borderRadius.rounded,
                  padding: theme.spacing(theme.cards.spacing.standard),
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                  zIndex: 1000,
                  minWidth: "300px",
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Hydroclimate
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value="historical"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: theme.spacing(1),
                    }}
                  >
                    {hydroclimateOptions.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        disabled={option.value !== "historical"}
                        control={
                          <Radio
                            disabled={option.value !== "historical"}
                            sx={{
                              "&.Mui-checked": {
                                backgroundColor: theme.palette.blue.bright,
                                borderColor: theme.palette.blue.bright,
                              },
                              "&:hover": {
                                backgroundColor: theme.palette.blue.bright,
                              },
                              "&.Mui-disabled": {
                                backgroundColor: "transparent",
                                borderColor: theme.palette.grey[400],
                                cursor: "not-allowed",
                              },
                            }}
                          />
                        }
                        label={option.label}
                        sx={{
                          "& .MuiFormControlLabel-label": {
                            fontSize: "0.8rem",
                            fontWeight:
                              option.value === "historical" ? 500 : 400,
                            color:
                              option.value === "historical"
                                ? theme.palette.text.primary
                                : `${theme.palette.grey[500]} !important`,
                          },
                          "&.Mui-disabled .MuiFormControlLabel-label": {
                            color: `${theme.palette.grey[500]} !important`,
                          },
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Box>
            </Box>
          </DashboardCardContainer>
        )}
      </DashboardGrid>
    </DashboardPanel>
  )
}
