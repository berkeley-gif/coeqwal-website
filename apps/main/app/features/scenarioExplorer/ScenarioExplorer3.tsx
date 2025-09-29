"use client"

import React, { useState, useCallback } from "react"
import {
  Box,
  Typography,
  Stack,
  useTheme,
  InfoIcon,
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
  Card,
  SectionHeader,
  RoundedRightArrow,
  InfoTooltip,
} from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import {
  Map,
  useMap,
  useMapSources,
  useMapLayers,
  NavigationControl,
  GeolocateControl,
} from "@repo/map"
import { strategies, hydroclimateOptions } from "../../lib/scenarios"
import {
  OUTCOMES,
  outcomeDefinitions,
  outcomeTierValues,
} from "../../lib/outcomes"
import { useWorkflowStore } from "@repo/state"
import { motion } from "@repo/motion"

// Outcome tooltip
const OutcomeTooltip = ({
  outcome,
  children,
}: {
  outcome: string
  children: React.ReactElement
}) => {
  const theme = useTheme()

  const tooltipContent = (
    <Box
      sx={{
        width: "450px",
        padding: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "normal",
        wordBreak: "break-word",
        hyphens: "auto",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          mb: 1,
          fontWeight: 500,
          width: "100%",
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {outcome}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mb: 2,
          lineHeight: 1.4,
          width: "100%",
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {outcomeDefinitions[outcome] || "Definition not available"}
      </Typography>
      {/* Legend */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5 }}>
          Outcome levels:
        </Typography>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              minHeight: 12,
              backgroundColor: theme.palette.tiers.tier1,
              borderRadius: "2px",
              flexShrink: 0,
              alignSelf: "stretch",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              lineHeight: 1.3,
              wordBreak: "break-word",
              whiteSpace: "normal",
              flex: 1,
              width: "100%",
            }}
          >
            {outcomeTierValues[outcome]?.tier1 || "Excellent"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              minHeight: 12,
              backgroundColor: theme.palette.tiers.tier2,
              borderRadius: "2px",
              flexShrink: 0,
              alignSelf: "stretch",
            }}
          />
          <Typography variant="caption" sx={{ lineHeight: 1.3 }}>
            {outcomeTierValues[outcome]?.tier2 || "Good"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              minHeight: 12,
              backgroundColor: theme.palette.tiers.tier3,
              borderRadius: "2px",
              flexShrink: 0,
              alignSelf: "stretch",
            }}
          />
          <Typography variant="caption" sx={{ lineHeight: 1.3 }}>
            {outcomeTierValues[outcome]?.tier3 || "Fair"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              minHeight: 12,
              backgroundColor: theme.palette.tiers.tier4,
              borderRadius: "2px",
              flexShrink: 0,
              alignSelf: "stretch",
            }}
          />
          <Typography variant="caption" sx={{ lineHeight: 1.3 }}>
            {outcomeTierValues[outcome]?.tier4 || "Poor"}
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <InfoTooltip
      description={tooltipContent}
      placement="top"
      tooltipProps={{
        enterDelay: 300,
        leaveDelay: 0,
        enterNextDelay: 100,
        PopperProps: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -40], // Hack: Move tooltip higher
              },
            },
          ],
        },
        slotProps: {
          tooltip: {
            sx: {
              maxWidth: "none !important",
              width: "auto",
              minWidth: "450px",
            },
          },
        },
      }}
    >
      {children}
    </InfoTooltip>
  )
}

// Triangle component for section headers (CSS hover)
const SectionTriangle = ({ isActive }: { isActive: boolean }) => {
  const theme = useTheme()

  return (
    <Box
      component="span"
      className="section-triangle"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: theme.spacing(1), // Small gap between triangle and text
        verticalAlign: "baseline",
        opacity: isActive ? 1 : 0,
        transform: isActive ? "scale(1)" : "scale(0.8)",
        transition: "all 0.2s ease-in-out",
      }}
    >
      <RoundedRightArrow
        color={theme.palette.blue.bright}
        style={{ width: "24px", height: "24px" }}
      />
    </Box>
  )
}

