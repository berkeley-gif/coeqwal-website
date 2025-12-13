"use client"

import React, { useMemo, useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "@repo/state/scenarioExplorer"
import StrategyGrid from "../../components/StrategyGrid"
import { useScenarioData } from "../../hooks/useScenarioData"
import { useMultipleScenarioTiers } from "../../../../hooks/useTierData"
import {
  STRATEGY_TO_SCENARIO_ID,
  getScenarioIdFromStrategy,
} from "../../../../lib/constants/outcomeMappings"
import { strategies, strategyDefinitions } from "../../../../content/scenarios"

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

interface ListViewProps {
  /** Compact mode for split-panel layouts (50% width) - reduces padding */
  compact?: boolean
  /** Callback when a tier/outcome is clicked (for map integration) */
  onTierClick?: (strategy: string, outcome: string) => void
}

/**
 * ListView: Full list of COEQWAL scenarios with searching and sorting
 * Shows all scenarios in a grid/table format with outcome summaries
 * 
 * @param compact - When true, uses reduced padding for split-panel layouts
 * @param onTierClick - Optional callback for tier/outcome clicks (used by MapView)
 */
export default function ListView({ compact = false, onTierClick }: ListViewProps) {
  const theme = useTheme()
  const { getChartDataForStrategy, outcomeNames, isLoading, error } =
    useScenarioData()
  const { allScoreData } = useMultipleScenarioTiers()

  // Sort state
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSortChange = (
    outcome: string | null,
    direction: "asc" | "desc",
  ) => {
    setSortBy(outcome)
    setSortDirection(direction)
  }

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

  // Sort strategies based on search query and outcome sorting
  const { sortedStrategies, matchingStrategyValues, hasSearchResults } =
    useMemo(() => {
      const baseStrategies = [...strategies]

      // Apply outcome-based sorting if active
      if (sortBy && allScoreData && Object.keys(allScoreData).length > 0) {
        baseStrategies.sort((a, b) => {
          const aScenarioId = getScenarioIdFromStrategy(a.value)
          const bScenarioId = getScenarioIdFromStrategy(b.value)

          const aScores = allScoreData[aScenarioId]
          const bScores = allScoreData[bScenarioId]

          // If either scenario doesn't have score data, put it at the end
          if (!aScores?.[sortBy] && !bScores?.[sortBy]) return 0
          if (!aScores?.[sortBy]) return 1
          if (!bScores?.[sortBy]) return -1

          const aScore = aScores[sortBy].weighted_score
          const bScore = bScores[sortBy].weighted_score

          // Ascending = best first (lower weighted_score is better)
          // Descending = worst first (higher weighted_score is worse)
          if (sortDirection === "asc") {
            return aScore - bScore
          } else {
            return bScore - aScore
          }
        })
      }

      if (!searchQuery.trim()) {
        return {
          sortedStrategies: baseStrategies,
          matchingStrategyValues: new Set<string>(),
          hasSearchResults: false,
        }
      }

      const searchLower = searchQuery.toLowerCase()
      const matches: typeof strategies = []
      const nonMatches: typeof strategies = []
      const matchingValues = new Set<string>()

      baseStrategies.forEach((strategy) => {
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
    }, [searchQuery, sortBy, sortDirection, allScoreData])

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

  // Common props for StrategyGrid
  const strategyGridProps = {
    getChartDataForStrategy,
    outcomeNames: outcomeNames || [],
    strategies: sortedStrategies,
    highlightedStrategies: matchingStrategyValues,
    showSearchDivider: hasSearchResults,
    onOutcomeSelect: handleOutcomeSelect,
    onTierClick,
    onToggleScenario: handleToggleScenario,
    selectedScenarios: selectedStrategies,
    selectedOutcomes: localSelectedOutcomes,
    showMapView: false, // List view doesn't show map mode
    showOnlyChosen,
    showDefinitions,
    compact,
    onMapViewChange: () => {}, // No-op in list view
    onShowOnlyChosenChange: setShowOnlyChosen,
    onShowDefinitionsChange: setShowDefinitions,
    sortBy,
    sortDirection,
    onSortChange: handleSortChange,
  }

  // For list view (non-compact): split headers and content for proper scrolling
  // Use explicit height calculation to ensure proper scrolling behavior
  if (!compact) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          // Use calc to set explicit height - accounts for header (40px) + tabs (~48px) + banner (~60px) + search (~56px) + padding
          height: "calc(100vh - 220px)",
          overflow: "hidden",
          backgroundColor: theme.palette.grey[100],
        }}
      >
        {/* Fixed header section (not scrolling) */}
        <Box
          sx={{
            flexShrink: 0,
            px: theme.spacing(theme.cards.spacing.standard),
            pt: theme.spacing(1.5),
            backgroundColor: theme.palette.grey[100],
          }}
        >
          <StrategyGrid {...strategyGridProps} renderMode="headersOnly" />
        </Box>

        {/* Scrollable content section */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            px: theme.spacing(theme.cards.spacing.standard),
            pb: theme.spacing(10),
          }}
        >
          <StrategyGrid {...strategyGridProps} renderMode="contentOnly" />
        </Box>
      </Box>
    )
  }

  // For compact mode: everything scrolls together
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
          px: theme.spacing(1.5),
          pt: theme.spacing(1),
          pb: theme.spacing(10),
        }}
      >
        <StrategyGrid {...strategyGridProps} renderMode="all" />
      </Box>
    </Box>
  )
}
