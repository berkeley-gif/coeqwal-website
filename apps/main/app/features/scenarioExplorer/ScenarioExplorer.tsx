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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Box, useTheme, icons } from "@repo/ui/mui"
import GetStartedView from "./getStarted/GetStartedView"
import UnifiedToolLayout from "./components/UnifiedToolLayout"
import ToolToolbar from "./components/ToolToolbar"
import ChartControlsBar from "./components/ChartControlsBar"
import ScenarioSelectionSidebar from "./components/ScenarioSelectionSidebar"
import ShareDrawer from "./components/ShareDrawer"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import ToolTour from "./components/ToolTour"
import { TourAnchorProvider, useTourAnchor } from "./tour/TourAnchorContext"
import {
  ComparisonPanel,
  EquityPanel,
  ResiliencePanel,
  ResilienceQuadrantPanel,
  RadarPanel,
} from "./exploreView"
import type {
  SingleScenarioCaptureFn,
  ResilienceControlsState,
} from "./exploreView"
import ResilienceControls from "./exploreView/ResilienceControls"
import { RESILIENCE_HYDROCLIMATES } from "./hooks/useResilienceMatrix"
import { PRIMARY_SCENARIO_BASELINE_ID } from "./utils/scenarioIdSort"
import ListView from "./exploreView/ListView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import { useScenarioExplorerStore } from "./store"
import type { ShareItem } from "./store"
import { useMapMode, mapActions } from "../map/store"
import { usePrefetchTiers } from "./hooks/usePrefetchTiers"

function SimpleButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  const theme = useTheme()

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
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
        "&:hover": {
          background: theme.palette.interaction.selectedBackground,
          color: theme.palette.blue.bright,
        },
      }}
    >
      {label}
    </Box>
  )
}

import { InlineToggleChip } from "./components/InlineToggleChip"

export default function ScenarioExplorer() {
  return (
    <TourAnchorProvider>
      <ScenarioExplorerInner />
    </TourAnchorProvider>
  )
}

