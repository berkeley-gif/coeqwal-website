"use client"

import React, { useState } from "react"
import {
  Box,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
} from "@repo/ui/mui"
import { VerticalParallelLinePlot, VerticalParallelLineData } from "@repo/viz"

export default function OutcomesPanel() {
  const [isRelativeView, setIsRelativeView] = useState(true)
  const [highlightBaseline, setHighlightBaseline] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

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

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions)
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
    "Distributional equity"
  ]

  const sampleData: VerticalParallelLineData[] = [
    {
      id: "baseline",
      name: "Current Operations",
      values: {
        "Community deliveries": 85,
        "Agricultural deliveries": 70,
        "Environmental deliveries": 45,
        "Reservoir storage": 60,
        "Groundwater storage": 40,
        "Delta salinity": 25,
        "Salmon abundance": 35,
        "Distributional equity": 65
      },
      highlighted: highlightBaseline
    },
    {
      id: "sgma-1",
      name: "SGMA San Joaquin Valley",
      values: {
        "Community deliveries": 80,
        "Agricultural deliveries": 55,
        "Environmental deliveries": 60,
        "Reservoir storage": 65,
        "Groundwater storage": 75,
        "Delta salinity": 30,
        "Salmon abundance": 50,
        "Distributional equity": 70
      }
    },
    {
      id: "sgma-2", 
      name: "SGMA with Ag Reductions",
      values: {
        "Community deliveries": 85,
        "Agricultural deliveries": 45,
        "Environmental deliveries": 70,
        "Reservoir storage": 70,
        "Groundwater storage": 85,
        "Delta salinity": 35,
        "Salmon abundance": 65,
        "Distributional equity": 60
      }
    },
    {
      id: "delta-tunnel",
      name: "Delta Conveyance Tunnel", 
      values: {
        "Community deliveries": 90,
        "Agricultural deliveries": 75,
        "Environmental deliveries": 55,
        "Reservoir storage": 45,
        "Groundwater storage": 60,
        "Delta salinity": 45,
        "Salmon abundance": 40,
        "Distributional equity": 80
      }
    },
    {
      id: "usbr-alt3",
      name: "USBR Alternative 3",
      values: {
        "Community deliveries": 75,
        "Agricultural deliveries": 80,
        "Environmental deliveries": 75,
        "Reservoir storage": 80,
        "Groundwater storage": 55,
        "Delta salinity": 40,
        "Salmon abundance": 70,
        "Distributional equity": 85
      }
    }
  ]

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
        height: "100%", // Take full height of parent container
      }}
    >
      {/* Collapsible instructions section */}
      <Box sx={{ mb: 3 }}>
        {/* Toggle button for instructions */}
        <Button
          variant="text"
          onClick={toggleInstructions}
          sx={{
            fontSize: "0.95rem",
            fontWeight: 500,
            color: (theme) => theme.palette.blue.bright,
            padding: 0,
            minWidth: "auto",
            textTransform: "none",
            mb: showInstructions ? 2 : 0,
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
              transform: showInstructions ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            ▼
          </span>
          {showInstructions ? "Hide" : "Show"} instructions
        </Button>

        {/* Collapsible instructions content */}
        {showInstructions && (
          <Box
            sx={{
              fontSize: "0.95rem",
              fontWeight: 400,
              color: (theme) => theme.palette.text.primary,
              animation: "fadeIn 0.2s ease-in",
              "@keyframes fadeIn": {
                from: { opacity: 0, transform: "translateY(-10px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            COEQWAL has <strong>___</strong> alternative scenarios. Each colored
            dot represents a scenario placed by its outcome. Click on a dot to
            preview that scenario. Slide the sliders on each outcome to isolate
            scenarios meeting your requirements.{" "}
            <Button
              variant="text"
              onClick={handleLearnMoreClick}
              sx={{
                textDecoration: "underline",
                color: (theme) => theme.palette.blue.bright,
                cursor: "pointer",
                padding: 0,
                minWidth: "auto",
                fontSize: "0.95rem", // Match paragraph fontSize
                fontWeight: 500,
                textTransform: "none",
                verticalAlign: "baseline", // Align with text baseline
                "&:hover": {
                  color: (theme) => theme.palette.blue.darkest,
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
              }}
            >
              Learn more about this chart
            </Button>
            .
          </Box>
        )}
      </Box>

      {/* Two equal columns for interface elements */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          mb: 4,
        }}
      >
        {/* Left Column - Checkbox */}
        <Box>
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
        </Box>

        {/* Right Column - Checkbox */}
        <Box>
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

      {/* Parallel Coordinates Visualization */}
      <Box
        sx={{
          flexGrow: 1, // Take up remaining vertical space
          minHeight: "200px", // Minimum height for usability
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <VerticalParallelLinePlot
          data={sampleData}
          axes={axes}
          responsive={true}
          // Remove fixed width/height - let it be fully responsive
          showBaseline={highlightBaseline}
          baselineData={sampleData.find(d => d.id === "baseline")}
          colors={{
            default: "#1f77b4",
            highlighted: "#ff7f0e", 
            background: "#f8f9fa"
          }}
          onLineHover={handleLineHover}
          onLineClick={handleLineClick}
        />
      </Box>
    </Box>
  )
}
