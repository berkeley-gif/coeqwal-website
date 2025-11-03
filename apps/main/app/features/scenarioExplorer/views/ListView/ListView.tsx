"use client"

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import SearchSortBar from "../../components/SearchSortBar"
import StrategyGrid from "../../components/StrategyGrid"
import { useScenarioData } from "../../hooks/useScenarioData"

/**
 * ListView: Full list of COEQWAL scenarios with searching and sorting
 * Shows all scenarios in a grid/table format with outcome summaries
 */
export default function ListView() {
  const theme = useTheme()
  const { getChartDataForStrategy, outcomeNames, isLoading, error } =
    useScenarioData()

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          p: theme.spacing(3),
        }}
      >
        <Typography>Loading scenarios...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: theme.spacing(3) }}>
        <Typography color="error">Error loading data: {error}</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      {/* Search and Sort */}
      <SearchSortBar placeholder="Search scenarios by name or description..." />

      {/* Scenarios Grid */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: theme.spacing(theme.cards.spacing.standard),
        }}
      >
        <StrategyGrid
          getChartDataForStrategy={getChartDataForStrategy}
          outcomeNames={outcomeNames || []}
          onOutcomeSelect={() => {
            // TODO: Implement outcome selection
          }}
        />
      </Box>
    </Box>
  )
}