// Reusable Strategy Grid Component
const StrategyGrid = ({
  showMapView,
  showOnlyChosen,
  showDefinitions,
  chosenStrategies,
  toggleStrategyChoice,
  setMapView,
  selectedOutcomes,
  onOutcomeSelect,
}: {
  showMapView: boolean
  showOnlyChosen: boolean
  showDefinitions: boolean
  chosenStrategies: string[]
  toggleStrategyChoice: (value: string) => void
  setMapView: (show: boolean) => void
  setShowOnlyChosen: (show: boolean) => void
  setShowDefinitions: (show: boolean) => void
  selectedOutcomes: Record<string, string | null>
  onOutcomeSelect: (strategyValue: string, outcome: string) => void
}) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "0.5fr repeat(11, 1fr)",
        gap: showMapView
          ? theme.spacing(1)
          : theme.spacing(theme.cards.spacing.standard),
        alignItems: "start",
        ...(showMapView && {
          maxHeight: "40vh",
          overflow: "auto",
        }),
      }}
    >
      {/* Column Headers - only show in table view */}
      {!showMapView && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle2">Choose</Typography>
          </Box>
          <Box sx={{ gridColumn: "span 4" }}>
            <Typography variant="subtitle2">Strategy</Typography>
          </Box>
          <Box sx={{ gridColumn: "span 1" }}>
            <Typography variant="subtitle2">Key operations</Typography>
          </Box>
          <Box
            sx={{
              gridColumn: "span 6",
              display: "flex",
              alignItems: "baseline",
              gap: theme.spacing(theme.cards.spacing.standard),
            }}
          >
            <Typography variant="subtitle2">Key outcomes</Typography>
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
              {showMapView ? "Back to list view" : "Show outcomes on map"}
            </Typography>
          </Box>
        </>
      )}

      {/* Strategy rows */}
      {strategies
        .filter((strategy) =>
          showOnlyChosen ? chosenStrategies.includes(strategy.value) : true,
        )
        .map((strategy) => (
          <Box
            key={strategy.value}
            sx={{
              gridColumn: "1 / -1", // Span all columns
              display: "grid",
              gridTemplateColumns: "subgrid",
              backgroundColor: "#faf8f5",
              borderRadius: theme.borderRadius.rounded,
              padding: showMapView
                ? theme.spacing(1)
                : theme.spacing(theme.cards.spacing.standard),
              gap: showMapView
                ? theme.spacing(1)
                : theme.spacing(theme.cards.spacing.standard),
              alignItems: "start",
            }}
          >
            {/* Column 1: Star icon */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                pt: 1,
                cursor: "pointer",
              }}
              onClick={() => toggleStrategyChoice(strategy.value)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke={theme.palette.blue.bright}
                  strokeWidth="2"
                  fill={
                    chosenStrategies.includes(strategy.value)
                      ? theme.palette.blue.bright
                      : "none"
                  }
                />
              </svg>
            </Box>

            {/* Columns 2-5: Strategy name and description */}
            <Box sx={{ gridColumn: "span 4" }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 500,
                  mb: showDefinitions ? (showMapView ? 0.5 : 1) : 0,
                  fontSize: showMapView ? "0.9rem" : undefined,
                }}
              >
                {strategy.label}
              </Typography>
              {showDefinitions && (
                <Typography
                  variant="body2"
                  sx={{
                    lineHeight: showMapView ? 1.3 : 1.5,
                    fontSize: showMapView ? "0.8rem" : undefined,
                  }}
                >
                  {strategy.description
                    .split(/(\bTUCPs?\b)/g)
                    .map((part, index) => {
                      if (part.match(/\bTUCPs?\b/)) {
                        return (
                          <span key={index}>
                            {part}
                            <InfoTooltip
                              description="Temporary Urgent Change Petitions permit changes during droughts to meet human health and safety needs and protect endangered species"
                              placement="top"
                            >
                              <InfoIcon
                                sx={{
                                  fontSize: "0.8rem",
                                  ml: 0.5,
                                  cursor: "pointer",
                                  color: theme.palette.blue.bright,
                                  "&:hover": {
                                    color: theme.palette.blue.darkest,
                                  },
                                }}
                              />
                            </InfoTooltip>
                          </span>
                        )
                      }
                      return part
                    })}
                </Typography>
              )}
            </Box>

            {/* Column 6: Strategy icons */}
            <Box
              sx={{
                gridColumn: "span 1",
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              {strategy.value === "current-ops" && (
                <InfoTooltip description="Current operations" placement="top">
                  <Box
                    sx={{
                      width: showMapView ? "28px" : "40px",
                      height: showMapView ? "28px" : "40px",
                      cursor: "pointer",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/icons/current_ops.svg"
                      alt="Current operations"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Box>
                </InfoTooltip>
              )}
              {strategy.value === "current-ops-wo-tucp" && (
                <>
                  <InfoTooltip description="Current operations" placement="top">
                    <Box
                      sx={{
                        width: showMapView ? "28px" : "40px",
                        height: showMapView ? "28px" : "40px",
                        cursor: "pointer",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/icons/current_ops.svg"
                        alt="Current operations"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </Box>
                  </InfoTooltip>
                  <InfoTooltip description="Without TUCPs" placement="top">
                    <Box
                      sx={{
                        width: showMapView ? "28px" : "40px",
                        height: showMapView ? "28px" : "40px",
                        cursor: "pointer",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/icons/no_tucp.svg"
                        alt="Without TUCPs"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </Box>
                  </InfoTooltip>
                </>
              )}
            </Box>

            {/* Columns 7-12: Outcome charts */}
            <Box
              sx={{
                gridColumn: "span 6",
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: theme.spacing(theme.cards.spacing.standard),
              }}
            >
              {OUTCOMES.map((outcome) => (
                <OutcomeTooltip key={outcome} outcome={outcome}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: showMapView ? 0.5 : 1,
                      cursor: showMapView ? "pointer" : "default",
                      padding: 0.5,
                      borderRadius: theme.borderRadius.rounded,
                      transition: "all 0.2s ease",
                      backgroundColor: "transparent",
                      border:
                        selectedOutcomes[strategy.value] === outcome &&
                        showMapView
                          ? `2px solid ${theme.palette.blue.bright}`
                          : "2px solid transparent",
                      "&:hover": {
                        backgroundColor: showMapView
                          ? theme.palette.grey[100]
                          : "transparent",
                      },
                    }}
                    onClick={
                      showMapView
                        ? () => onOutcomeSelect(strategy.value, outcome)
                        : undefined
                    }
                  >
                    <ScenarioGlyph
                      variant="bars"
                      values={[
                        Math.random() * 0.4 - 0.2, // min
                        Math.random() * 0.3 - 0.1, // q1
                        Math.random() * 0.2, // median
                        Math.random() * 0.3 + 0.1, // q3
                      ]}
                      size={showMapView ? 35 : 50}
                      tierColors={[
                        theme.palette.tiers.tier1,
                        theme.palette.tiers.tier2,
                        theme.palette.tiers.tier3,
                        theme.palette.tiers.tier4,
                      ]}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.blue.darkest,
                        fontWeight: 500,
                        textAlign: "center",
                        fontSize: showMapView ? "0.6rem" : "0.7rem",
                        lineHeight: showMapView ? 1.1 : 1.2,
                      }}
                    >
                      {outcome}
                    </Typography>
                  </Box>
                </OutcomeTooltip>
              ))}
            </Box>
          </Box>
        ))}
    </Box>
  )
}

export default function ScenarioExplorer3() {
  const theme = useTheme()

  // Map functionality
  const { flyTo } = useMap()

  // Workflow and explore state
  const {
    currentStep,
    setStep,
    explore: { showMapView, showOnlyChosen, showDefinitions, chosenStrategies },
    setMapView,
    setShowOnlyChosen,
    setShowDefinitions,
    toggleStrategyChoice,
  } = useWorkflowStore()

  // Outcome visualization state - track by strategy
  const [selectedOutcomes, setSelectedOutcomes] = useState<
    Record<string, string | null>
  >({})

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Find any selected outcome from any strategy
  const anySelectedOutcome = Object.values(selectedOutcomes).find(
    (outcome) => outcome !== null,
  )

  // Declarative source management
  useMapSources(
    [
      {
        id: "delivery-units",
        type: "geojson",
        data: "/geospatial_data/du.geojson",
      },
    ],
    [showMapView],
  )

  // Declarative layer management based on selected outcomes
  useMapLayers(
    [
      // Community deliveries layers
      ...(anySelectedOutcome === "Community deliveries"
        ? [
            {
              id: "community-deliveries-layer",
              source: "delivery-units",
              type: "fill",
              paint: {
                "fill-color": [
                  "case",
                  [
                    "==",
                    ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4],
                    0,
                  ],
                  "#7b9d3f", // Tier 1 - Green
                  [
                    "==",
                    ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4],
                    1,
                  ],
                  "#60aacb", // Tier 2 - Blue
                  [
                    "==",
                    ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4],
                    2,
                  ],
                  "#FFB347", // Tier 3 - Orange
                  [
                    "==",
                    ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4],
                    3,
                  ],
                  "#CD5C5C", // Tier 4 - Red
                  "#60aacb", // Fallback blue for any edge cases
                ],
                "fill-opacity": 0.7,
                "fill-outline-color": theme.palette.blue.darkest, // Darker blue for outline
              },
              others: {
                filter: ["==", ["get", "Class"], "Urban"],
                beforeId: "settlement-subdivision-label", // Insert before place name labels
              },
            },
            {
              id: "community-deliveries-hover",
              source: "delivery-units",
              type: "line",
              paint: {
                "line-color": theme.palette.utility.white, // White stroke on hover
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  1, // At zoom 5: 1px width
                  8,
                  2, // At zoom 8: 2px width
                  12,
                  4, // At zoom 12: 4px width
                ],
                "line-opacity": 0, // Hidden by default, only visible on hover
              },
              others: {
                filter: ["==", ["get", "Class"], "Urban"],
                beforeId: "settlement-subdivision-label", // Insert before place name labels
              },
            },
          ]
        : []),
      // Agricultural deliveries layers
      ...(anySelectedOutcome === "Agricultural deliveries"
        ? [
            {
              id: "agricultural-deliveries-layer",
              source: "delivery-units",
              type: "fill",
              paint: {
                "fill-color": [
                  "case",
                  [
                    "==",
                    ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4],
                    0,
                  ],
                  "#7b9d3f", // Tier 1 - Green
                  [
                    "==",
                    ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4],
                    1,
                  ],
                  "#60aacb", // Tier 2 - Blue
                  [
                    "==",
                    ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4],
                    2,
                  ],
                  "#FFB347", // Tier 3 - Orange
                  [
                    "==",
                    ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4],
                    3,
                  ],
                  "#CD5C5C", // Tier 4 - Red
                  "#60aacb", // Fallback blue for any edge cases
                ],
                "fill-opacity": 0.7,
                "fill-outline-color": theme.palette.blue.darkest, // Darker blue for outline
              },
              others: {
                filter: ["==", ["get", "Class"], "Agriculture"],
                beforeId: "settlement-subdivision-label", // Insert before place name labels
              },
            },
            {
              id: "agricultural-deliveries-hover",
              source: "delivery-units",
              type: "line",
              paint: {
                "line-color": theme.palette.utility.white, // White stroke on hover
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  1, // At zoom 5: 1px width
                  8,
                  2, // At zoom 8: 2px width
                  12,
                  4, // At zoom 12: 4px width
                ],
                "line-opacity": 0, // Hidden by default, only visible on hover
              },
              others: {
                filter: ["==", ["get", "Class"], "Agriculture"],
                beforeId: "settlement-subdivision-label", // Insert before place name labels
              },
            },
          ]
        : []),
    // TODO: type this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any 
    ] as any,
    [selectedOutcomes, showMapView, theme],
  )

  // Handle outcome selection - only one outcome can be selected at a time
  const handleOutcomeSelect = useCallback(
    (strategyValue: string, outcome: string) => {
      setSelectedOutcomes((prev) => {
        // Check if this outcome is already selected for this strategy
        const isCurrentlySelected = prev[strategyValue] === outcome

        if (isCurrentlySelected) {
          // Deselect if clicking the same outcome
          return { [strategyValue]: null }
        } else {
          // Select this outcome and clear all others
          return { [strategyValue]: outcome }
        }
      })

      // Fly to appropriate extent if outcome is selected and we're in map view
      if (showMapView) {
        // Calculated extents for different outcome datasets (from geojson analysis)
        const OUTCOME_EXTENTS = {
          "Community deliveries": {
            center: {
              longitude: -121.13104439141343,
              latitude: 38.37016346726578,
              zoom: 6.2,
            },
          },
          "Agricultural deliveries": {
            center: {
              longitude: -121.22475633181261,
              latitude: 38.357876023358386,
              zoom: 6.0,
            },
          },
        }

        const extentData =
          OUTCOME_EXTENTS[outcome as keyof typeof OUTCOME_EXTENTS]
        if (extentData) {
          flyTo({
            longitude: extentData.center.longitude,
            latitude: extentData.center.latitude,
            zoom: extentData.center.zoom,
            transitionOptions: {
              duration: 1500,
            },
          })
        }
      }
    },
    [showMapView, flyTo],
  )

  // Handle location search using Mapbox Geocoding API
  const handleLocationSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return

      setIsSearching(true)
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US&bbox=-124.7844079,32.7153292,-114.1315252,42.2097232`,
        )
        const data = await response.json()

        if (data.features && data.features.length > 0) {
          const feature = data.features[0]
          const [longitude, latitude] = feature.center

          flyTo({
            longitude,
            latitude,
            zoom: 10,
            transitionOptions: {
              duration: 1500,
            },
          })
        }
      } catch (error) {
        console.error("Geocoding error:", error)
      } finally {
        setIsSearching(false)
      }
    },
    [flyTo],
  )

  // Handle search form submission
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleLocationSearch(searchQuery)
    },
    [searchQuery, handleLocationSearch],
  )

  return (
    <DashboardPanel
      backgroundColor={theme.palette.grey[100]}
      color={theme.palette.text.primary}
      headerHeight={theme.layout.headerHeight}
      includeHeaderSpacing={currentStep !== "choose"}
      sx={{
        pointerEvents: "auto",
      }}
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
          <motion.div
            animate={{
              height: "auto",
              overflow: "visible",
            }}
            transition={{
              type: "tween",
              duration: 0.6,
              ease: "easeInOut",
            }}
          >
            <Stack spacing={3} alignItems="stretch" sx={{ width: "100%" }}>
              {/* Card 1: Management strategies */}
              <motion.div
                animate={{
                  y: currentStep === "choose" ? 0 : 0,
                  scale: currentStep === "choose" ? 1 : 1,
                }}
                transition={{
                  type: "tween",
                  duration: 0.6,
                  ease: "easeInOut",
                }}
              >
                <Card
                  sx={{
                    width: "100%",
                    "&:hover .section-triangle": {
                      opacity: 1,
                      transform: "scale(1)",
                    },
                    ...(currentStep === "choose" && {
                      minHeight: "calc(100vh - 48px)", // Fill viewport minus panel padding
                      display: "flex",
                      flexDirection: "column",
                    }),
                  }}
                >
                  {/* Section header - hidden when in map view */}
                  {!showMapView && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        ...(currentStep !== "choose" && {
                          mt: theme.spacing(theme.cards.spacing.standard),
                          mb: theme.spacing(theme.cards.spacing.standard),
                        }),
                      }}
                    >
                      <SectionHeader
                        onClick={() =>
                          setStep(currentStep === "choose" ? "none" : "choose")
                        }
                        sx={{
                          letterSpacing: 0.5,
                          cursor: "pointer",
                        }}
                      >
                        <SectionTriangle isActive={currentStep === "choose"} />
                        1. Explore and choose water management strategies
                      </SectionHeader>

                      {/* Toggle controls */}
                      {currentStep === "choose" && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 3,
                            alignItems: "baseline",
                          }}
                        >
                          <Typography
                            variant="body2"
                            onClick={() => setShowOnlyChosen(!showOnlyChosen)}
                            sx={{
                              cursor: "pointer",
                              color: theme.palette.blue.bright,
                              textDecoration: "none",
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
                              "&:hover": { color: theme.palette.blue.darkest },
                            }}
                          >
                            {showDefinitions
                              ? "Hide definitions"
                              : "Show definitions"}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Show content when step is current */}
                  {currentStep === "choose" && (
                    <Box sx={{ flex: 1, overflow: "auto" }}>
                      {showMapView ? (
                        /* Map View - Full Card */
                        <Box
                          sx={{
                            position: "relative",
                            height: "calc(100vh - 48px)",
                            width: "100%",
                            flex: 1,
                          }}
                        >
                          <Map
                            mapboxToken={
                              process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
                            }
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
                          >
                            {/* Map Controls */}
                            <NavigationControl position="bottom-right" />
                            <GeolocateControl position="bottom-right" />
                          </Map>

                          {/* Search bar overlay - bottom right */}
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: theme.spacing(
                                theme.cards.spacing.standard,
                              ), // Position clear of navigation controls
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
                                padding: theme.spacing(
                                  theme.cards.spacing.standard / 2,
                                ),
                                backdropFilter: "blur(8px)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                                minWidth: "250px",
                              }}
                            >
                              <TextField
                                size="small"
                                placeholder={
                                  isSearching
                                    ? "Searching..."
                                    : "Search for a location"
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
                              right: theme.spacing(
                                theme.cards.spacing.standard,
                              ),
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              borderRadius: theme.borderRadius.rounded,
                              padding: theme.spacing(
                                theme.cards.spacing.standard,
                              ),
                              backdropFilter: "blur(8px)",
                              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                              zIndex: 1000,
                            }}
                          >
                            {/* Controls line, using grid to align */}
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: "0.5fr repeat(11, 1fr)",
                                gap: theme.spacing(
                                  theme.cards.spacing.standard,
                                ),
                                alignItems: "baseline",
                                mb: 2,
                              }}
                            >
                              {/* Left side controls */}
                              <Box
                                sx={{
                                  gridColumn: "1 / 7",
                                  display: "flex",
                                  alignItems: "baseline",
                                  gap: theme.spacing(
                                    theme.cards.spacing.standard,
                                  ),
                                }}
                              >
                                <Typography variant="subtitle2">
                                  Strategy
                                </Typography>
                                <Typography
                                  variant="body2"
                                  onClick={() => setMapView(!showMapView)}
                                  sx={{
                                    cursor: "pointer",
                                    color: theme.palette.blue.bright,
                                    textDecoration: "none",
                                    fontSize: "0.8rem",
                                    "&:hover": {
                                      color: theme.palette.blue.darkest,
                                    },
                                  }}
                                >
                                  {showMapView
                                    ? "Back to list view"
                                    : "Show outcomes on map"}
                                </Typography>

                                <Typography
                                  variant="body2"
                                  onClick={() =>
                                    setShowOnlyChosen(!showOnlyChosen)
                                  }
                                  sx={{
                                    cursor: "pointer",
                                    color: theme.palette.blue.bright,
                                    textDecoration: "none",
                                    fontSize: "0.8rem",
                                    "&:hover": {
                                      color: theme.palette.blue.darkest,
                                    },
                                  }}
                                >
                                  {showOnlyChosen
                                    ? "Show all strategies"
                                    : "Show only chosen strategies"}
                                </Typography>

                                <Typography
                                  variant="body2"
                                  onClick={() =>
                                    setShowDefinitions(!showDefinitions)
                                  }
                                  sx={{
                                    cursor: "pointer",
                                    color: theme.palette.blue.bright,
                                    textDecoration: "none",
                                    fontSize: "0.8rem",
                                    "&:hover": {
                                      color: theme.palette.blue.darkest,
                                    },
                                  }}
                                >
                                  {showDefinitions
                                    ? "Hide definitions"
                                    : "Show definitions"}
                                </Typography>
                              </Box>

                              {/* Right side, aligned with charts column */}
                              <Box sx={{ gridColumn: "7 / -1" }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontStyle: "italic",
                                  }}
                                >
                                  Click on an outcome to view on the map
                                </Typography>
                              </Box>
                            </Box>

                            {/* Strategy table for map overlay */}
                            <StrategyGrid
                              showMapView={showMapView}
                              showOnlyChosen={showOnlyChosen}
                              showDefinitions={showDefinitions}
                              chosenStrategies={chosenStrategies}
                              toggleStrategyChoice={toggleStrategyChoice}
                              setMapView={setMapView}
                              setShowOnlyChosen={setShowOnlyChosen}
                              setShowDefinitions={setShowDefinitions}
                              selectedOutcomes={selectedOutcomes}
                              onOutcomeSelect={handleOutcomeSelect}
                            />
                          </Box>

                          {/* Hydroclimate overlay at bottom left of map */}
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: theme.spacing(
                                theme.cards.spacing.standard,
                              ),
                              left: theme.spacing(theme.cards.spacing.standard),
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              borderRadius: theme.borderRadius.rounded,
                              padding: theme.spacing(
                                theme.cards.spacing.standard,
                              ),
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
                                            backgroundColor:
                                              theme.palette.blue.bright,
                                            borderColor:
                                              theme.palette.blue.bright,
                                          },
                                          "&.Mui-checked::after": {
                                            top: "50%",
                                            left: "50%",
                                            transform: "translate(-50%, -50%)",
                                          },
                                          "&:hover": {
                                            backgroundColor: `${theme.palette.blue.bright}`,
                                          },
                                          "&.Mui-disabled": {
                                            backgroundColor: "transparent",
                                            borderColor:
                                              theme.palette.grey[400],
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
                                          option.value === "historical"
                                            ? 500
                                            : 400,
                                        color:
                                          option.value === "historical"
                                            ? theme.palette.text.primary
                                            : `${theme.palette.grey[500]} !important`,
                                      },
                                      "&.Mui-disabled .MuiFormControlLabel-label":
                                        {
                                          color: `${theme.palette.grey[500]} !important`,
                                        },
                                    }}
                                  />
                                ))}
                              </RadioGroup>
                            </FormControl>
                          </Box>
                        </Box>
                      ) : (
                        /* Table View */
                        <StrategyGrid
                          showMapView={showMapView}
                          showOnlyChosen={showOnlyChosen}
                          showDefinitions={showDefinitions}
                          chosenStrategies={chosenStrategies}
                          toggleStrategyChoice={toggleStrategyChoice}
                          setMapView={setMapView}
                          setShowOnlyChosen={setShowOnlyChosen}
                          setShowDefinitions={setShowDefinitions}
                          selectedOutcomes={selectedOutcomes}
                          onOutcomeSelect={handleOutcomeSelect}
                        />
                      )}

                      {/* Hydroclimate section - only show in table view */}
                      {!showMapView && (
                        <Box
                          sx={{
                            mt: theme.spacing(theme.cards.spacing.standard * 2),
                            ml: theme.spacing(theme.cards.spacing.standard + 4), // Align with the top subtitle
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              letterSpacing: 0.5,
                              mb: theme.spacing(theme.cards.spacing.standard),
                              fontWeight: 400,
                            }}
                          >
                            See how outcomes change with a different
                            hydroclimate
                          </Typography>

                          <FormControl component="fieldset">
                            <RadioGroup
                              value="historical"
                              sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: theme.spacing(
                                  theme.cards.spacing.standard + 1,
                                ),
                                flexWrap: "wrap",
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
                                          backgroundColor:
                                            theme.palette.blue.bright,
                                          borderColor:
                                            theme.palette.blue.bright,
                                        },
                                        "&.Mui-checked::after": {
                                          top: "50%",
                                          left: "50%",
                                          transform: "translate(-50%, -50%)",
                                        },
                                        "&:hover": {
                                          backgroundColor: `${theme.palette.blue.bright}`,
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
                                      fontSize: "0.95rem",
                                      fontWeight:
                                        option.value === "historical"
                                          ? 500
                                          : 400,
                                      color:
                                        option.value === "historical"
                                          ? theme.palette.text.primary
                                          : `${theme.palette.grey[500]} !important`,
                                    },
                                    "&.Mui-disabled .MuiFormControlLabel-label":
                                      {
                                        color: `${theme.palette.grey[500]} !important`,
                                      },
                                  }}
                                />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      )}
                    </Box>
                  )}
                </Card>
              </motion.div>

              {/* Cards 2 & 3 */}
              <motion.div
                animate={{
                  y: 0, // Keep in normal flow
                }}
                transition={{
                  type: "tween",
                  duration: 0.6,
                  ease: "easeInOut",
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {/* Card 2 Choose and compare management strategies */}
                <Card
                  sx={{
                    width: "100%",
                    "&:hover .section-triangle": {
                      opacity: 1,
                      transform: "scale(1)",
                    },
                  }}
                >
                  <SectionHeader
                    onClick={() =>
                      setStep(currentStep === "compare" ? "none" : "compare")
                    }
                    sx={{
                      letterSpacing: 0.5,
                      display: "block", // Override inline-block to allow full width
                      width: "100%",
                      cursor: "pointer",
                      ...(currentStep !== "compare" && {
                        mt: theme.spacing(theme.cards.spacing.standard),
                        mb: theme.spacing(theme.cards.spacing.standard),
                      }),
                    }}
                  >
                    <SectionTriangle isActive={currentStep === "compare"} />
                    2. Compare results and save notes
                  </SectionHeader>

                  {/* Show content only when this step is current */}
                  {currentStep === "compare" && (
                    <Box sx={{ flex: 1, p: 3 }}>
                      <Typography variant="body1">
                        Compare functionality coming soon...
                      </Typography>
                    </Box>
                  )}
                </Card>

                {/* Card 3 proceed to empower */}
                <Box
                  sx={{
                    display: "inline-block",
                    backgroundColor: theme.palette.common.white,
                    borderRadius: theme.borderRadius.rounded,
                    padding: theme.spacing(theme.cards.spacing.standard),
                    cursor: "pointer",
                    "&:hover .section-triangle": {
                      opacity: 1,
                      transform: "scale(1)",
                    },
                  }}
                  onClick={() =>
                    setStep(currentStep === "empower" ? "none" : "empower")
                  }
                >
                  <SectionHeader
                    sx={{
                      letterSpacing: 0.5,
                      mt: theme.spacing(theme.cards.spacing.standard),
                      mb: theme.spacing(theme.cards.spacing.standard),
                    }}
                  >
                    <SectionTriangle isActive={currentStep === "empower"} />
                    3. Go to Empower: create narrative from notes ⟶
                  </SectionHeader>
                </Box>

                {/* Hydroclimate card temporarily hidden */}
              </motion.div>
            </Stack>
          </motion.div>
        </DashboardCardContainer>
      </DashboardGrid>
    </DashboardPanel>
  )
}
