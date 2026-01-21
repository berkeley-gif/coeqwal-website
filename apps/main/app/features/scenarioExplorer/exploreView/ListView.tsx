"use client"

/**
 * ListView - Scenario list view with outcome charts
 *
 * Displays scenarios in a scrollable list with outcome visualizations when in map mode.
 * Uses useScenarioList hook to get enriched scenario data from API + local metadata.
 */

import React, { useMemo, useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import StrategyGrid from "../strategyGrid"
import { useScenarioData } from "../hooks/useScenarioData"
import { useMultipleScenarioTiers } from "../../scenarios/hooks"
import {
  useScenarioList,
  type Scenario,
} from "../../scenarios/hooks/useScenarioList"

interface ListViewProps {
  compact?: boolean
  onTierClick?: (scenarioId: string, outcome: string) => void
}

export default function ListView({
  compact = false,
  onTierClick,
}: ListViewProps) {
  const theme = useTheme()
  const {
    getChartDataForScenario,
    outcomeNames,
    isLoading: dataLoading,
    error: dataError,
  } = useScenarioData()
  const { allScoreData } = useMultipleScenarioTiers()
  const {
    scenarios,
    isLoading: scenariosLoading,
    error: scenariosError,
  } = useScenarioList()

  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSortChange = (
    outcome: string | null,
    direction: "asc" | "desc",
  ) => {
    setSortBy(outcome)
    setSortDirection(direction)
  }

  const {
    selectedScenarios,
    toggleScenario,
    showOnlyChosen,
    showDefinitions,
    setShowOnlyChosen,
    setShowDefinitions,
    searchQuery,
  } = useScenarioExplorerStore()

  const { sortedScenarios, matchingScenarioIds, hasSearchResults } =
    useMemo(() => {
      const baseScenarios = [...scenarios]

      if (sortBy && allScoreData && Object.keys(allScoreData).length > 0) {
        baseScenarios.sort((a, b) => {
          const aScores = allScoreData[a.scenarioId]
          const bScores = allScoreData[b.scenarioId]

          if (!aScores?.[sortBy] && !bScores?.[sortBy]) return 0
          if (!aScores?.[sortBy]) return 1
          if (!bScores?.[sortBy]) return -1

          const aScore = aScores[sortBy].weighted_score
          const bScore = bScores[sortBy].weighted_score

          if (sortDirection === "asc") {
            return aScore - bScore
          } else {
            return bScore - aScore
          }
        })
      }

      if (!searchQuery.trim()) {
        return {
          sortedScenarios: baseScenarios,
          matchingScenarioIds: new Set<string>(),
          hasSearchResults: false,
        }
      }

      const searchLower = searchQuery.toLowerCase()
      const matches: Scenario[] = []
      const nonMatches: Scenario[] = []
      const matchingIds = new Set<string>()

      baseScenarios.forEach((scenario) => {
        let isMatch = false

        if (scenario.label.toLowerCase().includes(searchLower)) isMatch = true
        if (scenario.description.toLowerCase().includes(searchLower))
          isMatch = true
        if (scenario.scenarioId.toLowerCase().includes(searchLower))
          isMatch = true
        if (scenario.shortLabel?.toLowerCase().includes(searchLower))
          isMatch = true

        if (isMatch) {
          matches.push(scenario)
          matchingIds.add(scenario.scenarioId)
        } else {
          nonMatches.push(scenario)
        }
      })

      return {
        sortedScenarios: [...matches, ...nonMatches],
        matchingScenarioIds: matchingIds,
        hasSearchResults: matches.length > 0,
      }
    }, [searchQuery, sortBy, sortDirection, allScoreData, scenarios])

  const handleToggleScenario = (scenarioId: string) => {
    toggleScenario(scenarioId)
  }

  const [localSelectedOutcomes, setLocalSelectedOutcomes] = React.useState<
    Record<string, string>
  >({})

  const handleOutcomeSelect = (scenarioId: string, outcome: string) => {
    setLocalSelectedOutcomes((prev) => ({ ...prev, [scenarioId]: outcome }))
  }

  const isLoading = dataLoading || scenariosLoading
  const error = dataError || (scenariosError ? scenariosError.message : null)

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          p: theme.space.component.xl,
        }}
      >
        <Typography variant="body2">Loading scenarios...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: theme.spacing(3) }}>
        <Typography variant="body2" color="error">
          Error loading data: {error}
        </Typography>
      </Box>
    )
  }

  // Show "no results" message when search is active but nothing matches
  const showNoResultsMessage =
    searchQuery.trim() !== "" && !hasSearchResults

  const strategyGridProps = {
    getChartDataForScenario,
    outcomeNames: outcomeNames || [],
    scenarios: sortedScenarios,
    highlightedScenarios: matchingScenarioIds,
    showSearchDivider: hasSearchResults,
    onOutcomeSelect: handleOutcomeSelect,
    onTierClick,
    onToggleScenario: handleToggleScenario,
    selectedScenarios,
    selectedOutcomes: localSelectedOutcomes,
    showMapView: false,
    showOnlyChosen,
    showDefinitions,
    compact,
    onMapViewChange: () => {},
    onShowOnlyChosenChange: setShowOnlyChosen,
    onShowDefinitionsChange: setShowDefinitions,
    sortBy,
    sortDirection,
    onSortChange: handleSortChange,
  }

  if (!compact) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 220px)",
          overflow: "hidden",
          backgroundColor: theme.palette.grey[100],
        }}
      >
        {/* Fixed header area */}
        <Box
          sx={{
            flexShrink: 0,
            px: theme.space.section.md,
            // Match SearchBar's py: component.lg so dividers start at same distance from top
            pt: theme.space.component.lg,
            backgroundColor: theme.palette.grey[100],
          }}
        >
          <StrategyGrid {...strategyGridProps} renderMode="headersOnly" />
        </Box>

        {/* Scrollable content */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            px: theme.space.section.md,
            pb: theme.space.section.xl,
          }}
        >
          {showNoResultsMessage && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.grey[600],
                fontStyle: "italic",
                mb: 2,
                mt: 1,
              }}
            >
              No scenarios match &ldquo;{searchQuery}&rdquo;
            </Typography>
          )}
          <StrategyGrid {...strategyGridProps} renderMode="contentOnly" />
        </Box>
      </Box>
    )
  }

  // Compact mode
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
          px: theme.space.section.sm,
          pt: theme.space.component.md,
          pb: theme.space.section.xl,
        }}
      >
        {showNoResultsMessage && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.grey[600],
              fontStyle: "italic",
              mb: 2,
            }}
          >
            No scenarios match &ldquo;{searchQuery}&rdquo;
          </Typography>
        )}
        <StrategyGrid {...strategyGridProps} renderMode="all" />
      </Box>
    </Box>
  )
}
