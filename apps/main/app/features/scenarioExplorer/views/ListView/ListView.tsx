"use client"

import React from "react"
import { Box, Typography, useTheme, Button } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "@repo/state"
import SearchSortBar from "../../components/SearchSortBar"
import StrategyGrid from "../../components/StrategyGrid"
import { useScenarioData } from "../../hooks/useScenarioData"
import {
  STRATEGY_TO_SCENARIO_ID,
  getScenarioIdFromStrategy,
} from "../../../../constants/outcomeMappings"

/**
 * Convert strategy values to scenario IDs (using centralized mapping)
 */
const strategyToScenarioId = (strategyValue: string): string => {
  return getScenarioIdFromStrategy(strategyValue)
}

/**
 * Convert scenario IDs back to strategy values for display (reverse lookup)
 */
const scenarioIdToStrategy = (scenarioId: string): string => {
  // Find the key where the value matches the scenarioId
  const entry = Object.entries(STRATEGY_TO_SCENARIO_ID).find(
    ([, id]) => id === scenarioId,
  )
  return entry ? entry[0] : scenarioId
}

/**
 * Get friendly display name for scenario
 */
const getScenarioDisplayName = (scenarioId: string): string => {
  const names: Record<string, string> = {
    s0020: "Current operations",
    s0021: "Current ops without TUCPs",
    s0011: "Current ops with historical ag",
  }
  return names[scenarioId] || scenarioId
}

/**
 * ListView: Full list of COEQWAL scenarios with searching and sorting
 * Shows all scenarios in a grid/table format with outcome summaries
 */
export default function ListView() {
  const theme = useTheme()
  const { getChartDataForStrategy, outcomeNames, isLoading, error } =
    useScenarioData()

  // Get all state from the scenario explorer store
  const {
    selectedScenarios,
    toggleScenario,
    clearScenarios,
    showOnlyChosen,
    showDefinitions,
    setShowOnlyChosen,
    setShowDefinitions,
  } = useScenarioExplorerStore()

  // Convert scenario IDs to strategy values for StrategyGrid
  const selectedStrategies = selectedScenarios.map(scenarioIdToStrategy)

  // Wrap toggleScenario to convert strategy value to scenario ID
  const handleToggleScenario = (strategyValue: string) => {
    const scenarioId = strategyToScenarioId(strategyValue)
    toggleScenario(scenarioId)
  }

  // Track selected outcomes per strategy (local state for now)
  const [localSelectedOutcomes, setLocalSelectedOutcomes] = React.useState<
    Record<string, string>
  >({})

  const handleOutcomeSelect = (strategyValue: string, outcome: string) => {
    setLocalSelectedOutcomes((prev) => ({
      ...prev,
      [strategyValue]: outcome,
    }))
  }

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
      {/* Selection count and list */}
      {selectedScenarios.length > 0 && (
        <Box
          sx={{
            backgroundColor: theme.palette.blue.darkest,
            color: theme.palette.common.white,
          }}
        >
          {/* Count and Clear All */}
          <Box
            sx={{
              px: theme.spacing(theme.cards.spacing.standard),
              pt: theme.spacing(1.5),
              pb: theme.spacing(1),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: theme.typography.fontWeightMedium }}
            >
              {selectedScenarios.length} scenario
              {selectedScenarios.length !== 1 ? "s" : ""} selected
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={clearScenarios}
              sx={{
                color: theme.palette.common.white,
                textTransform: "none",
                fontSize: theme.typography.compact.subtitle.fontSize,
                minWidth: "auto",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Clear all
            </Button>
          </Box>

          {/* List of selected scenarios */}
          <Box
            sx={{
              px: theme.spacing(theme.cards.spacing.standard),
              pb: theme.spacing(1.5),
              display: "flex",
              flexWrap: "wrap",
              gap: theme.spacing(1),
            }}
          >
            {selectedScenarios.map((scenarioId) => (
              <Typography
                key={scenarioId}
                variant="body2"
                sx={{
                  px: theme.spacing(1.5),
                  py: theme.spacing(0.5),
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: theme.borderRadius.pill,
                  fontSize: theme.typography.compact.subtitle.fontSize,
                }}
              >
                {getScenarioDisplayName(scenarioId)}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

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
          onOutcomeSelect={handleOutcomeSelect}
          onToggleScenario={handleToggleScenario}
          selectedScenarios={selectedStrategies}
          selectedOutcomes={localSelectedOutcomes}
          showMapView={false} // List view doesn't show map mode
          showOnlyChosen={showOnlyChosen}
          showDefinitions={showDefinitions}
          onMapViewChange={() => {}} // No-op in list view
          onShowOnlyChosenChange={setShowOnlyChosen}
          onShowDefinitionsChange={setShowDefinitions}
        />
      </Box>
    </Box>
  )
}
