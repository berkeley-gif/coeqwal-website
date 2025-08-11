"use client"

import React, { useState } from "react"
import { Box, Button, FormControlLabel, Checkbox } from "@repo/ui/mui"
import { VerticalParallelLinePlot, VerticalParallelLineData } from "@repo/viz"

interface OutcomesPanelProps {
  onExpandChart?: (expanded: boolean) => void
  isExpanded?: boolean // Whether the panel is in expanded mode
}

export default function OutcomesPanel({ 
  onExpandChart, 
  isExpanded = false 
}: OutcomesPanelProps) {
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
    const newExpandState = !expandChart
    setExpandChart(newExpandState)
    onExpandChart?.(newExpandState)
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

  const sampleData: VerticalParallelLineData[] = [
    {
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
    },
    {
      id: "sgma-1",
      name: "SGMA San Joaquin Valley",
      values: {
        "Community deliveries": -0.1,
        "Agricultural deliveries": -0.3,
        "Environmental deliveries": 0.3,
        "Reservoir storage": 0.1,
        "Groundwater storage": 0.7,
        "Delta salinity": 0.1,
        "Salmon abundance": 0.3,
        "Distributional equity": 0.1,
      },
    },
    {
      id: "sgma-2",
      name: "SGMA with Ag Reductions",
      values: {
        "Community deliveries": 0.0,
        "Agricultural deliveries": -0.5,
        "Environmental deliveries": 0.5,
        "Reservoir storage": 0.2,
        "Groundwater storage": 0.9,
        "Delta salinity": 0.2,
        "Salmon abundance": 0.6,
        "Distributional equity": -0.1,
      },
    },
    {
      id: "delta-tunnel",
      name: "Delta Conveyance Tunnel",
      values: {
        "Community deliveries": 0.1,
        "Agricultural deliveries": 0.1,
        "Environmental deliveries": 0.1,
        "Reservoir storage": -0.3,
        "Groundwater storage": 0.4,
        "Delta salinity": 0.4,
        "Salmon abundance": 0.1,
        "Distributional equity": 0.3,
      },
    },
    {
      id: "usbr-alt3",
      name: "USBR Alternative 3",
      values: {
        "Community deliveries": -0.2,
        "Agricultural deliveries": 0.2,
        "Environmental deliveries": 0.6,
        "Reservoir storage": 0.4,
        "Groundwater storage": 0.3,
        "Delta salinity": 0.3,
        "Salmon abundance": 0.7,
        "Distributional equity": 0.4,
      },
    },
  ]

  const handleLineHover = (data: VerticalParallelLineData | null) => {
    // TODO: Implement hover tooltip or highlighting
    console.log("Line hovered:", data?.name || "none")
  }

  const handleLineClick = (data: VerticalParallelLineData) => {
    // TODO: Implement scenario selection/preview
    console.log("Line clicked:", data.name)
  }

  // Chart always uses all available space - no more height calculations needed

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
      {/* Outcomes paragraph - visible when not expanded and chart not expanded */}
      {!isExpanded && !expandChart && (
        <Box sx={{ flexShrink: 0, mb: 2 }}>
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

      {/* Control Section - Always visible when not in external expanded mode */}
      {!isExpanded && (
        <Box sx={{ flexShrink: 0, mb: 1 }}>
          {/* Expand chart button - always visible when not externally expanded */}
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

        {/* Chart controls - only show when chart is not expanded */}
        {!expandChart && (
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
              label="view relative to current operations"
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
        )}
        </Box>
      )}

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
          key={`chart-${isExpanded ? 'expanded' : 'normal'}-${expandChart ? 'chart-expanded' : 'chart-normal'}`} // Force re-render on state change
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
          onLineHover={handleLineHover}
          onLineClick={handleLineClick}
        />
      </Box>
    </Box>
  )
}