function ScenarioExplorerInner() {
  const theme = useTheme()
  const {
    mainView,
    exploreMode,
    showMap,
    showEquityComparison,
    setShowEquityComparison,
    ensureBaselinePrePin,
  } = useScenarioExplorerStore()
  const mapMode = useMapMode()

  // On first entry to the explorer, pre-pin the baseline scenario so
  // downstream tools (Radar, Distribution, Resilience) are never empty.
  // The action is idempotent via the persisted `baselinePrePinned` flag,
  // so subsequent entries do nothing.
  useEffect(() => {
    if (mainView === "explorer") {
      ensureBaselinePrePin()
    }
  }, [mainView, ensureBaselinePrePin])

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

  /**
   * Hover coordination (sidebar ↔ tool panels in non-list modes).
   * `highlightedIds` is a transient Set from sidebar / theme-header row hover only.
   * Charts must keep `chosenIds` (selected scenarios) visible when this is set -
   * it adds emphasis for hovered IDs; it does not replace selection visibility.
   */
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
    hydroclimate,
    resilienceVisibleOutcomes,
    addShareItem,
  } = useScenarioExplorerStore()

  // Build a share item for the current Equity panel state and stage
  // it into the Share drawer. Image capture is a future enhancement;
  // for now we persist the metadata needed to reconstruct the view.
  const handleEquitySnapshot = useCallback(() => {
    const firstSelected = selectedScenarios[0]
    if (!firstSelected) return
    const item: ShareItem = {
      id: `equity-${firstSelected}-${Date.now()}`,
      type: "equity",
      scenarioId: firstSelected,
      outcomeCodes: resilienceVisibleOutcomes,
      compareToBaseline: showEquityComparison,
      hydroclimate,
    }
    addShareItem(item)
  }, [
    selectedScenarios,
    resilienceVisibleOutcomes,
    showEquityComparison,
    hydroclimate,
    addShareItem,
  ])

  // Resilience snapshot builder is defined below (after resilienceControls
  // state is declared) because it closes over that state.

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

  // Resilience heatmap controls (panel-local state, lifted here so the
  // toolbar and panel share one source of truth without store changes).
  // Default view is Aggregate because the sidebar starts empty; the
  // sync effect below flips to "scenario" the moment the sidebar has
  // at least one scenario selected, and back to "aggregate" when the
  // selection is cleared. Explicit user choices of "outcome" or
  // "quadrant" are preserved by the effect.
  const [resilienceControls, setResilienceControls] =
    useState<ResilienceControlsState>({
      view: "aggregate",
      cellEncoding: "tier",
      deltaMode: "none",
      deltaBaselineScenarioId: PRIMARY_SCENARIO_BASELINE_ID,
      aggregateScope: "all",
      reorderBySimilarity: false,
      showMarginals: false,
      showAllScenarios: false,
      expandedTileId: null,
      selectedHydroclimates: new Set(RESILIENCE_HYDROCLIMATES),
      showCellNumbers: true,
      quadrantUnit: "outcome",
      quadrantOutcome: "CWS_DEL",
      primaryOutcomeCode: null,
      compareOutcomeCodes: [],
      expandedRegionalOutcomes: [],
      scenarioLayout: "small_multiples",
      transposed: false,
      aggregateOver: "scenarios",
    })

  const handleResilienceControlsChange = useCallback(
    (next: Partial<ResilienceControlsState>) => {
      setResilienceControls((prev) => ({ ...prev, ...next }))
    },
    [],
  )

  const handleResilienceSnapshot = useCallback(() => {
    const item: ShareItem = {
      id: `resilience-${Date.now()}`,
      type: "resilience",
      view: resilienceControls.view,
      cellEncoding: resilienceControls.cellEncoding,
      scenarioIds: [...selectedScenarios],
      hydroclimates: Array.from(resilienceControls.selectedHydroclimates),
      outcomeCodes: resilienceVisibleOutcomes,
    }
    addShareItem(item)
  }, [
    resilienceControls,
    selectedScenarios,
    resilienceVisibleOutcomes,
    addShareItem,
  ])

  // Keep the Resilience "View:" rail in sync with the sidebar
  // selection. Empty selection anchors the rail on "View aggregate";
  // as soon as the user picks a scenario we flip to "View by
  // scenarios". Outcome and Leverage modes are explicit user choices
  // and are not overridden by this effect.
  const hasSelectedScenarios = selectedScenarios.length > 0
  useEffect(() => {
    setResilienceControls((prev) => {
      if (hasSelectedScenarios && prev.view === "aggregate") {
        return { ...prev, view: "scenario" }
      }
      if (!hasSelectedScenarios && prev.view === "scenario") {
        return { ...prev, view: "aggregate" }
      }
      return prev
    })
  }, [hasSelectedScenarios])

  // High-level orientation anchor for the radar tour: the entire
  // chart-controls row, so the user sees "these are the chart's
  // controls" before we step through each chip. The callback ref is
  // stable across renders (comes from useTourAnchor), so the useMemo
  // below does not need to depend on it.
  const radarChartToolbarRef = useTourAnchor("radar.chartToolbar")

  const chartControls = useMemo(() => {
    if (exploreMode === "radar") {
      return (
        <ChartControlsBar ref={radarChartToolbarRef}>
          <RadarTourAnchor anchorId="radar.axisChooser">
            <InlineToggleChip
              label="choose outcome axes"
              active={showAxisSelector}
              onClick={() => setShowAxisSelector(!showAxisSelector)}
            />
          </RadarTourAnchor>
          <RadarTourAnchor anchorId="radar.showAll">
            <InlineToggleChip
              label="show all scenarios"
              active={radarShowAll}
              onClick={() => setRadarShowAll(!radarShowAll)}
            />
          </RadarTourAnchor>
          <InlineToggleChip
            label="dots only"
            active={showDotsOnly}
            onClick={() => setShowDotsOnly(!showDotsOnly)}
          />
          <InlineToggleChip
            label="highlight current operations"
            active={highlightBaseline}
            onClick={() => setHighlightBaseline(!highlightBaseline)}
          />
          <RadarTourAnchor anchorId="radar.libraryRange">
            <InlineToggleChip
              label="show range"
              active={showRadarRange}
              onClick={() => setShowRadarRange(!showRadarRange)}
            />
          </RadarTourAnchor>
          <RadarTourAnchor anchorId="radar.capture">
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
          </RadarTourAnchor>
        </ChartControlsBar>
      )
    }
    if (exploreMode === "resilience") {
      return (
        <ChartControlsBar>
          <ResilienceControls
            controls={resilienceControls}
            onChange={handleResilienceControlsChange}
          />
          <Box
            component="button"
            type="button"
            onClick={handleResilienceSnapshot}
            aria-label="save snapshot"
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
              cursor: "pointer",
              transition: "all 150ms ease",
              "&:hover": {
                background: theme.palette.interaction.selectedBackground,
                color: theme.palette.blue.bright,
              },
            }}
          >
            <icons.IosShare sx={{ fontSize: "0.875rem", flexShrink: 0 }} />
            save snapshot
          </Box>
        </ChartControlsBar>
      )
    }
    if (exploreMode === "equity") {
      const canSnapshot = selectedScenarios.length > 0
      return (
        <ChartControlsBar>
          <InlineToggleChip
            label="Compare to Baseline"
            active={showEquityComparison}
            onClick={() => setShowEquityComparison(!showEquityComparison)}
          />
          <SimpleButton
            label="Clear Map Selection"
            onClick={() => mapActions.clearLocationHighlights()}
          />
          <Box
            component="button"
            type="button"
            disabled={!canSnapshot}
            onClick={handleEquitySnapshot}
            aria-label="save snapshot"
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
              cursor: canSnapshot ? "pointer" : "default",
              opacity: canSnapshot ? 1 : 0.4,
              transition: "all 150ms ease",
              "&:hover": {
                background: canSnapshot
                  ? theme.palette.interaction.selectedBackground
                  : undefined,
                color: canSnapshot ? theme.palette.blue.bright : undefined,
              },
            }}
          >
            <icons.IosShare sx={{ fontSize: "0.875rem", flexShrink: 0 }} />
            save snapshot
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
    showEquityComparison,
    setShowEquityComparison,
    selectedScenarios,
    theme,
    resilienceControls,
    handleResilienceControlsChange,
    handleEquitySnapshot,
    handleResilienceSnapshot,
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
                      singleSelect={exploreMode === "equity"}
                      onCaptureRadarScenario={handleCaptureRadarScenario}
                    />
                  )
                }
                toolbar={
                  <ToolToolbar
                    gridAligned={isListMode}
                    hideTitle={!isListMode}
                  />
                }
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
                {exploreMode === "resilience" &&
                  (resilienceControls.view === "quadrant" ? (
                    <ResilienceQuadrantPanel
                      controls={resilienceControls}
                      onControlsChange={handleResilienceControlsChange}
                      highlightedIds={highlightedIds}
                      onScenarioHover={handleToolScenarioHover}
                    />
                  ) : (
                    <ResiliencePanel
                      controls={resilienceControls}
                      highlightedIds={highlightedIds}
                      onScenarioHover={handleToolScenarioHover}
                      onControlsChange={handleResilienceControlsChange}
                    />
                  ))}
                {exploreMode === "data" && <DataExplorerView />}
              </UnifiedToolLayout>
            </Box>
          )}
        </Box>
      </Box>

      <KeyboardShortcuts />
      {mainView === "explorer" && <ShareDrawer />}
      {mainView === "explorer" && <ToolTour />}
    </Box>
  )
}

/**
 * Tiny inline-flex wrapper that registers its child node as a tour
 * anchor by id. Used to attach anchors to the Radar tool's chart
 * controls without restructuring the existing chip layout.
 */
function RadarTourAnchor({
  anchorId,
  children,
}: {
  anchorId: string
  children: React.ReactNode
}) {
  const ref = useTourAnchor(anchorId)
  return (
    <Box ref={ref} sx={{ display: "inline-flex", alignItems: "center" }}>
      {children}
    </Box>
  )
}
