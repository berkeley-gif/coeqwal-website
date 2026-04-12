"use client"

/**
 * ListView — Unified scenario grid with all 4 columns.
 *
 * Uses a single CSS Grid (checkbox | scenario | operations | outcomes)
 * with subgrid rows for pixel-perfect column alignment and a single
 * scroll container. No scroll sync or row-height hacks needed.
 *
 * Search and visibility controls live in the shared ToolToolbar (via
 * showListControls), so this component is purely grid + data.
 *
 * Row order and data come from the shared useOrderedScenarios hook.
 */

import React, { useEffect, useMemo, useRef } from "react"
import { Box, Typography, Snackbar, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import StrategyGrid from "../strategyGrid"
import type { ScenarioTheme } from "../../../content/scenarios"
import type { ChartDataPoint } from "../../scenarios/components/shared"
import { getScenariosWithIcon } from "../../scenarios/components/shared/opsIcons"
import { useOrderedScenarios } from "../hooks/useOrderedScenarios"

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

  const {
    orderedScenarios,
    matchingScenarioIds,
    hasSearchResults,
    themeMatchingScenarioIds,
    showThemeDivider,
    showAllThemeDividers,
    iconMatchingScenarioIds,
    showIconDivider,
    allScoreData,
    allChartData,
    outcomeNames,
    isLoading,
    error,
  } = useOrderedScenarios()

  const getChartDataForScenario = useMemo(
    () => (scenarioId: string) =>
      (allChartData[scenarioId] ?? {}) as Record<string, ChartDataPoint[]>,
    [allChartData],
  )

  const listScrollRef = useRef<HTMLDivElement>(null)

  const {
    selectedScenarios,
    toggleScenario,
    selectScenarios,
    showOnlyChosen,
    showAlternativeBaselines,
    showKeyOperations,
    setShowOnlyChosen,
    setShowAlternativeBaselines,
    searchQuery,
    selectedTheme,
    setSortBy,
    setSortDirection,
    sortBy,
    sortDirection,
    selectedIconId,
    setSelectedTheme,
    setSelectedIconId,
    groupByTheme,
    pinnedScenarioIds,
    pinCapReached,
    setMaxPinnedScenarios,
    dismissPinCapReached,
  } = useScenarioExplorerStore()

  const ROW_HEIGHT_ESTIMATE = 80
  const MAX_STICKY_RATIO = 0.35

  useEffect(() => {
    const compute = () => {
      const max = Math.max(
        2,
        Math.ceil((window.innerHeight * MAX_STICKY_RATIO) / ROW_HEIGHT_ESTIMATE),
      )
      setMaxPinnedScenarios(max)
    }
    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [setMaxPinnedScenarios])

  const handleSortChange = (
    outcome: string | null,
    direction: "asc" | "desc",
  ) => {
    setSortBy(outcome)
    setSortDirection(direction)
  }

  const handleToggleScenario = (scenarioId: string) => {
    toggleScenario(scenarioId)
  }

  const scrollListToTop = () =>
    listScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })

  const handleThemeBadgeClick = (clickedTheme: ScenarioTheme) => {
    if (selectedTheme === clickedTheme) {
      const themeIds = new Set(
        orderedScenarios
          .filter((s) => s.theme === clickedTheme)
          .map((s) => s.scenarioId),
      )
      selectScenarios(selectedScenarios.filter((id) => !themeIds.has(id)))
      setSelectedTheme(null)
    } else {
      const themeIds = orderedScenarios
        .filter((s) => s.theme === clickedTheme)
        .map((s) => s.scenarioId)
      const merged = Array.from(new Set([...selectedScenarios, ...themeIds]))
      selectScenarios(merged)
      setSelectedTheme(clickedTheme)
    }
    scrollListToTop()
  }

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

  const showNoResultsMessage = searchQuery.trim() !== "" && !hasSearchResults

  const strategyGridProps = {
    getChartDataForScenario,
    allScoreData,
    outcomeNames,
    scenarios: orderedScenarios,
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
    showOperations: showKeyOperations,
    hideColumnTitles: true,
    groupByTheme,
    compact: false,
    onMapViewChange: () => {},
    onShowOnlyChosenChange: setShowOnlyChosen,
    onShowAlternativeBaselinesChange: setShowAlternativeBaselines,
    sortBy,
    sortDirection,
    onSortChange: handleSortChange,
    onThemeBadgeClick: handleThemeBadgeClick,
    onIconClick: handleIconClick,
    showActions: true,
    accentBorder: true,
    pinnedScenarioIds,
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
          px: theme.space.tool.px,
          pt: 1.25,
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
          px: theme.space.tool.px,
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

      <Snackbar
        open={pinCapReached}
        autoHideDuration={3000}
        onClose={dismissPinCapReached}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message="Pin limit reached — unpin a scenario to pin another"
        ContentProps={{
          sx: {
            backgroundColor: theme.palette.grey[800],
            color: theme.palette.common.white,
            fontSize: "0.85rem",
            fontWeight: 500,
            borderRadius: theme.borderRadius.sm,
            justifyContent: "center",
          },
        }}
      />
    </Box>
  )
}
