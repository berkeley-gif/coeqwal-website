"use client"
import React, { useState, useEffect, useCallback } from "react"
import {
  Box,
  IconButton,
  Checkbox,
  FormControlLabel,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  useTheme,
} from "@repo/ui/mui"
import {
  Card,
  ScenarioCard,
  MapMarkerTooltip,
  ActionCardButton,
  DiscreteSlider,
  InfoIconButton,
  CardAccordion,
} from "@repo/ui"
import type { CardAccordionSection } from "@repo/ui"
// import { BarChart } from "@repo/viz"
import { useChartData } from "../../hooks/useChartData"
import { OUTCOMES } from "../../lib/outcomes"
import { useDrawerStore } from "@repo/state"
import {
  Map,
  useMap,
  NavigationControl,
  GeolocateControl,
  Marker,
  Source,
  Layer,
  Popup,
} from "@repo/map"
// import {
//   PresetsPanel,
//   OutcomesPanel,
//   OperationsPanel,
// } from "./cardContent/scenarioChoiceCard"
import MyLocationIcon from "@mui/icons-material/MyLocation"
import { MapPromptDialog } from "@repo/ui"

import { useGlyphSettingsStore } from "@repo/ui"
import { ScenarioGlyph, VerticalParallelLinePlot } from "@repo/viz"

interface MapPanelProps {
  onOpenThemesDrawer?: (operationId?: string) => void
}

interface MapControlsProps {
  // Region selection props
  isDrawingCustomRegion: boolean
  polygonPoints: Array<{ lng: number; lat: number }>
  draggedPointIndex: number | null
  onSelectRegionOnMap: () => void
  onClearCustomRegion: () => void
  onPointDrag: (index: number, newLng: number, newLat: number) => void
  onDragStart: (index: number) => void
  onDragEnd: () => void
  // Delivery area props
  showDeliveryAreaDropdown: boolean
  onToggleDeliveryAreaDropdown: () => void
  // Third column panel props
  hoveredScenario: string | null
  selectedScenarios: string[]
  selectedRegion: string
  onScenarioHover: (scenario: string | null) => void
  onScenarioSelect: (scenario: string) => void
  onRegionSelect: (region: string) => void
  // Climate props
  selectedClimate: number
  onClimateChange: (value: number) => void
  // Outcome visualization props
  selectedOutcome: string | null
  onOutcomeSelect: (outcome: string) => void
  // Clear selections
  onClearSelectedScenarios: () => void
}

