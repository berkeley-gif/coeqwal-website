"use client"

/**
 * ListView - Scenario list view with outcome charts
 *
 * Displays scenarios in a scrollable list with outcome visualizations when in map mode.
 * Uses useScenarioList hook to get enriched scenario data from API + local metadata.
 */

import React, { useMemo, useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { MobileModal } from "@repo/ui"
import { useScenarioExplorerStore } from "../store"
import StrategyGrid from "../strategyGrid"
import { useMultipleScenarioTiers } from "../../scenarios/hooks"
import {
  useScenarioList,
  type Scenario,
} from "../../scenarios/hooks/useScenarioList"

interface ListViewProps {
  compact?: boolean
  onTierClick?: (scenarioId: string, outcomeCode: string) => void
  pinnedScenarioId?: string | null
  /** When provided, controls the expanded modal externally */
  isExpanded?: boolean
  /** Callback to close the expanded modal */
  onCloseExpand?: () => void
  /** Toolbar content to render inside the expanded modal (e.g. search bar, controls) */
  modalToolbar?: React.ReactNode
}

export default function ListView({
  compact = false,
  onTierClick,
  pinnedScenarioId,
  isExpanded: isExpandedProp,
  onCloseExpand,
  modalToolbar,
}: ListViewProps) {
  const theme = useTheme()
  const {
    allChartData,
    outcomeNames,
    allScoreData,
    isLoading: dataLoading,
    error: dataError,
  } = useMultipleScenarioTiers()

  // Helper to get chart data for a specific scenario
  const getChartDataForScenario = (scenarioId: string) =>
    allChartData[scenarioId] ?? {}
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

      // Helper to move pinned scenario to top
      const applyPinning = (scenarioList: typeof baseScenarios) => {
        if (!pinnedScenarioId) return scenarioList
        const pinnedIndex = scenarioList.findIndex(
          (s) => s.scenarioId === pinnedScenarioId,
        )
        if (pinnedIndex <= 0) return scenarioList // Already at top or not found
        const pinned = scenarioList[pinnedIndex]!
        return [pinned, ...scenarioList.filter((_, i) => i !== pinnedIndex)]
      }

      if (!searchQuery.trim()) {
        return {
          sortedScenarios: applyPinning(baseScenarios),
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
        sortedScenarios: applyPinning([...matches, ...nonMatches]),
        matchingScenarioIds: matchingIds,
        hasSearchResults: matches.length > 0,
      }
    }, [
      searchQuery,
      sortBy,
      sortDirection,
      allScoreData,
      scenarios,
      pinnedScenarioId,
    ])

  const handleToggleScenario = (scenarioId: string) => {
    toggleScenario(scenarioId)
  }

  const [localSelectedOutcomes, setLocalSelectedOutcomes] = React.useState<
    Record<string, string>
  >({})
  // Use external expand control when provided, otherwise internal state
  const [isExpandedInternal, setIsExpandedInternal] = useState(false)
  const externallyControlled = isExpandedProp !== undefined
  const isExpanded = externallyControlled ? isExpandedProp : isExpandedInternal
  const closeExpand = externallyControlled
    ? () => onCloseExpand?.()
    : () => setIsExpandedInternal(false)

  const handleOutcomeSelect = (scenarioId: string, outcome: string) => {
    setLocalSelectedOutcomes((prev) => ({ ...prev, [scenarioId]: outcome }))
  }

  const isLoading = dataLoading || scenariosLoading
  const error = dataError || scenariosError

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
  const showNoResultsMessage = searchQuery.trim() !== "" && !hasSearchResults

  const strategyGridProps = {
    getChartDataForScenario,
    allScoreData,
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
      <>
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
              pt: "10px",
              pb: theme.space.section.xl,
              // Top border to indicate scrollable area
              borderTop: theme.border.medium,
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

        {/* Expanded modal view */}
        <MobileModal
          open={isExpanded}
          onClose={closeExpand}
          maxWidth="95vw"
          maxHeight="95vh"
          contentAriaLabel="Scenario list expanded view"
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "85vh",
              overflow: "hidden",
              backgroundColor: theme.palette.grey[100],
            }}
          >
            {/* Toolbar (search, controls) */}
            {modalToolbar && <Box sx={{ flexShrink: 0 }}>{modalToolbar}</Box>}

            {/* Fixed header area */}
            <Box
              sx={{
                flexShrink: 0,
                px: theme.space.section.md,
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
                pt: "10px",
                pb: theme.space.section.xl,
                borderTop: theme.border.medium,
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
        </MobileModal>
      </>
    )
  }

  // Compact mode
  const isMapMode = !!onTierClick

  return (
    <>
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
            // Top border to indicate scrollable area
            borderTop: theme.border.medium,
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
          {isMapMode ? (
            <>
              <StrategyGrid {...strategyGridProps} renderMode="headersOnly" />
              {/* Map mode instructions — below "Choose scenarios" header */}
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.grey[500], display: "block" }}
                >
                  Click on an outcome to see on the map
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.grey[500], display: "block" }}
                >
                  Add a location to view its outcome under different scenarios
                </Typography>
              </Box>
              <StrategyGrid {...strategyGridProps} renderMode="contentOnly" />
            </>
          ) : (
            <StrategyGrid {...strategyGridProps} renderMode="all" />
          )}
        </Box>
      </Box>

      {/* Expanded modal view */}
      <MobileModal
        open={isExpanded}
        onClose={closeExpand}
        maxWidth="95vw"
        maxHeight="95vh"
        contentAriaLabel="Scenario list expanded view"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "85vh",
            overflow: "hidden",
          }}
        >
          {/* Toolbar (search, controls) */}
          {modalToolbar && <Box sx={{ flexShrink: 0 }}>{modalToolbar}</Box>}

          {/* Fixed header area */}
          <Box
            sx={{
              flexShrink: 0,
              px: theme.space.section.md,
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
              pt: "10px",
              pb: theme.space.section.xl,
              borderTop: theme.border.medium,
              backgroundColor: theme.palette.grey[100],
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
            <StrategyGrid
              {...strategyGridProps}
              compact={false}
              renderMode="contentOnly"
            />
          </Box>
        </Box>
      </MobileModal>
    </>
  )
}
