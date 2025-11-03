"use client"

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import StrategyGrid from "../../../components/StrategyGrid"
import { useScenarioData } from "../../../hooks/useScenarioData"

interface ScenarioPanelProps {
  onTierClick: (strategy: string, outcome: string) => void
}

/**
 * ScenarioPanel for MapView
 * Shows scrollable list of scenarios with clickable outcome charts
 */
export default function ScenarioPanel({ onTierClick }: ScenarioPanelProps) {
  const theme = useTheme()
  const { getChartDataForStrategy, outcomeNames, isLoading, error } =
    useScenarioData()

  if (isLoading) {
    return (
      <Box sx={{ p: theme.spacing(3) }}>Loading scenarios...</Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: theme.spacing(3), color: theme.palette.error.main }}>
        Error: {error}
      </Box>
    )
  }

  return (
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
        onOutcomeSelect={() => {}}
        onTierClick={onTierClick}
      />
    </Box>
  )
}

