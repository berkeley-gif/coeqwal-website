"use client"

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import StrategyGrid from "../../../components/StrategyGrid"
import { useScenarioData } from "../../../hooks/useScenarioData"
import { useExploreUserWorkflowStore } from "@repo/state"

interface ScenarioPanelProps {
  onTierClick: (strategy: string, outcome: string) => void
}

/**
 * ScenarioPanel for MapView
 * Shows scrollable list of scenarios with clickable outcome charts
 * Uses the old useExploreUserWorkflowStore for state management
 */
export default function ScenarioPanel({ onTierClick }: ScenarioPanelProps) {
  const theme = useTheme()
  const { getChartDataForStrategy, outcomeNames, isLoading, error } =
    useScenarioData()

  // Get state from the workflow store
  const {
    explore: {
      showMapView,
      showOnlyChosen,
      showDefinitions,
      chosenStrategies,
      selectedOutcomes,
    },
    setMapView,
    setShowOnlyChosen,
    setShowDefinitions,
    toggleStrategyChoice,
  } = useExploreUserWorkflowStore()

  if (isLoading) {
    return <Box sx={{ p: theme.spacing(3) }}>Loading scenarios...</Box>
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
        onOutcomeSelect={() => {}} // Not used in map view
        onTierClick={onTierClick}
        onToggleScenario={toggleStrategyChoice}
        selectedScenarios={chosenStrategies}
        selectedOutcomes={selectedOutcomes}
        showMapView={showMapView}
        showOnlyChosen={showOnlyChosen}
        showDefinitions={showDefinitions}
        onMapViewChange={setMapView}
        onShowOnlyChosenChange={setShowOnlyChosen}
        onShowDefinitionsChange={setShowDefinitions}
      />
    </Box>
  )
}
