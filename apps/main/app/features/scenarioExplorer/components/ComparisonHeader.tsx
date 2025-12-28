"use client"

/**
 * ComparisonHeader - Header for scenario comparison view
 *
 * Displays scenario names with color indicators for comparison mode.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useComparisonData } from "../hooks/useComparisonData"

interface ComparisonHeaderProps {
  /** Currently highlighted scenario ID */
  highlightedScenario: string | null
  /** Callback when a scenario is clicked (for toggle) */
  onScenarioClick: (scenarioId: string) => void
}

/**
 * ComparisonHeader: Shows scenario comparison title and legend
 * Designed to sit in the right 50% of the search bar row, directly above the comparison chart
 */
export function ComparisonHeader({
  highlightedScenario,
  onScenarioClick,
}: ComparisonHeaderProps) {
  const theme = useTheme()
  const {
    data: comparisonData,
    lineColors,
    isLoading,
    hasData,
  } = useComparisonData()

  if (isLoading || !hasData) {
    return null
  }

  return (
    <Box
      sx={{
        px: theme.spacingTokens.component.lg,
        pt: theme.spacingTokens.component.lg,
        pb: theme.spacingTokens.component.sm,
        backgroundColor: theme.palette.background.paper,
        borderBottom: theme.border.medium,
        height: "100%",
      }}
    >
      {/* Title and instructions inline */}
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: theme.spacingTokens.gap.md,
          mb: theme.spacingTokens.component.sm,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="subtitle2">Scenario Comparison</Typography>
        <Typography variant="caption" sx={{ color: theme.palette.grey[600] }}>
          Use draggable arrows on axes to filter scenarios
        </Typography>
      </Box>

      {/* Scenario legend */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacingTokens.gap.sm,
        }}
      >
        {comparisonData.map((scenario, index) => {
          const isHighlighted = highlightedScenario === scenario.id
          return (
            <Box
              key={scenario.id}
              onClick={() => onScenarioClick(scenario.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacingTokens.gap.xs,
                cursor: "pointer",
                px: theme.spacingTokens.component.sm,
                py: theme.spacingTokens.component.xs,
                borderRadius: theme.borderRadius.xs,
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
                  borderRadius: theme.borderRadius.xs,
                }}
              />
              <Typography
                variant="nav"
                sx={{
                  fontWeight: isHighlighted
                    ? theme.typography.fontWeightSemiBold
                    : theme.typography.fontWeightRegular,
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
