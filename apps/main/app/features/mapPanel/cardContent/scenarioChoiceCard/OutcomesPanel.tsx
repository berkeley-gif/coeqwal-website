"use client"

import React, { useState } from "react"
import { Box, Button, FormControlLabel, Checkbox } from "@repo/ui/mui"
import { VerticalParallelLinePlot, VerticalParallelLineData } from "@repo/viz"

interface OutcomesPanelProps {
  onExpandChange?: (isExpanded: boolean) => void
}

export default function OutcomesPanel({ onExpandChange }: OutcomesPanelProps) {
  const [isRelativeView, setIsRelativeView] = useState(true)
  const [highlightBaseline, setHighlightBaseline] = useState(false)
  const [expandChart, setExpandChart] = useState(false)

  const handleViewModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsRelativeView(event.target.checked)
  }

  const handleHighlightBaselineChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setHighlightBaseline(event.target.checked)
  }

  const handleLearnMoreClick = () => {
    // TODO: Implement learn more functionality
    console.log("Learn more about this chart clicked")
  }

  const toggleExpandChart = () => {
    const newExpandedState = !expandChart
    setExpandChart(newExpandedState)
    onExpandChange?.(newExpandedState)
  }

  // Sample data for vertical parallel line plot
  // TODO: Replace with real scenario data
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

  // Generate 30 diverse scenarios with gnuplot color ramp
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

    // Generate 29 additional scenarios with varied data
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

  // Generate colors using d3's categorical10 palette, cycling through for 30 scenarios
  const generateCategoricalColors = (count: number): string[] => {
    // D3 categorical10 color scheme
    const categorical10 = [
      "#1f77b4", // blue
      "#ff7f0e", // orange
      "#2ca02c", // green
      "#d62728", // red
      "#9467bd", // purple
      "#8c564b", // brown
      "#e377c2", // pink
      "#7f7f7f", // gray
      "#bcbd22", // olive
      "#17becf", // cyan
    ]

    const colors: string[] = []
    for (let i = 0; i < count; i++) {
      // Cycle through the 10 colors for all 30 scenarios
      colors.push(categorical10[i % 10]!)
    }

    return colors
  }

  const categoricalColors = generateCategoricalColors(30)

  const handleLineHover = (data: VerticalParallelLineData | null) => {
    // TODO: Implement hover tooltip or highlighting
    console.log("Line hovered:", data?.name || "none")
  }

  const handleLineClick = (data: VerticalParallelLineData) => {
    // TODO: Implement scenario selection/preview
    console.log("Line clicked:", data.name)
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minWidth: 0,
        flexGrow: 1, // Always use all available space
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
          flexGrow: 1, // Always take all remaining space
          width: "100%",
          height: "100%", // Fill parent height
          minHeight: 0, // Allow shrinking
          maxHeight: "none", // No height restrictions
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <VerticalParallelLinePlot
          key={`chart-${expandChart ? "expanded" : "normal"}`} // Force re-render on state change
          data={sampleData}
          axes={axes}
          responsive={true}
          // Always fully responsive - no fixed height
          showBaseline={highlightBaseline}
          baselineData={sampleData.find((d) => d.id === "baseline")}
          colors={{
            default: "#1f77b4",
            highlighted: "#ff7f0e",
            background: "#f8f9fa",
          }}
          lineColors={categoricalColors} // Use D3 categorical10 color scheme
          onLineHover={handleLineHover}
          onLineClick={handleLineClick}
        />
      </Box>
    </Box>
  )
}
