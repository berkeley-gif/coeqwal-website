"use client"

/**
 * ScenarioExplorer - Explore tab tool area
 *
 * Note that tool navigation (ExploreSubNav) has been lifted to the page shell so it
 * can be part of the sticky stacking alongside SmoothTabs. This
 * component renders the active view in the tool tab area.
 *
 * All explore toolmodes route through UnifiedToolLayout:
 *   - List mode: no sidebar, ToolToolbar (because of its grid layout)
 *   - Other modes: ScenarioSelectionSidebar + ToolToolbar + ChartControlsBar
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { ErrorBoundary } from "@repo/utils"
import { ErrorFallback } from "@repo/ui"
import GetStartedView from "./getStarted/GetStartedView"
import { useExploreHoverCoordination } from "./orchestration/useExploreHoverCoordination"
import UnifiedToolLayout from "./tools/chrome/layout/UnifiedToolLayout"
import ToolToolbar from "./tools/chrome/toolbar/ToolToolbar"
import ChartControlsBar from "./tools/chrome/layout/ChartControlsBar"
import ScenarioSelectionSidebar from "./tools/chrome/sidebar/ScenarioSelectionSidebar"
import ShareDrawer from "./share/ShareDrawer"
import KeyboardShortcuts from "./tools/chrome/overlays/KeyboardShortcuts"
import ToolTour from "./tools/chrome/overlays/ToolTour"
import { InlineToggleChip } from "./tools/chrome/chips/InlineToggleChip"
import { SaveSnapshotButton } from "./tools/chrome/SaveSnapshotButton"
import { SimpleButton } from "./tools/chrome/SimpleButton"
import { RadarTourAnchor } from "./tools/chrome/RadarTourAnchor"
import {
  TourAnchorProvider,
  useTourAnchor,
} from "./tools/tour/TourAnchorContext"
import { BASELINE_SCENARIO_ID } from "./constants"
import {
  EquityPanel,
  ResiliencePanel,
  RadarPanel,
  ListView,
  DataExplorerView,
  ResilienceControls,
} from "./tools"
import type {
  SingleScenarioCaptureFn,
  MultiScenarioCaptureFn,
  ResilienceControlsState,
  ResilienceCaptureFn,
  ResilienceTileCaptureFn,
  ResilienceScenarioSoloCaptureFn,
} from "./tools"
import { captureEquityOffscreen } from "./tools/panels/equity/OffscreenEquityCapture"
import { stageShareItem } from "./share/stage"
import { RESILIENCE_HYDROCLIMATES } from "./tools/panels/resilience/useResilienceMatrix"
import { PRIMARY_SCENARIO_BASELINE_ID } from "./utils/scenarioIdSort"
import { useScenarioExplorerStore } from "./store"
import type { ShareItem } from "./store"
import { useMapMode, mapActions } from "../map/store"
import { usePrefetchTiers } from "./tools/hooks/usePrefetchTiers"

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

  const {
    highlightedIds,
    hoveredInteraction,
    onSidebarRowHover,
    onChartHover,
  } = useExploreHoverCoordination()

  const [radarScenarioColors, setRadarScenarioColors] = useState<
    Record<string, string>
  >({})

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
    equityFocusScenario,
    hydroclimate,
    resilienceVisibleOutcomes,
    addShareItem,
  } = useScenarioExplorerStore()

  // Stage an equity share item, capturing an off-screen TierGrid SVG
  // for the requested scenario so the share card has a real
  // thumbnail and PNG / SVG download both work. Failures fall back to
  // a no-cache item; the card then text-renders without a chart but
  // does not block the user.
  const stageEquityShareItem = useCallback(
    async (scenarioId: string) =>
      stageShareItem({
        capture: () =>
          captureEquityOffscreen({
            scenarioId,
            compareToBaseline: showEquityComparison,
            theme,
          }),
        buildItem: (captured) => ({
          id: `equity-${scenarioId}-${Date.now()}`,
          type: "equity",
          scenarioId,
          outcomeCodes: resilienceVisibleOutcomes,
          compareToBaseline: showEquityComparison,
          hydroclimate,
          cachedSvg: captured?.svg,
          cachedImageDataUrl: captured?.dataUrl,
          cachedChartData: captured?.chartData as
            | Record<string, unknown>
            | undefined,
        }),
        addItem: addShareItem,
        errorLabel: "ScenarioExplorer.captureEquityOffscreen",
      }),
    [
      resilienceVisibleOutcomes,
      showEquityComparison,
      hydroclimate,
      addShareItem,
      theme,
    ],
  )

  // Toolbar "save snapshot" button. Defaults to the baseline when no
  // scenario is in focus to mirror EquityPanel's rendering contract.
  const handleEquitySnapshot = useCallback(() => {
    const focused = equityFocusScenario ?? BASELINE_SCENARIO_ID
    if (!focused) return
    void stageEquityShareItem(focused)
  }, [equityFocusScenario, stageEquityShareItem])

  // Sidebar row + theme-header share entry point. Captures the row's
  // scenario regardless of focus.
  const handleEquitySidebarScenarioShare = useCallback(
    (scenarioId: string) => {
      void stageEquityShareItem(scenarioId)
    },
    [stageEquityShareItem],
  )

  // Resilience snapshot builder is defined below (after resilienceControls
  // state is declared) because it closes over that state.

  const radarCaptureRef = useRef<(() => Promise<void>) | null>(null)
  const radarSingleCaptureRef = useRef<SingleScenarioCaptureFn | null>(null)
  const radarMultiCaptureRef = useRef<MultiScenarioCaptureFn | null>(null)

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

  const handleRadarMultiCaptureReady = useCallback(
    (capture: MultiScenarioCaptureFn) => {
      radarMultiCaptureRef.current = capture
    },
    [],
  )

  // Mirrors RadarPanel's `filteredData.length > 0`; drives the
  // toolbar "save snapshot" button's disabled state. Default false
  // so the button starts dimmed during the brief mount window
  // before RadarPanel fires the callback with the real value.
  const [canCaptureRadar, setCanCaptureRadar] = useState(false)
  const handleRadarCanCaptureChange = useCallback((canCapture: boolean) => {
    setCanCaptureRadar(canCapture)
  }, [])

  // Sidebar share-icon gate: enabled iff the radar has at least one
  // axis selected. Independent of `canCaptureRadar` because sidebar
  // actions capture explicitly chosen scenarios rather than whatever
  // is currently on the chart, so they don't care about trace count.
  const [canShareRadarFromSidebar, setCanShareRadarFromSidebar] =
    useState(false)
  const handleRadarCanShareFromSidebarChange = useCallback(
    (canShare: boolean) => {
      setCanShareRadarFromSidebar(canShare)
    },
    [],
  )

  const handleCaptureRadarScenario = useCallback(async (scenarioId: string) => {
    return radarSingleCaptureRef.current?.(scenarioId) ?? null
  }, [])

  const handleCaptureRadarScenarios = useCallback(
    async (scenarioIds: string[]) => {
      return radarMultiCaptureRef.current?.(scenarioIds) ?? null
    },
    [],
  )

  // Resilience capture plumbing. Refs let the toolbar "save snapshot"
  // button and sidebar share actions dispatch to the mounted panel.
  const resilienceCaptureRef = useRef<ResilienceCaptureFn | null>(null)
  const resilienceTileCaptureRef = useRef<ResilienceTileCaptureFn | null>(null)
  const resilienceScenarioSoloCaptureRef =
    useRef<ResilienceScenarioSoloCaptureFn | null>(null)

  const handleResilienceCaptureReady = useCallback(
    (capture: ResilienceCaptureFn) => {
      resilienceCaptureRef.current = capture
    },
    [],
  )

  const handleResilienceTileCaptureReady = useCallback(
    (capture: ResilienceTileCaptureFn) => {
      resilienceTileCaptureRef.current = capture
    },
    [],
  )

  const handleResilienceScenarioSoloCaptureReady = useCallback(
    (capture: ResilienceScenarioSoloCaptureFn) => {
      resilienceScenarioSoloCaptureRef.current = capture
    },
    [],
  )

  // Resilience heatmap controls (panel-local state, lifted here so the
  // toolbar and panel share one source of truth without store changes).
  // Default view is Aggregate because the sidebar starts empty. The
  // sync effect below flips to "scenario" the moment the sidebar has
  // at least one scenario selected, and back to "aggregate" when the
  // selection is cleared. Explicit user choices of "outcome" are
  // preserved by the effect.
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
      selectedHydroclimates: new Set(RESILIENCE_HYDROCLIMATES),
      showCellNumbers: false,
      primaryOutcomeCode: null,
      compareOutcomeCodes: [],
      expandedRegionalOutcomes: [],
      transposed: false,
      aggregateOver: "scenarios",
    })

  const handleResilienceControlsChange = useCallback(
    (next: Partial<ResilienceControlsState>) => {
      setResilienceControls((prev) => ({ ...prev, ...next }))
    },
    [],
  )

  const handleResilienceSnapshot = useCallback(async () => {
    const base = {
      id: `resilience-${Date.now()}`,
      type: "resilience" as const,
      view: resilienceControls.view,
      cellEncoding: resilienceControls.cellEncoding,
      scenarioIds: [...selectedScenarios],
      hydroclimates: Array.from(resilienceControls.selectedHydroclimates),
      outcomeCodes: resilienceVisibleOutcomes,
      showCellNumbers: resilienceControls.showCellNumbers,
    }

    let capture: {
      svg?: string
      dataUrl?: string
      chartData?: Record<string, unknown>
      tileLabel?: string
      tileScope?: "panel"
    } = {}

    const result = await resilienceCaptureRef.current?.()
    if (result) {
      capture = {
        svg: result.svg,
        dataUrl: result.dataUrl,
        chartData: result.chartData as unknown as Record<string, unknown>,
        tileScope: "panel",
      }
    } else {
      capture = { tileScope: "panel" }
    }

    const item: ShareItem = {
      ...base,
      tileScope: capture.tileScope,
      tileLabel: capture.tileLabel,
      cachedSvg: capture.svg,
      cachedImageDataUrl: capture.dataUrl,
      cachedChartData: capture.chartData,
    }
    addShareItem(item)
  }, [
    resilienceControls,
    selectedScenarios,
    resilienceVisibleOutcomes,
    addShareItem,
  ])

  const handleResilienceTileSnapshot = useCallback(
    async (
      tileId: string,
      options?: { scenarioIdsForShare?: string[] },
    ): Promise<boolean> => {
      const result = await resilienceTileCaptureRef.current?.(tileId)
      if (!result) return false
      const item: ShareItem = {
        id: `resilience-${Date.now()}-${tileId}`,
        type: "resilience",
        view: result.chartData.view,
        cellEncoding: result.chartData.cellEncoding,
        scenarioIds: options?.scenarioIdsForShare ?? [...selectedScenarios],
        hydroclimates: Array.from(resilienceControls.selectedHydroclimates),
        outcomeCodes: resilienceVisibleOutcomes,
        showCellNumbers: resilienceControls.showCellNumbers,
        tileScope: result.chartData.tileScope,
        tileId,
        tileLabel: result.chartData.tileLabel,
        cachedSvg: result.svg,
        cachedImageDataUrl: result.dataUrl,
        cachedChartData: result.chartData as unknown as Record<string, unknown>,
      }
      addShareItem(item)
      return true
    },
    [
      selectedScenarios,
      resilienceControls,
      resilienceVisibleOutcomes,
      addShareItem,
    ],
  )

  // Sidebar share for resilience always produces a scenario-scoped
  // tile (this scenario's outcomes x hydroclimates), regardless of
  // the live panel's current view. The synthesized solo capture
  // path keeps the sidebar share predictable: clicking the share
  // icon next to a scenario row gives a card about that scenario,
  // mirroring how radar (single trace) and equity (single
  // distribution) sidebar shares behave. The earlier behavior
  // delegated to the panel-wide capture in non-byScenario views,
  // which threw away the row click signal.
  const handleResilienceSidebarScenarioShare = useCallback(
    async (scenarioId: string): Promise<void> => {
      const result =
        await resilienceScenarioSoloCaptureRef.current?.(scenarioId)
      if (!result) return
      const item: ShareItem = {
        id: `resilience-${Date.now()}-${scenarioId}`,
        type: "resilience",
        view: result.chartData.view,
        cellEncoding: result.chartData.cellEncoding,
        scenarioIds: [scenarioId],
        hydroclimates: Array.from(resilienceControls.selectedHydroclimates),
        outcomeCodes: resilienceVisibleOutcomes,
        showCellNumbers: resilienceControls.showCellNumbers,
        tileScope: result.chartData.tileScope,
        tileId: scenarioId,
        tileLabel: result.chartData.tileLabel,
        cachedSvg: result.svg,
        cachedImageDataUrl: result.dataUrl,
        cachedChartData: result.chartData as unknown as Record<string, unknown>,
      }
      addShareItem(item)
    },
    [resilienceControls, resilienceVisibleOutcomes, addShareItem],
  )

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
          <RadarTourAnchor anchorId="radar.highlightBaseline">
            <InlineToggleChip
              label="highlight current operations"
              active={highlightBaseline}
              onClick={() => setHighlightBaseline(!highlightBaseline)}
            />
          </RadarTourAnchor>
          <RadarTourAnchor anchorId="radar.libraryRange">
            <InlineToggleChip
              label="show range"
              active={showRadarRange}
              onClick={() => setShowRadarRange(!showRadarRange)}
            />
          </RadarTourAnchor>
          <RadarTourAnchor anchorId="radar.capture">
            <SaveSnapshotButton
              disabled={!canCaptureRadar}
              onClick={() => void radarCaptureRef.current?.()}
            />
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
            onSaveSnapshot={handleResilienceSnapshot}
          />
        </ChartControlsBar>
      )
    }
    if (exploreMode === "equity") {
      const canSnapshot = equityFocusScenario !== null
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
          <SaveSnapshotButton
            disabled={!canSnapshot}
            onClick={handleEquitySnapshot}
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
    showEquityComparison,
    setShowEquityComparison,
    equityFocusScenario,
    theme,
    resilienceControls,
    handleResilienceControlsChange,
    handleEquitySnapshot,
    handleResilienceSnapshot,
    radarChartToolbarRef,
    canCaptureRadar,
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
          {mainView === "get-started" && (
            <ErrorBoundary
              fallback={
                <ErrorFallback
                  title="Get started couldn't load"
                  message="This might be a temporary issue. Try refreshing the page or switch to the Tools sub-tab."
                />
              }
            >
              <GetStartedView />
            </ErrorBoundary>
          )}

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
                      onRowHover={onSidebarRowHover}
                      singleSelect={exploreMode === "equity"}
                      onCaptureRadarScenario={handleCaptureRadarScenario}
                      onCaptureRadarScenarios={handleCaptureRadarScenarios}
                      onResilienceScenarioShare={
                        exploreMode === "resilience"
                          ? handleResilienceSidebarScenarioShare
                          : undefined
                      }
                      onEquityScenarioShare={
                        exploreMode === "equity"
                          ? handleEquitySidebarScenarioShare
                          : undefined
                      }
                      shareDisabled={
                        exploreMode === "radar" && !canShareRadarFromSidebar
                      }
                      shareDisabledTooltip={
                        exploreMode === "radar"
                          ? "Select at least one axis to share"
                          : undefined
                      }
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
                <ErrorBoundary
                  key={exploreMode}
                  fallback={
                    <ErrorFallback
                      title="This tool couldn't load"
                      message="Try a different tool above, or refresh the page."
                    />
                  }
                >
                  {isListMode && <ListView highlightedIds={highlightedIds} />}
                  {exploreMode === "radar" && (
                    <RadarPanel
                      highlightedIds={highlightedIds}
                      onChartHover={onChartHover}
                      onScenarioColors={setRadarScenarioColors}
                      onCaptureReady={handleRadarCaptureReady}
                      onSingleCaptureReady={handleRadarSingleCaptureReady}
                      onMultiCaptureReady={handleRadarMultiCaptureReady}
                      onCanCaptureChange={handleRadarCanCaptureChange}
                      onCanShareFromSidebarChange={
                        handleRadarCanShareFromSidebarChange
                      }
                    />
                  )}
                  {exploreMode === "equity" && (
                    <EquityPanel
                      highlightedIds={highlightedIds}
                      onChartHover={onChartHover}
                    />
                  )}
                  {exploreMode === "resilience" && (
                    <ResiliencePanel
                      controls={resilienceControls}
                      highlightedIds={highlightedIds}
                      onChartHover={onChartHover}
                      onControlsChange={handleResilienceControlsChange}
                      onCaptureReady={handleResilienceCaptureReady}
                      onCaptureTileReady={handleResilienceTileCaptureReady}
                      onCaptureScenarioSoloReady={
                        handleResilienceScenarioSoloCaptureReady
                      }
                      onTileShare={handleResilienceTileSnapshot}
                    />
                  )}
                  {exploreMode === "data" && <DataExplorerView />}
                </ErrorBoundary>
              </UnifiedToolLayout>
            </Box>
          )}
        </Box>
      </Box>

      <KeyboardShortcuts />
      {mainView === "explorer" && (
        <ErrorBoundary fallback={null}>
          <ShareDrawer />
        </ErrorBoundary>
      )}
      {mainView === "explorer" && (
        <ErrorBoundary fallback={null}>
          <ToolTour />
        </ErrorBoundary>
      )}
    </Box>
  )
}