const MapControls = ({
  // Region selection props
  isDrawingCustomRegion,
  polygonPoints,
  draggedPointIndex: _draggedPointIndex, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSelectRegionOnMap,
  onClearCustomRegion,
  onPointDrag: _onPointDrag, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDragStart: _onDragStart, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDragEnd: _onDragEnd, // eslint-disable-line @typescript-eslint/no-unused-vars
  // Delivery area props
  showDeliveryAreaDropdown: _showDeliveryAreaDropdown, // eslint-disable-line @typescript-eslint/no-unused-vars
  onToggleDeliveryAreaDropdown,
  // Third column panel props
  hoveredScenario: _hoveredScenario, // eslint-disable-line @typescript-eslint/no-unused-vars
  selectedScenarios,
  selectedRegion,
  onScenarioHover: _onScenarioHover, // eslint-disable-line @typescript-eslint/no-unused-vars
  onScenarioSelect,
  onRegionSelect: _onRegionSelect, // eslint-disable-line @typescript-eslint/no-unused-vars
  // Climate props
  selectedClimate,
  onClimateChange,
  // Outcome visualization props
  selectedOutcome: _selectedOutcome, // eslint-disable-line @typescript-eslint/no-unused-vars
  onOutcomeSelect,
  onClearSelectedScenarios,
}: MapControlsProps) => {
  const { flyTo } = useMap()
  const { setDrawerContent, openDrawer } = useDrawerStore()
  const theme = useTheme()

  const [showRegionDropdown, setShowRegionDropdown] = useState(false)

  // Card minimize/maximize states
  const [isFirstCardMinimized, setIsFirstCardMinimized] = useState(false)
  const [isThirdCardMinimized, setIsThirdCardMinimized] = useState(false)

  // Outcomes panel state
  const [isRelativeView, setIsRelativeView] = useState(true)
  const [highlightBaseline, setHighlightBaseline] = useState(false)
  const [expandChart, setExpandChart] = useState(false)

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

  // Region card dropdown
  const toggleRegionDropdown = useCallback(() => {
    setShowRegionDropdown(!showRegionDropdown)
  }, [showRegionDropdown])

  const handleSelectRegionOnMapClick = useCallback(() => {
    onSelectRegionOnMap()
    setShowRegionDropdown(false) // Close dropdown when starting to draw
  }, [onSelectRegionOnMap])

  // Outcomes panel handlers
  const handleViewModeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsRelativeView(event.target.checked)
    },
    [],
  )

  const handleHighlightBaselineChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setHighlightBaseline(event.target.checked)
    },
    [],
  )

  const handleLearnMoreClick = useCallback(() => {
    console.log("Learn more about this chart clicked")
  }, [])

  const toggleExpandChart = useCallback(() => {
    const newExpandedState = !expandChart
    setExpandChart(newExpandedState)
    // onExpandChange?.(newExpandedState) // We can add this prop later if needed
  }, [expandChart])

  // Handler to open glossary to specific entry
  const handleGlossaryOpen = useCallback(
    (glossaryEntry: string) => {
      setDrawerContent({
        selectedTerm: glossaryEntry,
      })
      openDrawer("glossary")
    },
    [setDrawerContent, openDrawer],
  )

  // ✨ Clean chart data hook encapsulates ALL optimization logic
  const chartData = useChartData({
    highlightBaseline,
    expandChart,
  })

  // Accordion sections for the third column
  const accordionSections: CardAccordionSection[] = [
    {
      id: "select-scenarios",
      title: "Select scenarios",
      content: (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 0,
          }}
        >
          {/* Outcomes paragraph, visible when chart not expanded */}
          {!expandChart && (
            <Box sx={{ flexShrink: 0 }}>
              <Box
                sx={{
                  fontSize: "1rem",
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: (theme) => theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Compare scenarios across multiple outcomes to understand
                trade-offs and synergies in California&apos;s water management.{" "}
                <Box
                  component="span"
                  onClick={handleLearnMoreClick}
                  sx={{
                    color: (theme) => theme.palette.blue.bright,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    fontWeight: 500,
                    textDecoration: "underline",
                    whiteSpace: "nowrap",
                    "&:hover": {
                      color: (theme) => theme.palette.blue.darkest,
                    },
                  }}
                >
                  Learn more about this chart
                </Box>
              </Box>
            </Box>
          )}

          {/* Control Section, always visible */}
          <Box sx={{ flexShrink: 0, mb: 1 }}>
            {/* Expand chart button, always visible */}
            <Box sx={{ mb: 1 }}>
              <Button
                variant="text"
                onClick={toggleExpandChart}
                sx={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: (theme) => theme.palette.blue.bright,
                  padding: 0,
                  minWidth: "auto",
                  textTransform: "none",
                  justifyContent: "flex-start",
                  "&:hover": {
                    color: (theme) => theme.palette.blue.darkest,
                    backgroundColor: "transparent",
                  },
                }}
              >
                <span
                  style={{
                    fontSize: "0.875em",
                    marginRight: "8px",
                    display: "inline-block",
                    transform: expandChart ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  ▼
                </span>
                {expandChart ? "Reduce" : "Expand"} chart
              </Button>
            </Box>

            {/* Chart controls */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mt: 1,
                mb: 1,
                width: "100%",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isRelativeView}
                    onChange={handleViewModeChange}
                    size="small"
                  />
                }
                label="relative to current operations"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={highlightBaseline}
                    onChange={handleHighlightBaselineChange}
                    size="small"
                  />
                }
                label="highlight current operations"
              />
            </Box>
          </Box>

          {/* Responsive Chart Visualization */}
          <Box
            sx={{
              flexGrow: 1,
              width: "100%",
              height: "100%",
              minHeight: 0,
              maxHeight: "none",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <VerticalParallelLinePlot
              key={chartData.key}
              {...chartData.props}
            />
          </Box>
        </Box>
      ),
    },
    {
      id: "select-regions",
      title: "Select regions",
      content: (
        <Box>
          {/* Region Selection Header */}
          <Box
            sx={{
              mb: 2,
              textAlign: "left",
            }}
          >
            <Box
              sx={{
                color: (theme) => theme.palette.blue.medium,
                textTransform: "uppercase",
                letterSpacing: "0.75px",
                fontSize: "0.75rem",
                fontWeight: 500,
                mb: 0.5,
              }}
            >
              CHOOSE A REGION
            </Box>
            <Box
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                fontFamily: (theme) => theme.typography.fontFamily,
                fontWeight: 500,
                fontSize: "1.5rem",
                lineHeight: 1.3,
                mb: 1,
              }}
            >
              Central Valley
            </Box>
          </Box>

          {/* Region Selection Dropdown Trigger */}
          <Box sx={{ mb: 2, textAlign: "center" }}>
            <Button
              variant="text"
              onClick={toggleRegionDropdown}
              sx={{
                fontSize: "1rem",
                fontWeight: 500,
                color: (theme) => theme.palette.blue.bright,
                padding: 0,
                minWidth: "auto",
                textTransform: "none",
                justifyContent: "center",
                "&:hover": {
                  color: (theme) => theme.palette.blue.darkest,
                  backgroundColor: "transparent",
                },
              }}
            >
              <span
                style={{
                  fontSize: "0.875em",
                  marginRight: "8px",
                  display: "inline-block",
                  transform: showRegionDropdown
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                ▼
              </span>
              Choose a different region
            </Button>
          </Box>

          {/* Region Selection Options */}
          {showRegionDropdown && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                p: 2,
                backgroundColor: (theme) => theme.palette.grey[50],
                borderRadius: (theme) => theme.borderRadius.rounded,
                border: "1px solid",
                borderColor: (theme) => theme.palette.divider,
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
                    onChange={(e) => {
                      if (e.target.checked) {
                        onToggleDeliveryAreaDropdown()
                      }
                    }}
                  />
                }
                label="Select delivery area"
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
              />
            </Box>
          )}
        </Box>
      ),
    },
    {
      id: "selection-history",
      title: "Selection history",
      content: (
        <Box>
          {/* Selected Region */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: (theme) => theme.palette.grey[50],
              borderRadius: (theme) => theme.borderRadius.rounded,
            }}
          >
            <Box
              sx={{
                fontSize: "0.8rem",
                color: (theme) => theme.palette.text.secondary,
                mb: 0.5,
              }}
            >
              Region:
            </Box>
            <Box sx={{ fontSize: "0.9rem", fontWeight: 500 }}>
              {selectedRegion}
            </Box>
          </Box>

          {/* Selected scenarios */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                fontSize: "0.8rem",
                color: (theme) => theme.palette.text.secondary,
                mb: 1,
              }}
            >
              Scenarios ({selectedScenarios.length}):
            </Box>
            {selectedScenarios.length > 0 ? (
              selectedScenarios.map((scenario, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    backgroundColor: (theme) =>
                      theme.palette.blue.bright + "20",
                    borderRadius: (theme) => theme.borderRadius.rounded,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ fontSize: "0.85rem" }}>{scenario}</Box>
                  <Box
                    sx={{
                      cursor: "pointer",
                      color: (theme) => theme.palette.text.secondary,
                      "&:hover": {
                        color: (theme) => theme.palette.error.main,
                      },
                    }}
                    onClick={() => {
                      onScenarioSelect(scenario) // This will toggle it off
                    }}
                  >
                    ×
                  </Box>
                </Box>
              ))
            ) : (
              <Box
                sx={{
                  fontSize: "0.8rem",
                  color: (theme) => theme.palette.text.disabled,
                  fontStyle: "italic",
                  textAlign: "center",
                  p: 2,
                }}
              >
                No scenarios selected yet
              </Box>
            )}
          </Box>
        </Box>
      ),
    },
  ]

  const glyphVariant = useGlyphSettingsStore((s) => s.variant)

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.mapControls,
        pointerEvents: "none", // For map interactions between map and overlay
        p: 2, // 16px padding
      }}
    >
      {/* Seven column layout with 2/7 width panels */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 3,
          height: "100%",
        }}
      >
        {/* Left column/scenario card */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            height: "100%",
            gridColumn: "1 / 3", // Spans columns 1-2 (2/7 width)
          }}
        >
          {/* Unified scenario card for all tabs */}
          <Box
            sx={{
              position: "relative",
              height: "auto",
            }}
          >
            <Box
              sx={{
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: (theme) => theme.borderRadius.card,
                border: "1px solid",
                borderColor: (theme) => theme.palette.divider,
                padding: 3,
                display: "flex",
                flexDirection: "column",
                height: "auto",
                opacity: isFirstCardMinimized ? 0.8 : 1,
              }}
            >
              {/* Always visible scenario description section */}
              {!isFirstCardMinimized && (
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Box
                    sx={{
                      color: (theme) => theme.palette.blue.medium,
                      textTransform: "uppercase",
                      letterSpacing: "0.75px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    SCENARIO
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.darkest,
                        fontFamily:
                          '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        fontWeight: 500,
                        fontSize: "1.5rem",
                        lineHeight: 1.3,
                        mb: 1,
                      }}
                    >
                      Current operations scenario
                    </Box>
                    <InfoIconButton
                      mode="glossary"
                      glossaryEntry="Current operations scenario"
                      onGlossaryOpen={handleGlossaryOpen}
                    />
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      color: (theme) => theme.palette.blue.darkest,
                      fontFamily: (theme) => theme.typography.fontFamily,
                    }}
                  >
                    {/* Description */}
                    <Box component="ul" sx={{ margin: 0, paddingLeft: "20px" }}>
                      <Typography
                        component="li"
                        variant="body2"
                        sx={{
                          mb: 0,
                          color: "inherit",
                        }}
                      >
                        helps us understand how California manages water
                      </Typography>
                      <Typography
                        component="li"
                        variant="body2"
                        sx={{
                          mb: 0,
                          color: "inherit",
                        }}
                      >
                        serves as a foundation to compare alternatives.
                      </Typography>
                    </Box>
                  </Box>

                  {/* HR separator */}
                  <Box
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: (theme) => theme.palette.grey[300],
                      my: 2.5,
                      mb: 0,
                    }}
                  />
                </Box>
              )}

              {/* Scenario snapshot section */}
              {!isFirstCardMinimized && (
                <Box sx={{ flexShrink: 0, pb: 2 }}>
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: (theme) => theme.palette.blue.darkest,
                          }}
                        >
                          Scenario outcomes
                        </Typography>
                        <InfoIconButton
                          mode="glossary"
                          glossaryEntry="CalSim"
                          onGlossaryOpen={handleGlossaryOpen}
                        />
                      </Box>
                      {/* Glyph variant selector */}
                      <Select
                        size="small"
                        value={glyphVariant}
                        onChange={(e) =>
                          useGlyphSettingsStore
                            .getState()
                            .setVariant(
                              e.target.value as "bars" | "rose" | "quartile",
                            )
                        }
                        sx={{
                          fontSize: "0.75rem",
                          minWidth: "100px",
                          height: "32px",
                          backgroundColor: (theme) =>
                            theme.palette.common.white,
                          borderRadius: (theme) => theme.borderRadius.rounded,
                          "& .MuiSelect-select": {
                            padding: "6px 12px",
                            display: "flex",
                            alignItems: "center",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderWidth: "1px",
                            borderColor: (theme) => theme.palette.grey[300],
                            borderRadius: (theme) => theme.borderRadius.rounded,
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: (theme) => theme.palette.blue.medium,
                            borderWidth: "1px",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: (theme) => theme.palette.blue.bright,
                            borderWidth: "2px",
                            boxShadow: (theme) =>
                              `0 0 0 1px ${theme.palette.blue.bright}20`,
                          },
                          "& .MuiSelect-icon": {
                            color: (theme) => theme.palette.grey[500],
                            fontSize: "1.2rem",
                            right: "8px",
                          },
                          "&:hover .MuiSelect-icon": {
                            color: (theme) => theme.palette.blue.medium,
                          },
                          "&.Mui-focused .MuiSelect-icon": {
                            color: (theme) => theme.palette.blue.bright,
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: (theme) =>
                                theme.borderRadius.rounded,
                              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                              border: (theme) =>
                                `1px solid ${theme.palette.grey[200]}`,
                              backgroundColor: (theme) =>
                                theme.palette.common.white,
                              mt: 0.5,
                              "& .MuiMenuItem-root": {
                                fontSize: "0.75rem",
                                padding: "8px 16px",
                                minHeight: "auto",
                                backgroundColor: (theme) =>
                                  theme.palette.common.white,
                                "&:hover": {
                                  backgroundColor: (theme) =>
                                    theme.palette.blue.bright + "10",
                                  color: (theme) => theme.palette.blue.darkest,
                                },
                                "&.Mui-selected": {
                                  backgroundColor: (theme) =>
                                    theme.palette.blue.bright + "20",
                                  color: (theme) => theme.palette.blue.darkest,
                                  fontWeight: 500,
                                  "&:hover": {
                                    backgroundColor: (theme) =>
                                      theme.palette.blue.bright + "30",
                                  },
                                },
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="bars">Bars</MenuItem>
                        <MenuItem value="rose">Rose</MenuItem>
                        <MenuItem value="quartile">Quartile</MenuItem>
                      </Select>
                    </Box>

                    <Box
                      sx={{
                        mb: 0,
                      }}
                    >
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <Box
                          component="span"
                          sx={{
                            color: (theme) => theme.palette.text.secondary,
                          }}
                        >
                          Click
                        </Box>{" "}
                        on each outcome to see how it is defined and how the
                        results are distributed across the state on the map.
                      </Typography>
                    </Box>
                  </Box>

                  {/* Grid layout: outcomes charts */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 2,
                      alignItems: "start",
                    }}
                  >
                    {OUTCOMES.map((outcome) => (
                      <Box
                        key={outcome}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                          padding: 0.5,
                          maxWidth: "80px",
                          borderRadius: (theme) => theme.borderRadius.rounded,
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                          "&:hover": {
                            backgroundColor: (theme) => theme.palette.grey[100],
                          },
                          "&:active": {
                            backgroundColor: (theme) => theme.palette.grey[200],
                          },
                        }}
                        onClick={() => {
                          // Handle outcome selection for map visualization
                          onOutcomeSelect(outcome)
                          // Also open glossary drawer with the specific outcome term
                          openDrawer("glossary")
                          setDrawerContent({ selectedTerm: outcome })
                        }}
                      >
                        {/* Glyph for outcome */}
                        <ScenarioGlyph
                          tierColors={[
                            theme.palette.tiers.tier1,
                            theme.palette.tiers.tier2,
                            theme.palette.tiers.tier3,
                            theme.palette.tiers.tier4,
                          ]}
                          values={(() => {
                            // Generate climate-influenced dummy data based on selectedClimate
                            // 0: Warmer Wetter, 1: Historical, 2-5: Warmer Drier I-IV

                            // Base median value varies by outcome type
                            const outcomeIndex = OUTCOMES.indexOf(outcome)
                            const baseMedian = outcomeIndex * 0.1 - 0.2 // -0.2 to 0.1 range

                            // Climate affects both central tendency and variability
                            let medianShift = 0
                            let variabilityMultiplier = 1

                            if (selectedClimate === 0) {
                              // Warmer Wetter - better outcomes, less variability
                              medianShift = 0.3 // More positive = more green/blue (better)
                              variabilityMultiplier = 0.7
                            } else if (selectedClimate === 1) {
                              // Historical - baseline
                              medianShift = 0
                              variabilityMultiplier = 1
                            } else {
                              // Warmer Drier I-IV - worse outcomes, more variability
                              const drierLevel = selectedClimate - 2 // 0-3
                              medianShift = -0.2 - drierLevel * 0.2 // Gets progressively worse: -0.2, -0.4, -0.6, -0.8 (more red/orange)
                              variabilityMultiplier = 1.2 + drierLevel * 0.4 // More variable: 1.2, 1.6, 2.0, 2.4
                            }

                            const median = baseMedian + medianShift
                            const baseSpread = 0.4 * variabilityMultiplier

                            // Create distribution with climate-appropriate spread
                            const q1 = median - baseSpread * 0.5
                            const q3 = median + baseSpread * 0.3 // Asymmetric - more downside risk
                            const min = median - baseSpread * 0.8

                            return [q3, median, q1, min] as [
                              number,
                              number,
                              number,
                              number,
                            ]
                          })()}
                          size={56}
                          variant={glyphVariant}
                        />

                        {/* Outcome label */}
                        <Box
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 400,
                            lineHeight: 1.3,
                            color: (theme) => theme.palette.text.primary,
                            textAlign: "center",
                            maxWidth: "80px",
                          }}
                        >
                          {outcome}
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Climate selector */}
                  <Box sx={{ mt: 2 }}>
                    {/* Climate heading */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: (theme) => theme.palette.blue.darkest,
                        }}
                      >
                        Climate
                      </Typography>
                      <InfoIconButton
                        mode="glossary"
                        glossaryEntry="Changing climate"
                        onGlossaryOpen={handleGlossaryOpen}
                      />
                    </Box>

                    {/* Climate instruction text */}
                    <Box sx={{ mb: 0 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <Box
                          component="span"
                          sx={{
                            color: (theme) => theme.palette.text.secondary,
                          }}
                        >
                          Slide
                        </Box>{" "}
                        to explore how climate affects outcomes.
                      </Typography>
                    </Box>

                    {/* Climate slider */}
                    <DiscreteSlider
                      stops={[
                        "Warmer Wetter",
                        "Historical",
                        "Warmer Drier I",
                        "Warmer Drier II",
                        "Warmer Drier III",
                        "Warmer Drier IV",
                      ]}
                      value={selectedClimate}
                      onChange={(value) => {
                        onClimateChange(value)
                        console.log("Climate changed to:", value)
                      }}
                      labelPosition="top"
                    />
                  </Box>
                </Box>
              )}

              {/* COMMENTED OUT, may use later */}
              {/* Minimized state */}
              {/* {isFirstCardMinimized && (
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Box
                    sx={{
                      color: (theme) => theme.palette.blue.darkest,
                      fontFamily:
                        '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      fontWeight: 500,
                      fontSize: "1.5rem",
                      lineHeight: 1.3,
                    }}
                  >
                    Scenarios
                  </Box>
                </Box>
              )} */}

              {/* Choose alternative scenarios line, hidden when chart expanded or minimized */}
              {/* {!isOutcomesExpanded && !isFirstCardMinimized && (
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Box
                    onClick={toggleDropdown}
                    sx={{
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "color 0.2s ease",
                      color: (theme) => theme.palette.blue.medium,
                      fontFamily: (theme) => theme.typography.fontFamily,
                      fontWeight: 500,
                      fontSize: "1rem",
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
                        transform: showDropdown
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ▼
                    </span>
                  </Box>
                </Box>
              )} */}

              {/* Tab navigation, hidden when chart expanded or minimized */}
              {/* {!isOutcomesExpanded && !isFirstCardMinimized && showDropdown && (
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        mr: 2,
                        fontSize: "1rem",
                        fontWeight: 400,
                        color: (theme) => theme.palette.text.primary,
                        flexShrink: 0,
                      }}
                    >
                      Choose by:
                    </Box>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      sx={{ flex: 1 }}
                    >
                      <Tab label="Presets" />
                      <Tab label="Outcomes" />
                      <Tab label="Climate resilience" />
                    </Tabs>
                  </Box>
                </Box>
              )} */}

              {/* Tab Content - Dynamic based on active tab and dropdown state */}
              {/* {!isFirstCardMinimized &&
                (showDropdown || (activeTab === 1 && isOutcomesExpanded)) && (
                  <Box
                    sx={{
                      // Dynamic height based on active tab
                      ...(activeTab === 1
                        ? {
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            minHeight: 0,
                          }
                        : {
                            flexShrink: 0,
                          }),
                    }}
                  >
                    {activeTab === 0 && (
                      <PresetsPanel
                        onViewOnMap={handleViewOnMap}
                        onScenarioHover={onScenarioHover}
                        onScenarioSelect={onScenarioSelect}
                      />
                    )}
                    {activeTab === 1 && (
                      <OutcomesPanel
                        onExpandChange={handleOutcomesExpandChange}
                      />
                    )}
                    {activeTab === 2 && <OperationsPanel />}
                  </Box>
                )} */}
            </Box>

            {/* Minimize/maximize button */}
            <Box
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setIsFirstCardMinimized(!isFirstCardMinimized)
              }}
              sx={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "24px",
                height: "24px",
                backgroundColor: (theme) => theme.palette.common.white,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                zIndex: 9999,
                pointerEvents: "auto",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.grey[50],
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                },
              }}
            >
              <svg
                width="12"
                height="10"
                viewBox="0 0 12 10"
                style={{
                  fill: "#3a4574",
                  transition: "transform 0.2s ease",
                  transform: isFirstCardMinimized
                    ? "rotate(0deg)"
                    : "rotate(180deg)",
                  pointerEvents: "none",
                }}
              >
                <path d="M6 0 L11 8 Q6 6 1 8 Z" />
              </svg>
            </Box>
          </Box>
        </Box>

        {/* Right column, Alternative scenarios */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            minWidth: 0,
            gridColumn: "6 / 8", // Spans columns 6-7 (2/7 width)
          }}
        >
          {/* Alternative scenarios panel */}
          <Box sx={{ position: "relative" }}>
            <ScenarioCard
              topLine={isThirdCardMinimized ? "" : "CHOOSE AND COMPARE"}
              headline={"Alternative scenarios"}
              body={null}
              sx={{
                opacity: isThirdCardMinimized ? 0.8 : 1,
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
              }}
              dropdownContent={
                isThirdCardMinimized ? undefined : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      px: 3, // Card padding
                    }}
                  >
                    {/* Filter status header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mb: 0 }}
                      >
                        30 scenarios available • {selectedScenarios.length}{" "}
                        selected
                      </Typography>
                      {selectedScenarios.length > 0 && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => onClearSelectedScenarios()}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.875rem",
                            color: (theme) => theme.palette.blue.bright,
                            minWidth: "auto",
                            padding: 0,
                            "&:hover": {
                              backgroundColor: "transparent",
                              color: (theme) => theme.palette.blue.darkest,
                            },
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </Box>
                    {/* Card Accordion */}
                    <CardAccordion
                      sections={accordionSections}
                      allowMultiple={false} // Only one section expanded at a time
                      sx={{ flexGrow: 1 }}
                    />

                    {/* Compare Button at bottom */}
                    <Box sx={{ p: 2, pt: 0, flexShrink: 0 }}>
                      <ActionCardButton
                        title="Explore scenarios in depth"
                        subtitle={
                          selectedScenarios.length > 0
                            ? `${selectedScenarios.length} scenario${selectedScenarios.length > 1 ? "s" : ""} for ${selectedRegion}`
                            : "Select scenarios to explore"
                        }
                        disabled={selectedScenarios.length === 0}
                        onClick={() => {
                          if (selectedScenarios.length > 0) {
                            console.log(
                              "Navigate to exploration view with:",
                              selectedScenarios,
                              selectedRegion,
                            )
                          }
                        }}
                      />
                    </Box>
                  </Box>
                )
              }
            />
            <Box
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setIsThirdCardMinimized(!isThirdCardMinimized)
              }}
              sx={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "24px",
                height: "24px",
                backgroundColor: (theme) => theme.palette.common.white,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                zIndex: 9999,
                pointerEvents: "auto",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.grey[50],
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                },
              }}
            >
              <svg
                width="12"
                height="10"
                viewBox="0 0 12 10"
                style={{
                  fill: "#3a4574",
                  transition: "transform 0.2s ease",
                  transform: isThirdCardMinimized
                    ? "rotate(0deg)"
                    : "rotate(180deg)",
                  pointerEvents: "none",
                }}
              >
                <path d="M6 0 L11 8 Q6 6 1 8 Z" />
              </svg>
            </Box>
          </Box>

          {/* Quick actions atm, may use later */}
          <Box
            sx={{
              marginTop: "auto",
              display: "flex",
              width: "100%",
            }}
          >
            <Card
              sx={{
                p: 1,
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
                minWidth: 0,
              }}
            >
              <IconButton
                onClick={handleCenterOnCalifornia}
                size="small"
                title="Center on California"
              >
                <MyLocationIcon />
              </IconButton>
              <TextField
                placeholder="Enter location to zoom"
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 0,
                  minWidth: 0,
                  maxWidth: "none",
                  "& .MuiOutlinedInput-root": {
                    height: 32,
                    fontSize: "0.875rem",
                    minWidth: 0,
                    "& fieldset": {
                      borderColor: (theme) => theme.palette.divider,
                      borderWidth: "1px",
                    },
                    "&:hover fieldset": {
                      borderColor: (theme) => theme.palette.text.secondary,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: (theme) => theme.palette.blue.medium,
                      borderWidth: "1px",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    fontSize: "0.875rem",
                    padding: "6px 8px",
                    minWidth: 0,
                  },
                  "& .MuiInputBase-input::placeholder": {
                    fontSize: "0.875rem",
                    opacity: 0.6,
                  },
                }}
              />
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
  const { addSource, addLayer, removeLayer, hasSource, hasLayer, fitBounds } = useMap()

  // Calculated extents for different outcome datasets (from geojson analysis)
  const OUTCOME_EXTENTS = {
    "Community deliveries": {
      // Urban areas - calculated bounds from actual data
      bounds: [[-122.5253313401591, 35.9947689586334], [-119.73675744266775, 40.745557975898166]] as [[number, number], [number, number]],
      center: { longitude: -121.13104439141343, latitude: 38.37016346726578, zoom: 6.2 },
    },
    "Agricultural deliveries": {
      // Agriculture areas - calculated bounds from actual data
      bounds: [[-122.73923233712331, 35.964081298197414], [-119.71028032650193, 40.751670748519366]] as [[number, number], [number, number]],
      center: { longitude: -121.22475633181261, latitude: 38.357876023358386, zoom: 6.0 },
    },
  }

  // Polygon drawing state, lifted to main component
  const [isDrawingCustomRegion, setIsDrawingCustomRegion] = useState(false)
  const [polygonPoints, setPolygonPoints] = useState<
    Array<{ lng: number; lat: number }>
  >([])
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(
    null,
  )
  const [isSelfIntersecting, setIsSelfIntersecting] = useState(false)

  // Third column panel state
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null)
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState("Central Valley")

  // Climate state
  const [selectedClimate, setSelectedClimate] = useState(1) // Default to "Historical"

  // Outcome visualization state
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null)
  const [hoveredFeatureData, setHoveredFeatureData] = useState<{
    modName: string;
    coordinates: [number, number];
  } | null>(null)

  // Delivery area state
  const [showDeliveryAreaDropdown, setShowDeliveryAreaDropdown] =
    useState(false)
  const [isSelectingDeliveryArea, setIsSelectingDeliveryArea] = useState(false)

  const handleSelectRegionOnMap = () => {
    setIsDrawingCustomRegion(true)
    setPolygonPoints([])
  }

  const handlePolygonComplete = () => {
    if (polygonPoints.length >= 3) {
      setIsDrawingCustomRegion(false)
      console.log("Custom region polygon completed:", polygonPoints)
    }
  }

  const handleClearCustomRegion = () => {
    setIsDrawingCustomRegion(false)
    setPolygonPoints([])
    setDraggedPointIndex(null)
    setIsSelfIntersecting(false)
  }

  const handleToggleDeliveryAreaDropdown = () => {
    const isChecking = !showDeliveryAreaDropdown
    setShowDeliveryAreaDropdown(isChecking)

    if (isChecking) {
      // Start delivery area selection mode
      setIsSelectingDeliveryArea(true)
    } else {
      // Cancel delivery area selection
      setIsSelectingDeliveryArea(false)
    }
  }

  // Check if two line segments intersect
  const doSegmentsIntersect = useCallback(
    (
      seg1: [{ lng: number; lat: number }, { lng: number; lat: number }],
      seg2: [{ lng: number; lat: number }, { lng: number; lat: number }],
    ) => {
      const [p1, p2] = seg1
      const [p3, p4] = seg2

      const ccw = (
        A: { lng: number; lat: number },
        B: { lng: number; lat: number },
        C: { lng: number; lat: number },
      ) => {
        return (
          (C.lat - A.lat) * (B.lng - A.lng) > (B.lat - A.lat) * (C.lng - A.lng)
        )
      }

      return (
        ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
        ccw(p1, p2, p3) !== ccw(p1, p2, p4)
      )
    },
    [],
  )

  // Check if polygon self-intersects using line segment intersection
  const checkSelfIntersection = useCallback(
    (points: Array<{ lng: number; lat: number }>) => {
      if (points.length < 4) return false // Need at least 4 points to self-intersect

      const segments: Array<
        [{ lng: number; lat: number }, { lng: number; lat: number }]
      > = []
      for (let i = 0; i < points.length; i++) {
        const next = (i + 1) % points.length
        const currentPoint = points[i]
        const nextPoint = points[next]
        if (!currentPoint || !nextPoint) continue
        segments.push([currentPoint, nextPoint])
      }

      // Check each segment against all non-adjacent segments
      for (let i = 0; i < segments.length; i++) {
        for (let j = i + 2; j < segments.length; j++) {
          // Skip adjacent segments and last-first comparison
          if (j === segments.length - 1 && i === 0) continue

          const seg1 = segments[i]
          const seg2 = segments[j]
          if (seg1 && seg2 && doSegmentsIntersect(seg1, seg2)) {
            return true
          }
        }
      }
      return false
    },
    [doSegmentsIntersect],
  )

  // Check for self-intersection whenever polygon points change
  useEffect(() => {
    if (polygonPoints.length >= 4) {
      setIsSelfIntersecting(checkSelfIntersection(polygonPoints))
    } else {
      setIsSelfIntersecting(false)
    }
  }, [polygonPoints, checkSelfIntersection])

  const handlePointDrag = (index: number, newLng: number, newLat: number) => {
    setPolygonPoints((prev) =>
      prev.map((point, i) =>
        i === index ? { lng: newLng, lat: newLat } : point,
      ),
    )
  }

  const handleDragStart = (index: number) => {
    setDraggedPointIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedPointIndex(null)
  }

  // Third column panel handlers
  const handleScenarioHover = (scenario: string | null) => {
    setHoveredScenario(scenario)
  }

  const handleScenarioSelect = (scenario: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenario)
        ? prev.filter((s) => s !== scenario)
        : [...prev, scenario],
    )
  }

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region)
  }

  const handleClearSelectedScenarios = () => {
    setSelectedScenarios([])
  }

  const handleClimateChange = (value: number) => {
    setSelectedClimate(value)
  }

  const handleOutcomeSelect = (outcome: string) => {
    if (selectedOutcome === outcome) {
      // If clicking the same outcome, deselect it
      setSelectedOutcome(null)
    } else {
      setSelectedOutcome(outcome)
      
      // Zoom to extent for the selected outcome
      const extent = OUTCOME_EXTENTS[outcome as keyof typeof OUTCOME_EXTENTS]
      if (extent) {
        fitBounds(
          extent.bounds,
          0, // pitch
          0, // bearing
          { top: 50, bottom: 50, left: 50, right: 50 }, // padding
          { duration: 2000 } // transition options
        )
      }
    }
  }

  // Effect to manage map layers based on selected outcome
  useEffect(() => {
    // Add the geospatial data source if it doesn't exist
    if (!hasSource("delivery-units")) {
      addSource("delivery-units", {
        type: "geojson",
        data: "/geospatial_data/du.geojson",
      })
    }

    // Remove existing outcome layers
    if (hasLayer("community-deliveries-layer")) {
      removeLayer("community-deliveries-layer")
    }
    if (hasLayer("community-deliveries-hover")) {
      removeLayer("community-deliveries-hover")
    }
    if (hasLayer("agricultural-deliveries-layer")) {
      removeLayer("agricultural-deliveries-layer")
    }
    if (hasLayer("agricultural-deliveries-hover")) {
      removeLayer("agricultural-deliveries-hover")
    }

    // Add layer based on selected outcome
    if (selectedOutcome === "Community deliveries") {
      console.log("Adding community deliveries layer...")
      addLayer(
        "community-deliveries-layer",
        "delivery-units",
        "fill",
        {
          // Simplified tier color assignment - use string length for more reliable randomization
          "fill-color": [
            "case",
            ["==", ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4], 0], "#7b9d3f", // Tier 1 - Green
            ["==", ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4], 1], "#60aacb", // Tier 2 - Blue  
            ["==", ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4], 2], "#FFB347", // Tier 3 - Orange
            ["==", ["%", ["length", ["to-string", ["get", "DU_ID"]]], 4], 3], "#CD5C5C", // Tier 4 - Red
            "#60aacb" // Fallback blue for any edge cases
          ],
          "fill-opacity": 0.7,
          "fill-outline-color": "#3a4574", // Darker blue for outline
        },
        {
          visibility: "visible",
        },
        {
          filter: ["==", ["get", "Class"], "Urban"], // Filter to show only Urban areas
        }
      )
      
      // Add hover layer for community deliveries
      addLayer(
        "community-deliveries-hover",
        "delivery-units",
        "line",
        {
          "line-color": "#FFFFFF", // White stroke on hover
          "line-width": 3,
          "line-opacity": ["case", ["==", ["get", "DU_ID"], hoveredFeatureId ?? ""], 1, 0],
        },
        {
          visibility: "visible",
        },
        {
          filter: ["==", ["get", "Class"], "Urban"],
        }
      )
      
      console.log("Community deliveries layer added")
    } else if (selectedOutcome === "Agricultural deliveries") {
      console.log("Adding agricultural deliveries layer...")
      addLayer(
        "agricultural-deliveries-layer",
        "delivery-units",
        "fill",
        {
          // Use the same working approach as Community deliveries
          "fill-color": [
            "case",
            ["in", ["slice", ["to-string", ["get", "DU_ID"]], 0, 1], ["literal", ["1", "5", "9"]]], "#7b9d3f", // Green for IDs starting with 1,5,9
            ["in", ["slice", ["to-string", ["get", "DU_ID"]], 0, 1], ["literal", ["2", "6"]]], "#60aacb", // Blue for IDs starting with 2,6  
            ["in", ["slice", ["to-string", ["get", "DU_ID"]], 0, 1], ["literal", ["3", "7"]]], "#FFB347", // Orange for IDs starting with 3,7
            ["in", ["slice", ["to-string", ["get", "DU_ID"]], 0, 1], ["literal", ["4", "8", "0"]]], "#CD5C5C", // Red for IDs starting with 4,8,0
            "#FF00FF" // Magenta fallback to identify failures
          ],
          "fill-opacity": 0.7,
          "fill-outline-color": "#3a4574", // Darker blue for outline
        },
        {
          visibility: "visible",
        },
        {
          filter: ["==", ["get", "Class"], "Agriculture"], // Filter to show only Agriculture areas
        }
      )
      
      // Add hover layer for agricultural deliveries
      addLayer(
        "agricultural-deliveries-hover",
        "delivery-units",
        "line",
        {
          "line-color": "#FFFFFF", // White stroke on hover
          "line-width": 3,
          "line-opacity": ["case", ["==", ["get", "DU_ID"], hoveredFeatureId ?? ""], 1, 0],
        },
        {
          visibility: "visible",
        },
        {
          filter: ["==", ["get", "Class"], "Agriculture"],
        }
      )
      
      console.log("Agricultural deliveries layer added")
    }
  }, [selectedOutcome, hoveredFeatureId, addSource, addLayer, removeLayer, hasSource, hasLayer])

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
        dragPan={draggedPointIndex === null} // Disable map dragging when dragging a vertex
        cursor={
          isDrawingCustomRegion
            ? "crosshair"
            : draggedPointIndex !== null
              ? "grabbing"
              : "default"
        }
        onClick={
          isDrawingCustomRegion
            ? (evt: { lngLat: { lng: number; lat: number } }) => {
                const { lng, lat } = evt.lngLat

                // Check if clicking near the first point to close the polygon
                if (polygonPoints.length >= 3) {
                  const firstPoint = polygonPoints[0]
                  if (firstPoint) {
                    const distance = Math.sqrt(
                      Math.pow(lng - firstPoint.lng, 2) +
                        Math.pow(lat - firstPoint.lat, 2),
                    )
                    // If within ~0.01 degrees (roughly 1km), close the polygon
                    if (distance < 0.01) {
                      handlePolygonComplete()
                      return
                    }
                  }
                }

                // Otherwise, add a new point
                const newPoint = { lng, lat }
                setPolygonPoints(
                  (prev: Array<{ lng: number; lat: number }>) => [
                    ...prev,
                    newPoint,
                  ],
                )
              }
            : undefined
        }
        onMouseMove={(evt: any) => {
          // Check if hovering over outcome polygons
          if (selectedOutcome) {
            const features = evt.target.queryRenderedFeatures(evt.point, {
              layers: [
                selectedOutcome === "Community deliveries" 
                  ? "community-deliveries-layer" 
                  : "agricultural-deliveries-layer"
              ]
            })
            
            if (features && features.length > 0) {
              const feature = features[0]
              const newFeatureId = feature.properties?.DU_ID || null
              
              // Only update state if the feature has actually changed
              if (newFeatureId !== hoveredFeatureId) {
                setHoveredFeatureId(newFeatureId)
                              setHoveredFeatureData({
                modName: feature.properties?.Sub_Name?.trim() || feature.properties?.Mod_Name || "Unknown",
                coordinates: [evt.lngLat.lng, evt.lngLat.lat]
              })
              }
              evt.target.getCanvas().style.cursor = 'pointer'
            } else {
              if (hoveredFeatureId !== null) {
                setHoveredFeatureId(null)
                setHoveredFeatureData(null)
              }
              evt.target.getCanvas().style.cursor = ''
            }
          }
        }}
        onMouseLeave={() => {
          setHoveredFeatureId(null)
          setHoveredFeatureData(null)
        }}
        onError={(evt: unknown) => {
          // Surface mapbox or ReactMapGL errors in the console
          console.error("🗺️ Map error:", evt)
        }}
      >
        {/* Built-in Mapbox Controls */}
        <NavigationControl
          position="bottom-right"
          showCompass={true}
          showZoom={true}
          style={{ marginBottom: "60px" }}
        />
        <GeolocateControl
          position="bottom-right"
          trackUserLocation={true}
          showUserHeading={true}
          style={{ marginBottom: "120px" }} // Stack above NavigationControl
        />

        {/* Polygon Drawing Visualization */}
        {polygonPoints.length > 0 && (
          <>
            {/* Draw draggable markers for each point */}
            {polygonPoints.map((point, index) => (
              <Marker
                key={index}
                longitude={point.lng}
                latitude={point.lat}
                draggable={!isDrawingCustomRegion}
                onDragStart={() => handleDragStart(index)}
                onDrag={(evt: { lngLat: { lng: number; lat: number } }) => {
                  const { lng, lat } = evt.lngLat
                  handlePointDrag(index, lng, lat)
                }}
                onDragEnd={handleDragEnd}
                onClick={
                  isDrawingCustomRegion &&
                  index === 0 &&
                  polygonPoints.length >= 3
                    ? (evt) => {
                        evt.originalEvent.stopPropagation()
                        handlePolygonComplete()
                      }
                    : undefined
                }
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor:
                      draggedPointIndex === index
                        ? "#e17055" // Darker orange for dragged state
                        : isSelfIntersecting
                          ? "#ff6b6b" // Red for error/self-intersection
                          : "#ff9f43", // Orange for normal drawing
                    border:
                      isDrawingCustomRegion &&
                      index === 0 &&
                      polygonPoints.length >= 3
                        ? "3px solid #fff" // Thicker white border for first point when ready to close
                        : "2px solid white",
                    boxShadow:
                      draggedPointIndex === index
                        ? "0 4px 8px rgba(0,0,0,0.4)"
                        : isDrawingCustomRegion &&
                            index === 0 &&
                            polygonPoints.length >= 3
                          ? "0 3px 6px rgba(0,0,0,0.4)" // Enhanced shadow for first point
                          : "0 2px 4px rgba(0,0,0,0.3)",
                    cursor: isDrawingCustomRegion
                      ? "pointer"
                      : draggedPointIndex === index
                        ? "grabbing"
                        : "grab",
                    transform:
                      draggedPointIndex === index
                        ? "scale(1.2)"
                        : isDrawingCustomRegion &&
                            index === 0 &&
                            polygonPoints.length >= 3
                          ? "scale(1.15)" // Slightly larger first point when ready to close
                          : "scale(1)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform:
                        isDrawingCustomRegion &&
                        index === 0 &&
                        polygonPoints.length >= 3
                          ? "scale(1.25)" // Extra hover effect for first point
                          : "scale(1.1)",
                    },
                  }}
                />
              </Marker>
            ))}

            {/* Draw lines connecting the points */}
            {polygonPoints.length > 1 && (
              <Source
                id="polygon-lines"
                type="geojson"
                data={{
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: polygonPoints.map((p) => [p.lng, p.lat]),
                  },
                }}
              >
                <Layer
                  id="polygon-line"
                  type="line"
                  paint={{
                    "line-color": isSelfIntersecting ? "#ff6b6b" : "#ff9f43",
                    "line-width": 2,
                    "line-dasharray": [2, 2],
                  }}
                />
              </Source>
            )}

            {/* Draw filled polygon when we have 3+ points and not actively drawing */}
            {polygonPoints.length >= 3 &&
              !isDrawingCustomRegion &&
              polygonPoints[0] && (
                <Source
                  id="polygon-fill"
                  type="geojson"
                  data={{
                    type: "Feature",
                    properties: {},
                    geometry: {
                      type: "Polygon",
                      coordinates: [
                        [
                          ...polygonPoints.map((p) => [p.lng, p.lat]),
                          [polygonPoints[0].lng, polygonPoints[0].lat],
                        ],
                      ],
                    },
                  }}
                >
                  <Layer
                    id="polygon-fill-layer"
                    type="fill"
                    paint={{
                      "fill-color": isSelfIntersecting ? "#ff6b6b" : "#ff9f43",
                      "fill-opacity": isSelfIntersecting ? 0.15 : 0.2,
                    }}
                  />
                  <Layer
                    id="polygon-stroke-layer"
                    type="line"
                    paint={{
                      "line-color": isSelfIntersecting ? "#ff6b6b" : "#ff9f43",
                      "line-width": 2,
                    }}
                  />
                </Source>
              )}
          </>
        )}

        {/* Hover popup for polygon information */}
        {hoveredFeatureData && (
          <Popup
            longitude={hoveredFeatureData.coordinates[0]}
            latitude={hoveredFeatureData.coordinates[1]}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, -10]}
          >
            {hoveredFeatureData.modName}
          </Popup>
        )}

        {/* Custom map markers */}
        {/* Marker 1: Los Angeles area */}
        <Marker 
          longitude={-118.2437} 
          latitude={34.0522}
          anchor="bottom" // Bottom middle tip attaches to coordinates
        >
          <MapMarkerTooltip
            text="Los Angeles - Urban water demand performing well"
            statusColor="#4CAF50"
          >
            <Box
              sx={{
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.3)",
                },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/map_markers/los_angeles.png"
                alt="Los Angeles marker"
                style={{
                  width: "60px",
                  height: "auto",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                }}
              />
              {/* Status indicator */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#4CAF50", // Green for good status
                  border: "2px solid white",
                }}
              />
            </Box>
          </MapMarkerTooltip>
        </Marker>

        {/* Marker 2: Sacramento area - positioned over a red delivery unit */}
        <Marker 
          longitude={-121.3} 
          latitude={38.6}
          anchor="bottom" // Bottom middle tip attaches to coordinates
        >
          <MapMarkerTooltip
            text="Sacramento - Municipal water supply under stress"
            statusColor="#ff4444"
          >
            <Box
              sx={{
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.3)",
                },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/map_markers/drinking_water.png"
                alt="Sacramento drinking water marker"
                style={{
                  width: "60px",
                  height: "auto",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                }}
              />
              {/* Status indicator */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#ff4444", // Red for bad status
                  border: "2px solid white",
                }}
              />
            </Box>
          </MapMarkerTooltip>
        </Marker>

        {/* Marker 3: Westlands W.D. - positioned over Westlands Water District polygon */}
        <Marker 
          longitude={-120.58} 
          latitude={36.58}
          anchor="bottom" // Bottom middle tip attaches to coordinates
        >
          <MapMarkerTooltip
            text="Central Valley - Agricultural irrigation stable"
            statusColor="#4CAF50"
          >
            <Box
              sx={{
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.3)",
                },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/map_markers/farmers.png"
                alt="Central Valley marker"
                style={{
                  width: "60px",
                  height: "auto",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                }}
              />
              {/* Status indicator */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#4CAF50", // Green
                  border: "2px solid white",
                }}
              />
            </Box>
          </MapMarkerTooltip>
        </Marker>

        {/* Marker 4: Chico area - positioned over agricultural polygon to the west */}
        <Marker 
          longitude={-121.95} 
          latitude={39.7285}
          anchor="bottom" // Bottom middle tip attaches to coordinates
        >
          <MapMarkerTooltip
            text="Chico - Crop irrigation facing drought challenges"
            statusColor="#ff4444"
          >
            <Box
              sx={{
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.3)",
                },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/map_markers/grapes.png"
                alt="Chico grapes marker"
                style={{
                  width: "60px",
                  height: "auto",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                }}
              />
              {/* Status indicator */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#ff4444", // Red for bad status
                  border: "2px solid white",
                }}
              />
            </Box>
          </MapMarkerTooltip>
        </Marker>
      </Map>

      {/* Custom region drawing dialog */}
      <MapPromptDialog
        isVisible={isDrawingCustomRegion}
        title="Draw Custom Region"
        subtitle={`Click to add points • Click first point to finish${
          polygonPoints.length > 0 ? ` • ${polygonPoints.length} points` : ""
        }`}
        actions={
          <Box sx={{ display: "flex", gap: 2 }}>
            {polygonPoints.length > 0 && (
              <Box
                onClick={(e) => {
                  e.stopPropagation()
                  setPolygonPoints([])
                  setIsSelfIntersecting(false)
                  setDraggedPointIndex(null)
                }}
                sx={(theme) => ({
                  fontSize: theme.mapPromptDialog.typography.action.fontSize,
                  color: theme.palette.blue.bright,
                  cursor: theme.mapPromptDialog.typography.action.cursor,
                  fontWeight:
                    theme.mapPromptDialog.typography.action.fontWeight,
                  textDecoration:
                    theme.mapPromptDialog.typography.action.textDecoration,
                  "&:hover": {
                    color: theme.palette.blue.light,
                  },
                })}
              >
                Redraw
              </Box>
            )}
            <Box
              onClick={(e) => {
                e.stopPropagation()
                handleClearCustomRegion()
              }}
              sx={(theme) => ({
                fontSize: theme.mapPromptDialog.typography.action.fontSize,
                color: theme.palette.blue.bright,
                cursor: theme.mapPromptDialog.typography.action.cursor,
                fontWeight: theme.mapPromptDialog.typography.action.fontWeight,
                textDecoration:
                  theme.mapPromptDialog.typography.action.textDecoration,
                "&:hover": {
                  color: theme.palette.blue.light,
                },
              })}
            >
              Cancel
            </Box>
          </Box>
        }
      />

      {/* Delivery area selection dialog */}
      <MapPromptDialog
        isVisible={isSelectingDeliveryArea}
        title="Select Delivery Area"
        subtitle="Click on a polygon on the map to select a delivery area"
        actions={
          <Box
            onClick={(e) => {
              e.stopPropagation()
              setIsSelectingDeliveryArea(false)
              setShowDeliveryAreaDropdown(false)
            }}
            sx={(theme) => ({
              fontSize: theme.mapPromptDialog.typography.action.fontSize,
              color: theme.palette.blue.bright,
              cursor: theme.mapPromptDialog.typography.action.cursor,
              fontWeight: theme.mapPromptDialog.typography.action.fontWeight,
              textDecoration:
                theme.mapPromptDialog.typography.action.textDecoration,
              "&:hover": {
                color: theme.palette.blue.light,
              },
            })}
          >
            Cancel
          </Box>
        }
      />

      {/* Self-Intersection Warning */}
      {isSelfIntersecting && !isDrawingCustomRegion && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 107, 107, 0.95)",
            color: "white",
            padding: 2,
            borderRadius: (theme) => theme.borderRadius.card,
            zIndex: (theme) => theme.zIndex.tooltip,
            textAlign: "center",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Box sx={{ fontSize: "0.9rem", fontWeight: 500, mb: 0.5 }}>
            ⚠️ Self-Intersecting Polygon
          </Box>
          <Box sx={{ fontSize: "0.8rem", opacity: 0.9 }}>
            Drag vertices to fix overlapping edges
          </Box>
        </Box>
      )}

      {/* Overlay Controls */}
      <MapControls
        isDrawingCustomRegion={isDrawingCustomRegion}
        polygonPoints={polygonPoints}
        draggedPointIndex={draggedPointIndex}
        onSelectRegionOnMap={handleSelectRegionOnMap}
        onClearCustomRegion={handleClearCustomRegion}
        onPointDrag={handlePointDrag}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        showDeliveryAreaDropdown={showDeliveryAreaDropdown}
        onToggleDeliveryAreaDropdown={handleToggleDeliveryAreaDropdown}
        hoveredScenario={hoveredScenario}
        selectedScenarios={selectedScenarios}
        selectedRegion={selectedRegion}
        onScenarioHover={handleScenarioHover}
        onScenarioSelect={handleScenarioSelect}
        onRegionSelect={handleRegionSelect}
        selectedClimate={selectedClimate}
        onClimateChange={handleClimateChange}
        selectedOutcome={selectedOutcome}
        onOutcomeSelect={handleOutcomeSelect}
        onClearSelectedScenarios={handleClearSelectedScenarios}
      />
    </Box>
  )
}
