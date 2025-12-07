"use client"

import React, { useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "@repo/state"
import StrategyGrid from "../../components/StrategyGrid"
import { useScenarioData } from "../../hooks/useScenarioData"
import {
  STRATEGY_TO_SCENARIO_ID,
  getScenarioIdFromStrategy,
} from "../../../../constants/outcomeMappings"
import { strategies, strategyDefinitions } from "../../../../lib/scenarios"

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
    showOnlyChosen,
    showDefinitions,
    setShowOnlyChosen,
    setShowDefinitions,
    searchQuery,
  } = useScenarioExplorerStore()

  // Sort strategies based on search query - matches first, then non-matches
  const { sortedStrategies, matchingStrategyValues, hasSearchResults } =
    useMemo(() => {
      if (!searchQuery.trim()) {
        return {
          sortedStrategies: strategies,
          matchingStrategyValues: new Set<string>(),
          hasSearchResults: false,
        }
      }

      const searchLower = searchQuery.toLowerCase()
      const matches: typeof strategies = []
      const nonMatches: typeof strategies = []
      const matchingValues = new Set<string>()

      strategies.forEach((strategy) => {
        let isMatch = false

        // Search in strategy label
        if (strategy.label.toLowerCase().includes(searchLower)) isMatch = true

        // Search in strategy description
        if (strategy.description.toLowerCase().includes(searchLower))
          isMatch = true

        // Search in strategy value/ID
        if (strategy.value.toLowerCase().includes(searchLower)) isMatch = true

        // Search in associated operation icon labels (from strategyDefinitions)
        // These are the tooltip labels for the operation icons
        const relatedDefinition = strategyDefinitions.find(
          (def) => def.id === strategy.value,
        )
        if (relatedDefinition) {
          if (relatedDefinition.label.toLowerCase().includes(searchLower))
            isMatch = true
          if (relatedDefinition.description.toLowerCase().includes(searchLower))
            isMatch = true
        }

        if (isMatch) {
          matches.push(strategy)
          matchingValues.add(strategy.value)
        } else {
          nonMatches.push(strategy)
        }
      })

      return {
        sortedStrategies: [...matches, ...nonMatches],
        matchingStrategyValues: matchingValues,
        hasSearchResults: matches.length > 0,
      }
    }, [searchQuery])

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
      {/* Scenarios Grid */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: theme.spacing(theme.cards.spacing.standard),
          pt: theme.spacing(1.5),
          pb: 0,
        }}
      >
        <StrategyGrid
          getChartDataForStrategy={getChartDataForStrategy}
          outcomeNames={outcomeNames || []}
          strategies={sortedStrategies}
          highlightedStrategies={matchingStrategyValues}
          showSearchDivider={hasSearchResults}
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
