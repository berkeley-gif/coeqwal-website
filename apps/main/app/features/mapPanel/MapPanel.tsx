"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Box,
  IconButton,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  TextField,
  Button,
} from "@repo/ui/mui"
import { Card, ScenarioCard, MapMarkerTooltip, Dropdown } from "@repo/ui"
import { RoseChart, BarChart, StickChart, VerticalParallelLinePlot, VerticalParallelLineData } from "@repo/viz"
import { OUTCOMES } from "../../lib/outcomes"
import {
  Map,
  useMap,
  NavigationControl,
  GeolocateControl,
  Marker,
  Source,
  Layer,
} from "@repo/map"
// import {
//   PresetsPanel,
//   OutcomesPanel,
//   OperationsPanel,
// } from "./cardContent/scenarioChoiceCard"
import MyLocationIcon from "@mui/icons-material/MyLocation"
import { MapPromptDialog } from "@repo/ui"

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
  previewPanelTab: number
  hoveredScenario: string | null
  selectedScenarios: string[]
  selectedRegion: string
  onPreviewTabChange: (tab: number) => void
  onScenarioHover: (scenario: string | null) => void
  onScenarioSelect: (scenario: string) => void
  onRegionSelect: (region: string) => void
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
  previewPanelTab,
  hoveredScenario,
  selectedScenarios,
  selectedRegion,
  onPreviewTabChange,
  onScenarioHover,
  onScenarioSelect,
  onRegionSelect: _onRegionSelect, // eslint-disable-line @typescript-eslint/no-unused-vars
}: MapControlsProps) => {
  const { flyTo } = useMap()

  const [showRegionDropdown, setShowRegionDropdown] = useState(false)

  // Card minimize/maximize states
  const [isFirstCardMinimized, setIsFirstCardMinimized] = useState(false)
  const [isThirdCardMinimized, setIsThirdCardMinimized] = useState(false)

  // Chart type state for scenario snapshot
  const [chartType, setChartType] = useState<"rose" | "bar" | "stick">("rose")

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
  const toggleRegionDropdown = () => {
    setShowRegionDropdown(!showRegionDropdown)
  }

  const handleSelectRegionOnMapClick = () => {
    onSelectRegionOnMap()
    setShowRegionDropdown(false) // Close dropdown when starting to draw
  }



  // Outcomes panel handlers
  const handleViewModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsRelativeView(event.target.checked)
  }

  const handleHighlightBaselineChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setHighlightBaseline(event.target.checked)
  }

  const handleLearnMoreClick = () => {
    console.log("Learn more about this chart clicked")
  }

  const toggleExpandChart = () => {
    const newExpandedState = !expandChart
    setExpandChart(newExpandedState)
    // onExpandChange?.(newExpandedState) // We can add this prop later if needed
  }

  const handleLineHover = (data: VerticalParallelLineData | null) => {
    console.log("Line hovered:", data?.name || "none")
  }

  const handleLineClick = (data: VerticalParallelLineData) => {
    console.log("Line clicked:", data.name)
  }

  // Sample data for vertical parallel line plot
  const axes = [
    "Community deliveries",
    "Agricultural deliveries",
    "Environmental deliveries",
    "Reservoir storage",
    "Groundwater storage",
    "Delta salinity",
    "Salmon abundance",
    "Distributional equity",
  ]

  // Generate scenarios with sample data
  const generateScenarios = (): VerticalParallelLineData[] => {
    const scenarios: VerticalParallelLineData[] = []

    // Baseline scenario (always first)
    scenarios.push({
      id: "baseline",
      name: "Current Operations",
      values: {
        "Community deliveries": 0.0,
        "Agricultural deliveries": 0.0,
        "Environmental deliveries": 0.0,
        "Reservoir storage": 0.0,
        "Groundwater storage": 0.0,
        "Delta salinity": 0.0,
        "Salmon abundance": 0.0,
        "Distributional equity": 0.0,
      },
      highlighted: highlightBaseline,
    })

    // Generate additional scenarios with varied data
    const scenarioNames = [
      "SGMA San Joaquin Valley",
      "SGMA Sacramento Valley",
      "SGMA Delta",
      "SGMA Tulare Basin",
      "Delta Conveyance Tunnel",
      "Delta Conveyance Dual",
      "Sites Reservoir",
      "Temperance Flat",
      "USBR Alternative 1",
      "USBR Alternative 2",
      "USBR Alternative 3",
      "USBR Alternative 4",
      "Urban Conservation High",
      "Urban Conservation Medium",
      "Agricultural Efficiency",
      "Recycled Water Expansion",
      "Desalination Coastal",
      "Atmospheric River Management",
      "Floodplain Restoration",
      "Wetlands Enhancement",
      "Fish Passage Improvement",
      "Climate Adaptation A",
      "Climate Adaptation B",
      "Drought Contingency",
      "Flexible Operations",
      "Coordinated Operations",
      "Ecosystem Services",
      "Water Trading Enhanced",
      "Regional Cooperation",
    ]

    scenarioNames.forEach((name, index) => {
      // Create varied but realistic data patterns
      const baseVariation = (index + 1) / 29 // 0 to 1 progression
      const randomSeed = index * 7 // Consistent randomization

      scenarios.push({
        id: `scenario-${index + 1}`,
        name: name,
        values: {
          "Community deliveries":
            Math.sin(baseVariation * Math.PI * 2 + randomSeed) * 0.8,
          "Agricultural deliveries":
            Math.cos(baseVariation * Math.PI * 1.5 + randomSeed) * 0.9,
          "Environmental deliveries":
            Math.sin(baseVariation * Math.PI * 3 + randomSeed + 1) * 0.7,
          "Reservoir storage":
            Math.cos(baseVariation * Math.PI * 2.5 + randomSeed + 2) * 0.6,
          "Groundwater storage":
            Math.sin(baseVariation * Math.PI * 1.8 + randomSeed + 3) * 0.9,
          "Delta salinity":
            Math.cos(baseVariation * Math.PI * 2.2 + randomSeed + 4) * 0.5,
          "Salmon abundance":
            Math.sin(baseVariation * Math.PI * 2.8 + randomSeed + 5) * 0.8,
          "Distributional equity":
            Math.cos(baseVariation * Math.PI * 1.6 + randomSeed + 6) * 0.6,
        },
      })
    })

    return scenarios
  }

  const sampleData = generateScenarios()

  // Generate colors using d3's categorical10 palette
  const generateCategoricalColors = (count: number): string[] => {
    const categorical10 = [
      "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
      "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    ]

    const colors: string[] = []
    for (let i = 0; i < count; i++) {
      colors.push(categorical10[i % 10]!)
    }

    return colors
  }

  const categoricalColors = generateCategoricalColors(30)

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
              {/* Two column layout */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
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
                      color: (theme) => theme.palette.blue.darkest,
                      fontFamily:
                        '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      fontWeight: 500,
                      fontSize: "1.5rem",
                      lineHeight: 1.3,
                      mb: 2,
                    }}
                  >
                    Current Operations
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      color: (theme) => theme.palette.blue.darkest,
                      fontFamily: (theme) => theme.typography.fontFamily,
                      fontSize: "1rem",
                      lineHeight: 1.6,
                    }}
                  >
                    <Box component="ul" sx={{ margin: 0, paddingLeft: "20px" }}>
                      <Box
                        component="li"
                        sx={{
                          fontSize: "0.95rem",
                          fontWeight: 400,
                          lineHeight: 1.4,
                          marginBottom: "4px",
                          color: "inherit",
                        }}
                      >
                        helps us understand how California manages water today
                      </Box>
                      <Box
                        component="li"
                        sx={{
                          fontSize: "0.95rem",
                          fontWeight: 400,
                          lineHeight: 1.4,
                          marginBottom: "4px",
                          color: "inherit",
                        }}
                      >
                        serves as a foundation to compare alternative scenarios
                      </Box>
                    </Box>
                  </Box>

                  {/* HR separator */}
                  <Box
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: (theme) => theme.palette.grey[200],
                      opacity: 0.6,
                      my: 2.5,
                      mb: 2.5,
                    }}
                  />
                </Box>
              )}

              {/* Scenario Snapshot Section */}
              {!isFirstCardMinimized && (
                <Box sx={{ flexShrink: 0, pb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          color: (theme) => theme.palette.blue.darkest,
                          fontFamily: (theme) => theme.typography.fontFamily,
                          fontWeight: 500,
                          fontSize: "1.1rem",
                          mb: 0.5,
                        }}
                      >
                        Scenario snapshot
                      </Box>
                      <Box
                        sx={{
                          color: (theme) => theme.palette.text.secondary,
                          fontFamily: (theme) => theme.typography.fontFamily,
                          fontSize: "0.875rem",
                          lineHeight: 1.4,
                        }}
                      >
                        Hover over a distribution to view on map.
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        ml: "auto",
                      }}
                    >
                      <Box
                        sx={{
                          color: (theme) => theme.palette.text.secondary,
                          fontFamily: (theme) => theme.typography.fontFamily,
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Choose chart type
                      </Box>
                      <Dropdown
                        variant="compact"
                        value={chartType}
                        onChange={(e) =>
                          setChartType(
                            e.target.value as "rose" | "bar" | "stick",
                          )
                        }
                        options={[
                          { value: "rose", label: "rose" },
                          { value: "bar", label: "bar" },
                          { value: "stick", label: "stick" },
                        ]}
                      />
                    </Box>
                  </Box>

                  {/* Grid layout: outcomes with charts */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
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
                        }}
                      >
                        {/* ChartType based on dropdown selection */}
                        {chartType === "rose" && <RoseChart size={60} />}
                        {chartType === "bar" && <BarChart size={60} />}
                        {chartType === "stick" && <StickChart size={60} />}

                        {/* Outcome label */}
                        <Box
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 400,
                            lineHeight: 1.3,
                            color: (theme) => theme.palette.text.secondary,
                            textAlign: "center",
                            maxWidth: "80px",
                          }}
                        >
                          {outcome}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* COMMENTED OUT - Will use later */}
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
                      fontSize: "0.95rem",
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
                        fontSize: "0.95rem",
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



        {/* Right Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", minWidth: 0 }}>
          {/* Dynamic Scenario Panel */}
          <Box sx={{ position: "relative" }}>
            <ScenarioCard
              topLine={isThirdCardMinimized ? "" : "ALTERNATIVE SCENARIO & REGION"}
              headline={"Choose an alternative scenario or region"}
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
                    }}
                  >
                    {/* Mode Selection Tabs */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "baseline",
                        mb: 2,
                        flexShrink: 0,
                      }}
                    >
                      <Tabs
                        value={previewPanelTab}
                        onChange={(_, value) => onPreviewTabChange(value)}
                        sx={{ flex: 1 }}
                      >
                        <Tab label="Select scenarios" />
                        <Tab label="Select regions" />
                        <Tab label="Selection history" />
                      </Tabs>
                    </Box>

                    {/* Tab Content */}
                    <Box
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Select Scenarios Tab */}
                      {previewPanelTab === 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            width: "100%",
                            minWidth: 0,
                            flexGrow: 1,
                            p: 2,
                          }}
                        >
                          {/* Outcomes paragraph, visible when chart not expanded */}
                          {!expandChart && (
                            <Box sx={{ flexShrink: 0 }}>
                              <Box
                                sx={{
                                  fontSize: "0.95rem",
                                  fontWeight: 400,
                                  lineHeight: 1.4,
                                  color: (theme) => theme.palette.text.primary,
                                  mb: 1,
                                }}
                              >
                                Compare scenarios across multiple outcomes to understand trade-offs
                                and synergies in California&apos;s water management.{" "}
                                <Box
                                  component="span"
                                  onClick={handleLearnMoreClick}
                                  sx={{
                                    color: (theme) => theme.palette.blue.bright,
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
                                  fontSize: "0.95rem",
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
                              key={`chart-${expandChart ? "expanded" : "normal"}`}
                              data={sampleData}
                              axes={axes}
                              responsive={true}
                              showBaseline={highlightBaseline}
                              baselineData={sampleData.find((d) => d.id === "baseline")}
                              colors={{
                                default: "#1f77b4",
                                highlighted: "#ff7f0e",
                                background: "#f8f9fa",
                              }}
                              lineColors={categoricalColors}
                              onLineHover={handleLineHover}
                              onLineClick={handleLineClick}
                            />
                          </Box>
                        </Box>
                      )}

                      {/* Select Regions Tab */}
                      {previewPanelTab === 1 && (
                        <Box sx={{ p: 2 }}>
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
                                fontSize: "0.95rem",
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
                                  transform: showRegionDropdown ? "rotate(180deg)" : "rotate(0deg)",
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
                                    checked={
                                      isDrawingCustomRegion || polygonPoints.length > 0
                                    }
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
                      )}

                      {/* Selection History Tab */}
                      {previewPanelTab === 2 && (
                        <Box sx={{ p: 2 }}>
                          {/* Selected Region */}
                          <Box
                            sx={{
                              mb: 3,
                              p: 2,
                              backgroundColor: (theme) =>
                                theme.palette.grey[50],
                              borderRadius: (theme) =>
                                theme.borderRadius.rounded,
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
                                    borderRadius: (theme) =>
                                      theme.borderRadius.rounded,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Box sx={{ fontSize: "0.85rem" }}>
                                    {scenario}
                                  </Box>
                                  <Box
                                    sx={{
                                      cursor: "pointer",
                                      color: (theme) =>
                                        theme.palette.text.secondary,
                                      "&:hover": {
                                        color: (theme) =>
                                          theme.palette.error.main,
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
                      )}
                    </Box>

                    {/* Compare Button at bottom */}
                    <Box sx={{ p: 2, pt: 0, flexShrink: 0 }}>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor:
                            selectedScenarios.length > 0
                              ? (theme) => theme.palette.blue.bright
                              : (theme) => theme.palette.grey[200],
                          color:
                            selectedScenarios.length > 0
                              ? "white"
                              : (theme) => theme.palette.text.disabled,
                          borderRadius: (theme) => theme.borderRadius.card,
                          textAlign: "center",
                          cursor:
                            selectedScenarios.length > 0
                              ? "pointer"
                              : "not-allowed",
                          transition: "all 0.2s ease",
                          "&:hover":
                            selectedScenarios.length > 0
                              ? {
                                  backgroundColor: (theme) =>
                                    theme.palette.blue.dark,
                                }
                              : {},
                        }}
                        onClick={() => {
                          if (selectedScenarios.length > 0) {
                            console.log(
                              "Navigate to exploration view with:",
                              selectedScenarios,
                              selectedRegion,
                            )
                          }
                        }}
                      >
                        <Box sx={{ fontSize: "0.95rem", fontWeight: 500 }}>
                          Explore scenarios in depth
                        </Box>
                        {selectedScenarios.length > 0 ? (
                          <Box
                            sx={{ fontSize: "0.75rem", opacity: 0.9, mt: 0.5 }}
                          >
                            {selectedScenarios.length} scenario
                            {selectedScenarios.length > 1 ? "s" : ""} for{" "}
                            {selectedRegion}
                          </Box>
                        ) : (
                          <Box
                            sx={{ fontSize: "0.75rem", opacity: 0.7, mt: 0.5 }}
                          >
                            Select scenarios to explore
                          </Box>
                        )}
                      </Box>
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

          {/* Quick Actions at bottom */}
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
  const [previewPanelTab, setPreviewPanelTab] = useState(0) // 0: Snapshot, 1: Selected
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null)
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState("Central Valley")

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
  const handlePreviewTabChange = (tab: number) => {
    setPreviewPanelTab(tab)
  }

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

        {/* Custom map markers */}
        {/* Marker 1: Los Angeles area */}
        <Marker longitude={-118.2437} latitude={34.0522}>
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

        {/* Marker 2: Sacramento area */}
        <Marker longitude={-121.4944} latitude={38.5816}>
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

        {/* Marker 3: Central Valley (Fresno area) */}
        <Marker longitude={-119.7871} latitude={36.7378}>
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
                  backgroundColor: "#4CAF50", // Green for good status
                  border: "2px solid white",
                }}
              />
            </Box>
          </MapMarkerTooltip>
        </Marker>

        {/* Marker 4: Chico area */}
        <Marker longitude={-121.8375} latitude={39.7285}>
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
          polygonPoints.length > 0 ? (
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
                fontWeight: theme.mapPromptDialog.typography.action.fontWeight,
                textDecoration:
                  theme.mapPromptDialog.typography.action.textDecoration,
                "&:hover": {
                  color: theme.palette.blue.light,
                },
              })}
            >
              Redraw
            </Box>
          ) : undefined
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
        previewPanelTab={previewPanelTab}
        hoveredScenario={hoveredScenario}
        selectedScenarios={selectedScenarios}
        selectedRegion={selectedRegion}
        onPreviewTabChange={handlePreviewTabChange}
        onScenarioHover={handleScenarioHover}
        onScenarioSelect={handleScenarioSelect}
        onRegionSelect={handleRegionSelect}
      />
    </Box>
  )
}
