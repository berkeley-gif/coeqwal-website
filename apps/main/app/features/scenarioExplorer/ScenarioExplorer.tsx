"use client"

/**
 * ScenarioExplorer - Content area for the Explore tab.
 *
 * Navigation (ExploreSubNav) has been lifted to the page shell so it
 * participates in the sticky stacking alongside SmoothTabs. This
 * component only renders the active view content.
 *
 * All explore modes route through UnifiedToolLayout:
 *   - List mode: no sidebar, ToolToolbar with grid-aligned search/chips
 *   - Other modes: ScenarioSelectionSidebar + ToolToolbar + chart controls
 */

import { useCallback, useMemo, useState } from "react"
import { Box, useTheme, icons } from "@repo/ui/mui"
import GetStartedView from "./getStarted/GetStartedView"
import UnifiedToolLayout from "./components/UnifiedToolLayout"
import ToolToolbar from "./components/ToolToolbar"
import ChartControlsBar from "./components/ChartControlsBar"
import ScenarioSelectionSidebar from "./components/ScenarioSelectionSidebar"
import ShareDrawer from "./components/ShareDrawer"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import {
  ComparisonPanel,
  EquityPanel,
  ResiliencePanel,
  RadarPanel,
} from "./exploreView"
import ListView from "./exploreView/ListView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import { useScenarioExplorerStore } from "./store"
import { useMapMode } from "../map/store"
import { usePrefetchTiers } from "./hooks/usePrefetchTiers"

function RadarToggleChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  const theme = useTheme()
  const Icon = active ? icons.CheckCircle : icons.RadioButtonUnchecked

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        px: 1.25,
        py: 0.5,
        border: "none",
        borderRadius: "12px",
        cursor: "pointer",
        fontSize: "0.8125rem",
        fontWeight: 500,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        color: active ? theme.palette.blue.bright : theme.palette.grey[800],
        background: active
          ? theme.palette.interaction.selectedBackground
          : theme.palette.grey[200],
        transition: "all 150ms ease",
        "&:hover": {
          background: theme.palette.interaction.selectedBackground,
          color: theme.palette.blue.bright,
        },
      }}
    >
      <Icon sx={{ fontSize: "0.875rem", flexShrink: 0 }} />
      {label}
    </Box>
  )
}

export default function ScenarioExplorer() {
  const theme = useTheme()
  const { mainView, exploreMode, showMap } = useScenarioExplorerStore()
  const mapMode = useMapMode()

  usePrefetchTiers()

  const isGetStartedMapMode =
    mainView === "get-started" && mapMode === "get-started"
  const isExploreMapMode = mainView === "explorer" && showMap
  const needsTransparentBg = isGetStartedMapMode || isExploreMapMode
  // When the map is visible (get-started or explore with map), the root is
  // pointer-events:none so the persistent map behind can receive interactions.
  // Child elements opt back in with pointer-events:auto as needed.
  const isMapPassThrough = isGetStartedMapMode || isExploreMapMode

  // Hover coordination (for sidebar ↔ tool panels in non-list modes)
  const [highlightedIds, setHighlightedIds] = useState<Set<string> | null>(null)
  const [hoveredScenarioId, setHoveredScenarioId] = useState<string | null>(
    null,
  )

  const handleSidebarRowHover = useCallback((ids: string[] | null) => {
    setHighlightedIds(ids ? new Set(ids) : null)
  }, [])

  const handleToolScenarioHover = useCallback((scenarioId: string | null) => {
    setHoveredScenarioId(scenarioId)
  }, [])

  const {
    highlightBaseline,
    setHighlightBaseline,
    showRadarRange,
    setShowRadarRange,
    showDotsOnly,
    setShowDotsOnly,
    radarShowAll,
    setRadarShowAll,
    showAxisSelector,
    setShowAxisSelector,
  } = useScenarioExplorerStore()

  const chartControls = useMemo(() => {
    if (exploreMode === "radar") {
      return (
        <ChartControlsBar>
          <RadarToggleChip
            label="choose axes"
            active={showAxisSelector}
            onClick={() => setShowAxisSelector(!showAxisSelector)}
          />
          <RadarToggleChip
            label="show all scenarios"
            active={radarShowAll}
            onClick={() => setRadarShowAll(!radarShowAll)}
          />
          <RadarToggleChip
            label="dots only"
            active={showDotsOnly}
            onClick={() => setShowDotsOnly(!showDotsOnly)}
          />
          <RadarToggleChip
            label="show range"
            active={showRadarRange}
            onClick={() => setShowRadarRange(!showRadarRange)}
          />
          <RadarToggleChip
            label="highlight current operations"
            active={highlightBaseline}
            onClick={() => setHighlightBaseline(!highlightBaseline)}
          />
        </ChartControlsBar>
      )
    }
    return null
  }, [
    exploreMode,
    showAxisSelector,
    setShowAxisSelector,
    showDotsOnly,
    setShowDotsOnly,
    showRadarRange,
    setShowRadarRange,
    highlightBaseline,
    setHighlightBaseline,
    radarShowAll,
    setRadarShowAll,
  ])

  const isListMode = mainView === "explorer" && exploreMode === "list"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: needsTransparentBg
          ? "transparent"
          : theme.palette.explore.background,
        color: theme.palette.text.primary,
        pointerEvents: isMapPassThrough ? "none" : "auto",
        ...(isGetStartedMapMode ? {} : { height: "100%", overflow: "hidden" }),
      }}
    >
      {/* Content area -- when the map is pass-through (get-started or explore
          with map), these wrappers stay pointer-events:none so clicks in the
          map strip fall through to Mapbox. Child tool areas opt back in. */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          ...(isGetStartedMapMode ? {} : { overflow: "hidden" }),
          ...(!isMapPassThrough && { pointerEvents: "auto" }),
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            ...(isGetStartedMapMode ? {} : { overflow: "hidden" }),
            ...(!isMapPassThrough && { pointerEvents: "auto" }),
          }}
        >
          {mainView === "get-started" && <GetStartedView />}

          {mainView === "explorer" && (
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <UnifiedToolLayout
                sidebar={
                  isListMode ? undefined : (
                    <ScenarioSelectionSidebar
                      hoveredScenarioId={hoveredScenarioId}
                      onRowHover={handleSidebarRowHover}
                    />
                  )
                }
                toolbar={<ToolToolbar gridAligned hideTitle={!isListMode} />}
                chartControls={isListMode ? undefined : chartControls}
              >
                {isListMode && (
                  <ListView
                    highlightedIds={highlightedIds}
                    onScenarioHover={handleToolScenarioHover}
                  />
                )}
                {exploreMode === "radar" && (
                  <RadarPanel
                    highlightedIds={highlightedIds}
                    onScenarioHover={handleToolScenarioHover}
                  />
                )}
                {exploreMode === "equity" && <EquityPanel />}
                {exploreMode === "comparison" && (
                  <ComparisonPanel
                    highlightedIds={highlightedIds}
                    onScenarioHover={handleToolScenarioHover}
                  />
                )}
                {exploreMode === "resilience" && <ResiliencePanel />}
                {exploreMode === "data" && <DataExplorerView />}
              </UnifiedToolLayout>
            </Box>
          )}
        </Box>
      </Box>

      <KeyboardShortcuts />
      {mainView === "explorer" && <ShareDrawer />}
    </Box>
  )
}
