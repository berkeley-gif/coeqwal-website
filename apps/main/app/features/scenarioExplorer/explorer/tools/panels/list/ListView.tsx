"use client"

/**
 * ListView - Scenario grid
 *
 * Purely grid + data. Controls are in other components.
 * Uses a single CSS Grid (checkbox | scenario | operations)
 * for a single scroll container,
 * with subgrid rows for column alignment.
 *
 * Row order shared with scenarioSelectionSidebar and determined in `useOrderedScenarios`.
 * Tier chart data from `useResolvedScenarioTiers` (API batch via SWR, warmed by `usePrefetchTiers`).
 */

import React, { useMemo, useRef } from "react"
import { Box, Typography, useTheme, alpha } from "@repo/ui/mui"
import { useWorkspaceSlice, useListSlice } from "../../../store"
import StrategyGrid from "./grid"
import type { ScenarioTheme } from "../../../../../../content/scenarios"
import { getScenariosWithIcon } from "../../../../../scenarios/components/shared/iconRegistry"
import { useResolvedScenarioTiers } from "../../hooks/useResolvedScenarioTiers"
import { useOrderedScenarios } from "../../hooks/useOrderedScenarios"
import VisualizeRail from "./VisualizeRail"
import { useListVisualizeRailSync } from "./tour/useListVisualizeRailSync"

interface ListViewProps {
  highlightedIds?: Set<string> | null
}

export default function ListView({ highlightedIds }: ListViewProps) {
  const theme = useTheme()

  const {
    allScoreData,
    isLoading: tiersLoading,
    error: tiersError,
  } = useResolvedScenarioTiers()

  const {
    orderedScenarios,
    scenariosInContiguousThemeOrder,
    matchingScenarioIds,
    hasSearchResults,
    themeMatchingScenarioIds,
    showThemeDivider,
    showAllThemeDividers,
    iconMatchingScenarioIds,
    showIconDivider,
    isLoading: listLoading,
    error: listError,
  } = useOrderedScenarios(allScoreData)

  const isLoading = listLoading || tiersLoading
  const error = listError ?? tiersError ?? null

  const listScrollRef = useRef<HTMLDivElement>(null)

  const {
    selectedScenarios,
    toggleScenario,
    selectScenarios,
    showAlternativeBaselines,
    showKeyOperations,
    setShowAlternativeBaselines,
    setExploreMode,
  } = useWorkspaceSlice()
  const {
    showOnlyChosen,
    setShowOnlyChosen,
    searchQuery,
    selectedTheme,
    selectedIconId,
    setSelectedTheme,
    setSelectedIconId,
    groupByTheme,
  } = useListSlice()

  useListVisualizeRailSync(
    orderedScenarios[0]?.scenarioId,
    selectedScenarios,
    selectScenarios,
  )

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
    scenarios: orderedScenarios,
    highlightedScenarios: mergedHighlighted,
    showSearchDivider: hasSearchResults,
    themeMatchingScenarioIds,
    showThemeDivider,
    showAllThemeDividers,
    iconMatchingScenarioIds,
    showIconDivider,
    onToggleScenario: handleToggleScenario,
    selectedScenarios,
    showMapView: false,
    showOnlyChosen,
    showAlternativeBaselines,
    showOperations: showKeyOperations,
    hideColumnTitles: true,
    groupByTheme,
    scenariosInContiguousThemeOrder,
    onMapViewChange: () => { },
    onShowOnlyChosenChange: setShowOnlyChosen,
    onShowAlternativeBaselinesChange: setShowAlternativeBaselines,
    onThemeBadgeClick: handleThemeBadgeClick,
    onIconClick: handleIconClick,
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          flex: 1,
          overflow: "hidden",
          backgroundColor: theme.palette.grey[100],
        }}
      >
        {/* Fixed header: stays above the scroll region. Soft bottom
          shadow (wider blur than sm) so content reads as scrolling
          underneath with a more diffuse edge. */}
        <Box
          sx={{
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
            px: theme.space.tool.px,
            py: 1.25,
            backgroundColor: theme.palette.grey[100],
            boxShadow: [
              `0 1px 2px ${alpha(theme.palette.common.black, 0.06)}`,
              `0 5px 18px -2px ${alpha(theme.palette.common.black, 0.1)}`,
            ].join(", "),
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
      <VisualizeRail
        active={selectedScenarios.length > 0}
        onClick={() => setExploreMode("bar")}
      />
    </Box>
  )
}
