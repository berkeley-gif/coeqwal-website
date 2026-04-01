"use client"

/**
 * ListView - Scenario list view with outcome charts
 *
 * Displays scenarios in a scrollable list with outcome visualizations when in map mode.
 * Uses useScenarioList hook to get enriched scenario data from API + local metadata.
 */

import React, { useMemo, useState, useRef, useCallback } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import StrategyGrid from "../strategyGrid"
import { useMultipleScenarioTiers } from "../../scenarios/hooks"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import type { Scenario } from "../../scenarios/hooks/useScenarioList"
import type { ScenarioTheme } from "../../../content/scenarios"
import { getScenariosWithIcon } from "../../scenarios/components/shared/opsIcons"
import { useScrollSyncRef } from "../components/useScrollSync"

const THEME_ORDER: Record<ScenarioTheme, number> = {
  baseline: 0,
  ag_gw: 1,
  eco: 2,
  delta: 3,
  cws: 4,
  unthemed: 5,
}

interface ListViewProps {
  onTierClick?: (scenarioId: string, outcomeCode: string) => void
  highlightedIds?: Set<string> | null
  onScenarioHover?: (scenarioId: string | null) => void
}

export default function ListView({
  onTierClick,
  highlightedIds,
  onScenarioHover: _onScenarioHover,
}: ListViewProps) {
  const theme = useTheme()

  const { hydroclimatePeriod, setIsSortActive } = useScenarioExplorerStore()
  const {
    siblingGroups,
    buildIdMapping,
    isLoading: scenariosLoading,
    error: scenariosError,
  } = useScenarioList()

  const idMapping = useMemo(
    () => buildIdMapping(hydroclimatePeriod),
    [buildIdMapping, hydroclimatePeriod],
  )

  const {
    allChartData,
    outcomeNames,
    allScoreData,
    isLoading: dataLoading,
    error: dataError,
  } = useMultipleScenarioTiers(idMapping)

  // Use siblingGroups (24) instead of full scenarios (72)
  const scenarios = siblingGroups

  const getChartDataForScenario = (scenarioId: string) =>
    allChartData[scenarioId] ?? {}

  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const listScrollLocalRef = useRef<HTMLDivElement>(null)
  const syncRef = useScrollSyncRef("content")
  const listScrollRef = useCallback(
    (el: HTMLDivElement | null) => {
      listScrollLocalRef.current = el
      syncRef(el)
    },
    [syncRef],
  )

  const handleSortChange = (
    outcome: string | null,
    direction: "asc" | "desc",
  ) => {
    setSortBy(outcome)
    setSortDirection(direction)
    setIsSortActive(outcome !== null)
  }

  const {
    selectedScenarios,
    toggleScenario,
    selectScenarios,
    showOnlyChosen,
    showAlternativeBaselines,
    setShowOnlyChosen,
    setShowAlternativeBaselines,
    searchQuery,
    pinnedScenarioId,
    selectedTheme,
    showOnlyTheme,
    setSelectedTheme,
    selectedIconId,
    setSelectedIconId,
  } = useScenarioExplorerStore()

  const {
    sortedScenarios,
    matchingScenarioIds,
    hasSearchResults,
    themeMatchingScenarioIds,
    showThemeDivider,
    showAllThemeDividers,
    iconMatchingScenarioIds,
    showIconDivider,
  } = useMemo(() => {
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
    } else {
      // Default: group scenarios by theme
      baseScenarios.sort((a, b) => {
        const aOrder = a.theme ? (THEME_ORDER[a.theme] ?? 99) : 99
        const bOrder = b.theme ? (THEME_ORDER[b.theme] ?? 99) : 99
        return aOrder - bOrder
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

    // Helper to apply theme grouping: theme-matching scenarios float to top
    const applyThemeGrouping = (scenarioList: typeof baseScenarios) => {
      if (!selectedTheme)
        return { list: scenarioList, themeIds: new Set<string>() }
      const themeMatches = scenarioList.filter((s) => s.theme === selectedTheme)
      const rest = scenarioList.filter((s) => s.theme !== selectedTheme)
      const themeIds = new Set(themeMatches.map((s) => s.scenarioId))
      const list = showOnlyTheme ? themeMatches : [...themeMatches, ...rest]
      return { list, themeIds }
    }

    // Helper to apply icon grouping: icon-matching scenarios float to top
    const iconScenarioIdSet = selectedIconId
      ? new Set(getScenariosWithIcon(selectedIconId))
      : new Set<string>()
    const applyIconGrouping = (scenarioList: typeof baseScenarios) => {
      if (!selectedIconId)
        return { list: scenarioList, iconIds: new Set<string>() }
      const iconMatches = scenarioList.filter((s) =>
        iconScenarioIdSet.has(s.scenarioId),
      )
      const rest = scenarioList.filter(
        (s) => !iconScenarioIdSet.has(s.scenarioId),
      )
      return { list: [...iconMatches, ...rest], iconIds: iconScenarioIdSet }
    }

    if (!searchQuery.trim()) {
      const pinned = applyPinning(baseScenarios)
      const { list: themeList, themeIds } = applyThemeGrouping(pinned)
      const { list, iconIds } = applyIconGrouping(themeList)
      return {
        sortedScenarios: list,
        matchingScenarioIds: new Set<string>(),
        hasSearchResults: false,
        themeMatchingScenarioIds: themeIds,
        showThemeDivider: selectedTheme !== null && !showOnlyTheme,
        showAllThemeDividers: !sortBy,
        iconMatchingScenarioIds: iconIds,
        showIconDivider: selectedIconId !== null,
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

    const pinned = applyPinning([...matches, ...nonMatches])
    const { list: themeList, themeIds } = applyThemeGrouping(pinned)
    const { list, iconIds } = applyIconGrouping(themeList)
    return {
      sortedScenarios: list,
      matchingScenarioIds: matchingIds,
      hasSearchResults: matches.length > 0,
      themeMatchingScenarioIds: themeIds,
      showThemeDivider: selectedTheme !== null && !showOnlyTheme,
      showAllThemeDividers: !sortBy,
      iconMatchingScenarioIds: iconIds,
      showIconDivider: selectedIconId !== null,
    }
  }, [
    searchQuery,
    sortBy,
    sortDirection,
    allScoreData,
    scenarios,
    pinnedScenarioId,
    selectedTheme,
    showOnlyTheme,
    selectedIconId,
  ])

  const handleToggleScenario = (scenarioId: string) => {
    toggleScenario(scenarioId)
  }

  const scrollListToTop = () =>
    listScrollLocalRef.current?.scrollTo({ top: 0, behavior: "smooth" })

  const handleThemeGroupToggle = (themeKey: string) => {
    const themeIds = scenarios
      .filter((s) => s.theme === themeKey)
      .map((s) => s.scenarioId)
    if (themeIds.length === 0) return
    const allSelected = themeIds.every((id) =>
      selectedScenarios.includes(id),
    )
    if (allSelected) {
      selectScenarios(
        selectedScenarios.filter((id) => !themeIds.includes(id)),
      )
    } else {
      const merged = Array.from(new Set([...selectedScenarios, ...themeIds]))
      selectScenarios(merged)
    }
  }

  // Click a theme badge -> select all scenarios of that theme and float them to top.
  // Clicking the active theme again deselects those scenarios and clears the filter.
  const handleThemeBadgeClick = (theme: ScenarioTheme) => {
    if (selectedTheme === theme) {
      const themeIds = new Set(
        scenarios.filter((s) => s.theme === theme).map((s) => s.scenarioId),
      )
      selectScenarios(selectedScenarios.filter((id) => !themeIds.has(id)))
      setSelectedTheme(null)
    } else {
      const themeIds = scenarios
        .filter((s) => s.theme === theme)
        .map((s) => s.scenarioId)
      const merged = Array.from(new Set([...selectedScenarios, ...themeIds]))
      selectScenarios(merged)
      setSelectedTheme(theme)
    }
    scrollListToTop()
  }

  // Click an operation icon -> float matching scenarios to top and select them.
  // Clicking the active icon again deselects those scenarios and clears the filter.
  const handleIconClick = (iconId: string) => {
    if (selectedIconId === iconId) {
      const iconScenarioIds = new Set(getScenariosWithIcon(iconId))
      selectScenarios(
        selectedScenarios.filter((id) => !iconScenarioIds.has(id)),
      )
      setSelectedIconId(null)
    } else {
      const iconScenarioIds = getScenariosWithIcon(iconId)
      const merged = Array.from(
        new Set([...selectedScenarios, ...iconScenarioIds]),
      )
      selectScenarios(merged)
      setSelectedIconId(iconId)
    }
    scrollListToTop()
  }

  const [localSelectedOutcomes, setLocalSelectedOutcomes] = React.useState<
    Record<string, string>
  >({})

  const handleOutcomeSelect = (scenarioId: string, outcome: string) => {
    setLocalSelectedOutcomes((prev) => ({ ...prev, [scenarioId]: outcome }))
  }

  const isLoading = dataLoading || scenariosLoading
  const error = dataError || scenariosError

  const mergedHighlighted = useMemo(() => {
    if (!highlightedIds && matchingScenarioIds.size === 0)
      return new Set<string>()
    const set = new Set(matchingScenarioIds)
    if (highlightedIds) highlightedIds.forEach((id) => set.add(id))
    return set
  }, [highlightedIds, matchingScenarioIds])

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
    highlightedScenarios: mergedHighlighted,
    showSearchDivider: hasSearchResults,
    themeMatchingScenarioIds,
    showThemeDivider,
    showAllThemeDividers,
    iconMatchingScenarioIds,
    showIconDivider,
    onOutcomeSelect: handleOutcomeSelect,
    onTierClick,
    onToggleScenario: handleToggleScenario,
    selectedScenarios,
    selectedOutcomes: localSelectedOutcomes,
    showMapView: false,
    showOnlyChosen,
    showAlternativeBaselines,
    compact: false,
    outcomesOnly: true,
    onMapViewChange: () => {},
    onShowOnlyChosenChange: setShowOnlyChosen,
    onShowAlternativeBaselinesChange: setShowAlternativeBaselines,
    sortBy,
    sortDirection,
    onSortChange: handleSortChange,
    onThemeBadgeClick: handleThemeBadgeClick,
    onThemeGroupToggle: handleThemeGroupToggle,
    onIconClick: handleIconClick,
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[100],
      }}
    >
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
        ref={listScrollRef}
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
  )
}
