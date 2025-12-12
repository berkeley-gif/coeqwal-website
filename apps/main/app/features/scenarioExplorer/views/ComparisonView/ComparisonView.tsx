"use client"

import React, { useState, useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { VerticalParallelLinePlot } from "@repo/viz"
import { useComparisonData } from "./useComparisonData"
import ScenarioPanel from "../MapView/components/ScenarioPanel"

/**
 * ComparisonView: Visual comparison matrix of scenarios
 * Uses VerticalParallelLinePlot to compare all three scenarios across outcomes
 * Shows relative performance with interactive parallel coordinates and brushing
 */
export default function ComparisonView() {
  const theme = useTheme()
  const { data, axes, lineColors, isLoading, error, hasData } =
    useComparisonData()

  // Track which scenario is highlighted (clicked)
  const [highlightedScenario, setHighlightedScenario] = useState<string | null>(
    null,
  )

  // Update data with highlighted state
  const highlightedData = useMemo(() => {
    return data.map((scenario) => ({
      ...scenario,
      highlighted: scenario.id === highlightedScenario,
    }))
  }, [data, highlightedScenario])

  // Toggle highlight on click
  const handleScenarioClick = (scenarioId: string) => {
    setHighlightedScenario((prev) => (prev === scenarioId ? null : scenarioId))
  }

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
          <Typography
            variant="body2"
            component="div"
            sx={{ color: theme.palette.grey[600], mb: 1 }}
          >
            Comparing {data.length} scenarios across key outcomes. Use the
            draggable arrows on each axis to filter scenarios by brushing
            specific outcome ranges.
          </Typography>
          {/* Scenario legend - clickable, organized in 3 columns */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              mt: 1,
            }}
          >
            {data.map((scenario, index) => {
              const isHighlighted = highlightedScenario === scenario.id
              return (
                <Box
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 1,
                    backgroundColor: isHighlighted
                      ? theme.palette.grey[100]
                      : "transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: theme.palette.grey[50],
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: isHighlighted ? 4 : 3,
                      backgroundColor: lineColors[index],
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: isHighlighted ? 600 : 400,
                      fontSize: "0.75rem",
                    }}
                  >
                    {scenario.name}
                  </Typography>
                </Box>
              )
            })}
          </Box>
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
              boxShadow: theme.boxShadows.subtle,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <VerticalParallelLinePlot
                data={highlightedData}
                axes={axes}
                responsive={true}
                showBaseline={false}
                colors={{
                  default: theme.palette.grey[600],
                  highlighted: theme.palette.blue.darkest,
                  background: theme.palette.grey[50],
                }}
                lineColors={lineColors}
                onLineClick={(scenario) => handleScenarioClick(scenario.id)}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
