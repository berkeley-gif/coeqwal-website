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
                {/* Controls line */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "0.5fr minmax(200px, 3fr) minmax(80px, 1fr)",
                      lg: "0.5fr minmax(300px, 4fr) 1fr minmax(540px, 9fr)",
                    },
                    gap: theme.spacing(theme.cards.spacing.standard),
                    alignItems: "baseline",
                    mb: 2,
                  }}
                >
                  {/* Left side controls */}
                  <Box
                    sx={{
                      gridColumn: "1 / 4",
                      display: "flex",
                      alignItems: "baseline",
                      gap: theme.spacing(theme.cards.spacing.standard),
                    }}
                  >
                    <Typography variant="subtitle2">Strategy</Typography>
                    <Typography
                      variant="body2"
                      onClick={() => setMapView(!showMapView)}
                      sx={{
                        cursor: "pointer",
                        color: theme.palette.blue.bright,
                        textDecoration: "none",
                        fontSize: "0.8rem",
                        "&:hover": { color: theme.palette.blue.darkest },
                      }}
                    >
                      Back to list view
                    </Typography>
                    <Typography
                      variant="body2"
                      onClick={() => setShowOnlyChosen(!showOnlyChosen)}
                      sx={{
                        cursor: "pointer",
                        color: theme.palette.blue.bright,
                        textDecoration: "none",
                        fontSize: "0.8rem",
                        "&:hover": { color: theme.palette.blue.darkest },
                      }}
                    >
                      {showOnlyChosen
                        ? "Show all strategies"
                        : "Show only chosen strategies"}
                    </Typography>
                    <Typography
                      variant="body2"
                      onClick={() => setShowDefinitions(!showDefinitions)}
                      sx={{
                        cursor: "pointer",
                        color: theme.palette.blue.bright,
                        textDecoration: "none",
                        fontSize: "0.8rem",
                        "&:hover": { color: theme.palette.blue.darkest },
                      }}
                    >
                      {showDefinitions
                        ? "Hide definitions"
                        : "Show definitions"}
                    </Typography>
                  </Box>

                  {/* Right side instruction */}
                  <Box sx={{ gridColumn: "4 / -1" }}>
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                      Click on an outcome to view on the map
                    </Typography>
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
