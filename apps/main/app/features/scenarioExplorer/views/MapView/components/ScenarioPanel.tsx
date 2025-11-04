"use client"

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import StrategyGrid from "../../../components/StrategyGrid"
import { useScenarioData } from "../../../hooks/useScenarioData"
import { useScenarioExplorerStore } from "@repo/state"

interface ScenarioPanelProps {
  onTierClick: (strategy: string, outcome: string) => void
}

/**
 * Convert strategy values to scenario IDs
 * Strategy values: "current-ops", "current-ops-wo-tucp", "current-ops-historical-ag"
 * Scenario IDs: "s0020", "s0021", "s0011"
 */
const strategyToScenarioId = (strategyValue: string): string => {
  const mapping: Record<string, string> = {
    "current-ops": "s0020",
    "current-ops-wo-tucp": "s0021",
    "current-ops-historical-ag": "s0011",
  }
  return mapping[strategyValue] || strategyValue
}

/**
 * Convert scenario IDs back to strategy values for display
 */
const scenarioIdToStrategy = (scenarioId: string): string => {
  const mapping: Record<string, string> = {
    s0020: "current-ops",
    s0021: "current-ops-wo-tucp",
    s0011: "current-ops-historical-ag",
  }
  return mapping[scenarioId] || scenarioId
}

/**
 * ScenarioPanel for MapView
 * Shows scrollable list of scenarios with clickable outcome charts
 * Now uses the new useScenarioExplorerStore for consistent state across all views
 */
export default function ScenarioPanel({ onTierClick }: ScenarioPanelProps) {
  const theme = useTheme()
  const { getChartDataForStrategy, outcomeNames, isLoading, error } =
    useScenarioData()

  // Get state from the scenario explorer store
  const {
    selectedScenarios,
    toggleScenario,
    showOnlyChosen,
    showDefinitions,
    setShowOnlyChosen,
    setShowDefinitions,
  } = useScenarioExplorerStore()

  // Map view uses expanded layout (not compact)
  const [showMapView, setShowMapView] = React.useState(false)

  // Local state for selected outcomes (per-strategy)
  const [localSelectedOutcomes, setLocalSelectedOutcomes] = React.useState<
    Record<string, string>
  >({})

  // Convert scenario IDs to strategy values for StrategyGrid
  const selectedStrategies = selectedScenarios.map(scenarioIdToStrategy)

  // Wrap toggleScenario to convert strategy value to scenario ID
  const handleToggleScenario = (strategyValue: string) => {
    const scenarioId = strategyToScenarioId(strategyValue)
    toggleScenario(scenarioId)
  }

  // Handle outcome selection for local state
  const handleOutcomeSelect = (strategyValue: string, outcome: string) => {
    setLocalSelectedOutcomes((prev) => ({
      ...prev,
      [strategyValue]: outcome,
    }))
  }

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
        onOutcomeSelect={handleOutcomeSelect}
        onTierClick={onTierClick}
        onToggleScenario={handleToggleScenario}
        selectedScenarios={selectedStrategies}
        selectedOutcomes={localSelectedOutcomes}
        showMapView={showMapView}
        showOnlyChosen={showOnlyChosen}
        showDefinitions={showDefinitions}
        onMapViewChange={setShowMapView}
        onShowOnlyChosenChange={setShowOnlyChosen}
        onShowDefinitionsChange={setShowDefinitions}
      />
    </Box>
  )
}
