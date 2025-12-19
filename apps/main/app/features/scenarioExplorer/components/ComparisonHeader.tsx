"use client"

import React, { useState, useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useComparisonData } from "../views/ComparisonView/useComparisonData"

/**
 * ComparisonHeader: Shows scenario comparison title and legend
 * Designed to sit in the right 50% of the search bar row, directly above the comparison chart
 */
export function ComparisonHeader() {
  const theme = useTheme()
  const { data: comparisonData, lineColors, isLoading, hasData } =
    useComparisonData()

  // Track highlighted scenario in comparison
  const [highlightedScenario, setHighlightedScenario] = useState<string | null>(
    null,
  )

  const handleScenarioClick = (scenarioId: string) => {
    setHighlightedScenario((prev) => (prev === scenarioId ? null : scenarioId))
  }

  if (isLoading || !hasData) {
    return null
  }

  return (
    <Box
      sx={{
        px: theme.spacing(2),
        pt: theme.spacing(2),
        pb: theme.spacing(1),
        backgroundColor: theme.palette.common.white,
        borderBottom: theme.border.standard,
        borderColor: theme.palette.grey[300],
        height: "100%",
      }}
    >
      {/* Title and instructions inline */}
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: 1.5,
          mb: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: theme.typography.fontWeightMedium,
          }}
        >
          Scenario Comparison
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.grey[600] }}
        >
          — Use draggable arrows on axes to filter scenarios
        </Typography>
      </Box>

      {/* Scenario legend */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {comparisonData.map((scenario, index) => {
          const isHighlighted = highlightedScenario === scenario.id
          return (
            <Box
              key={scenario.id}
              onClick={() => handleScenarioClick(scenario.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                backgroundColor: isHighlighted
                  ? theme.palette.grey[100]
                  : "transparent",
                "&:hover": {
                  backgroundColor: theme.palette.grey[50],
                },
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: isHighlighted ? 4 : 3,
                  backgroundColor: lineColors[index],
                  borderRadius: 0.5,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isHighlighted ? 600 : 400,
                  fontSize: theme.typography.nav.fontSize,
                }}
              >
                {scenario.name}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default ComparisonHeader
