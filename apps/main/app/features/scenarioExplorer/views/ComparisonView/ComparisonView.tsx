"use client"

import React, { useState } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { VerticalParallelLinePlot } from "@repo/viz"
import { useComparisonData } from "./useComparisonData"
import type { VerticalParallelLineData } from "@repo/viz"
import SearchSortBar from "../../components/SearchSortBar"
import ScenarioPanel from "../MapView/components/ScenarioPanel"

/**
 * ComparisonView: Visual comparison matrix of scenarios
 * Uses VerticalParallelLinePlot to compare all three scenarios across outcomes
 * Shows relative performance with interactive parallel coordinates and brushing
 */
export default function ComparisonView() {
  const theme = useTheme()
  const { data, axes, isLoading, error, hasData } = useComparisonData()
  const [hoveredScenario, setHoveredScenario] =
    useState<VerticalParallelLineData | null>(null)

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          backgroundColor: theme.palette.grey[100],
        }}
      >
        <CircularProgress size={48} />
        <Typography
          variant="body1"
          sx={{ mt: theme.spacing(2), color: theme.palette.grey[600] }}
        >
          Loading scenario comparison data...
        </Typography>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          backgroundColor: theme.palette.grey[100],
          p: theme.spacing(4),
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: theme.spacing(2), color: theme.palette.accent.alert }}
        >
          Failed to load comparison data
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
          {error}
        </Typography>
      </Box>
    )
  }

  // Empty state (no data)
  if (!hasData) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          backgroundColor: theme.palette.grey[100],
          p: theme.spacing(4),
        }}
      >
        <Typography variant="body1" sx={{ color: theme.palette.grey[600] }}>
          No scenario data available for comparison.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      {/* Left Panel: Scenario List */}
      <Box
        sx={{
          width: "45%",
          display: "flex",
          flexDirection: "column",
          borderRight: theme.border.standard,
          borderColor: theme.palette.grey[300],
          backgroundColor: theme.palette.common.white,
        }}
      >
        <SearchSortBar placeholder="Search scenarios..." showReset={false} />
        <ScenarioPanel onTierClick={() => {}} />
      </Box>

      {/* Right panel: Comparison chart */}
      <Box
        sx={{
          width: "55%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: theme.spacing(3),
            pt: theme.spacing(3),
            pb: theme.spacing(2),
            backgroundColor: theme.palette.common.white,
            borderBottom: theme.border.standard,
            borderColor: theme.palette.grey[300],
            flexShrink: 0,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Scenario comparison
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
            Use the draggable arrows on each axis to filter scenarios by
            brushing specific outcome ranges.
            {hoveredScenario && (
              <Typography
                component="span"
                sx={{
                  ml: 2,
                  fontWeight: 600,
                  color: theme.palette.blue.darkest,
                }}
              >
                Hovering: {hoveredScenario.name}
              </Typography>
            )}
          </Typography>
        </Box>

        {/* Chart container */}
        <Box
          sx={{
            flex: 1,
            p: theme.spacing(3),
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              flex: 1,
              backgroundColor: theme.palette.common.white,
              borderRadius: theme.borderRadius.rounded,
              padding: theme.spacing(2),
              boxShadow: theme.shadow.subtle,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <VerticalParallelLinePlot
                data={data}
                axes={axes}
                responsive={true}
                showBaseline={true}
                baselineData={data.find((d) => d.id === "s0020")}
                onLineHover={(scenario) => setHoveredScenario(scenario)}
                colors={{
                  default: theme.palette.blue.bright,
                  highlighted: "#ff7f0e", // Orange for baseline
                  background: theme.palette.grey[50],
                }}
                lineColors={[
                  "#ff7f0e", // s0020 - orange (baseline)
                  theme.palette.blue.bright, // s0021 - blue
                  "#2ca02c", // s0011 - green
                ]}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
