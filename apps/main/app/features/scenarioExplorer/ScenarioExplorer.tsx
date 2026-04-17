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

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import type { SingleScenarioCaptureFn } from "./exploreView"
import ListView from "./exploreView/ListView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import { useScenarioExplorerStore } from "./store"
import { useMapMode } from "../map/store"
import { usePrefetchTiers } from "./hooks/usePrefetchTiers"
import { InlineToggleChip } from "./components/InlineToggleChip"

export default function ScenarioExplorer() {
  const theme = useTheme()
  const { mainView, exploreMode, showMap } = useScenarioExplorerStore()
  const mapMode = useMapMode()

  usePrefetchTiers()

  // When switching to explorer tools, scroll so the tabs are docked and
  // the ToolToolbar is visible right below the sticky header + sub-nav.
  const prevMainViewRef = useRef(mainView)
  useEffect(() => {
    const prev = prevMainViewRef.current
    prevMainViewRef.current = mainView
    if (prev === mainView) return
    if (mainView !== "explorer") return

    const tabsEl = document.getElementById("tabs")
    if (!tabsEl) return

    requestAnimationFrame(() => {
      const tabsRect = tabsEl.getBoundingClientRect()
      const targetY =
        window.scrollY + tabsRect.top - theme.layout.collapsedHeaderHeight
      window.scrollTo({ top: targetY, behavior: "smooth" })
    })
  }, [mainView, theme.layout.collapsedHeaderHeight])

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

  const [hoveredInteraction, setHoveredInteraction] = useState<{
    scenarioId: string
    outcome?: string
    tierValue?: number
  } | null>(null)

  const [radarScenarioColors, setRadarScenarioColors] = useState<
    Record<string, string>
  >({})

  const handleSidebarRowHover = useCallback((ids: string[] | null) => {
    setHighlightedIds(ids ? new Set(ids) : null)
  }, [])

  const handleToolScenarioHover = useCallback((scenarioId: string | null) => {
    setHoveredInteraction(scenarioId ? { scenarioId } : null)
  }, [])

  const handleOutcomeHover = useCallback(
    (
      info: { scenarioId: string; outcome: string; tierValue: number } | null,
    ) => {
      setHoveredInteraction(info)
    },
    [],
  )

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
    selectedScenarios,
  } = useScenarioExplorerStore()

  const radarCaptureRef = useRef<(() => Promise<void>) | null>(null)
  const radarSingleCaptureRef = useRef<SingleScenarioCaptureFn | null>(null)

  const handleRadarCaptureReady = useCallback(
    (capture: () => Promise<void>) => {
      radarCaptureRef.current = capture
    },
    [],
  )

  const handleRadarSingleCaptureReady = useCallback(
    (capture: SingleScenarioCaptureFn) => {
      radarSingleCaptureRef.current = capture
    },
    [],
  )

  const handleCaptureRadarScenario = useCallback(async (scenarioId: string) => {
    return radarSingleCaptureRef.current?.(scenarioId) ?? null
  }, [])

  const chartControls = useMemo(() => {
    if (exploreMode === "radar") {
      return (
        <ChartControlsBar>
          <InlineToggleChip
            label="choose axes"
            active={showAxisSelector}
            onClick={() => setShowAxisSelector(!showAxisSelector)}
          />
          <InlineToggleChip
            label="show all scenarios"
            active={radarShowAll}
            onClick={() => setRadarShowAll(!radarShowAll)}
          />
          <InlineToggleChip
            label="dots only"
            active={showDotsOnly}
            onClick={() => setShowDotsOnly(!showDotsOnly)}
          />
          <InlineToggleChip
            label="show range"
            active={showRadarRange}
            onClick={() => setShowRadarRange(!showRadarRange)}
          />
          <InlineToggleChip
            label="highlight current operations"
            active={highlightBaseline}
            onClick={() => setHighlightBaseline(!highlightBaseline)}
          />
          <Box
            component="button"
            type="button"
            disabled={selectedScenarios.length === 0 && !radarShowAll}
            onClick={() => radarCaptureRef.current?.()}
            aria-label="capture view"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              px: 1.25,
              py: 0.5,
              border: "none",
              borderRadius: "12px",
              fontSize: "0.8125rem",
              fontWeight: 500,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              color: theme.palette.grey[800],
              background: theme.palette.grey[200],
              transition: "all 150ms ease",
              cursor:
                selectedScenarios.length === 0 && !radarShowAll
                  ? "default"
                  : "pointer",
              opacity:
                selectedScenarios.length === 0 && !radarShowAll ? 0.4 : 1,
              "&:hover": {
                background:
                  selectedScenarios.length === 0 && !radarShowAll
                    ? undefined
                    : theme.palette.interaction.selectedBackground,
                color:
                  selectedScenarios.length === 0 && !radarShowAll
                    ? undefined
                    : theme.palette.blue.bright,
              },
            }}
          >
            <icons.IosShare sx={{ fontSize: "0.875rem", flexShrink: 0 }} />
            capture view
          </Box>
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
    selectedScenarios,
    theme,
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
                      scenarioColors={
                        exploreMode === "radar"
                          ? radarScenarioColors
                          : undefined
                      }
                      hoveredInteraction={hoveredInteraction}
                      onRowHover={handleSidebarRowHover}
                      onCaptureRadarScenario={handleCaptureRadarScenario}
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
                    onOutcomeHover={handleOutcomeHover}
                    onScenarioColors={setRadarScenarioColors}
                    onCaptureReady={handleRadarCaptureReady}
                    onSingleCaptureReady={handleRadarSingleCaptureReady}
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
