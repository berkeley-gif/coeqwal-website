"use client"

/**
 * ScenarioSelectionSidebar. Persistent left-hand scenario list panel
 * used in non-list explore modes (radar, equity, data).
 *
 * 1. "Scenario library" header with key-ops column toggle
 * 2. Scrollable scenario list with StrategyHeader labels, checkboxes,
 *    and a collapsible key operations column
 *
 * Search and visibility controls now live in ToolToolbar.
 * Row order comes from useOrderedScenarios so it stays in lockstep
 * with the same shared ordering used by ListView.
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react"
import { Box, Typography, useTheme, Checkbox } from "@repo/ui/mui"
import { motion, AnimatePresence } from "@repo/motion"
import { useScenarioExplorerStore } from "../store"
import {
  StrategyHeader,
  OperationsIconGroup,
} from "../../scenarios/components/shared"
import { InlineRowActions } from "../strategyGrid"
import type { ScenarioTheme } from "../../../content/scenarios"
import { useOrderedScenarios } from "../hooks/useOrderedScenarios"
import { stageShareItem } from "../share/stage"
import { getTierLabel, getTierColorsFromTheme } from "../../../content/tiers"
import ThemeGroupHeader from "./ThemeGroupHeader"
import SearchAndChips from "./SearchAndChips"
import { useTourAnchor } from "../tour/TourAnchorContext"

interface ScenarioSelectionSidebarProps {
  scenarioColors?: Record<string, string>
  hoveredInteraction?: {
    scenarioId: string
    outcome?: string
    tierValue?: number
  } | null
  onRowHover?: (scenarioIds: string[] | null) => void
  singleSelect?: boolean
  onCaptureRadarScenario?: (scenarioId: string) => Promise<{
    svg: string
    dataUrl: string
    color: string
    chartData: Record<string, unknown>
  } | null>
  /**
   * Multi-scenario radar capture for the theme-header "share all"
   * action. Returns one combined chart with all scenarios overlaid
   * (radar's traces compose on a single canvas, unlike equity or
   * resilience which need one card per scenario).
   */
  onCaptureRadarScenarios?: (scenarioIds: string[]) => Promise<{
    svg: string
    dataUrl: string
    colors: string[]
    scenarioIds: string[]
    chartData: Record<string, unknown>
  } | null>
  onResilienceScenarioShare?: (scenarioId: string) => void | Promise<void>
  onEquityScenarioShare?: (scenarioId: string) => void | Promise<void>
}

export default function ScenarioSelectionSidebar({
  scenarioColors,
  hoveredInteraction,
  onRowHover,
  singleSelect = false,
  onCaptureRadarScenario,
  onCaptureRadarScenarios,
  onResilienceScenarioShare,
  onEquityScenarioShare,
}: ScenarioSelectionSidebarProps) {
  const theme = useTheme()
  const tierColors = useMemo(() => getTierColorsFromTheme(theme), [theme])

  const {
    selectedScenarios,
    toggleScenario,
    equityFocusScenario,
    setEquityFocusScenario,
    highlightedScenario,
    pinnedScenarioIds,
    togglePinnedScenario,
    showDefinitions,
    showKeyOperations,
    showOnlyChosen,
    groupByTheme,
    searchQuery,
    addShareItem,
    outcomeDisplayMode,
    exploreMode,
    hydroclimate,
    radarVisibleAxes,
    showRadarRange,
    showTierZones,
    highlightBaseline,
    showDotsOnly,
  } = useScenarioExplorerStore()

  // In single-select mode (Distribution / equity) a click sets the
  // orthogonal `equityFocusScenario` field so the shared multi-select
  // used by other tools is untouched. In multi-select mode we keep the
  // familiar toggle-into-selectedScenarios behavior.
  const handleScenarioSelect = (scenarioId: string) => {
    if (singleSelect) {
      setEquityFocusScenario(scenarioId)
    } else {
      toggleScenario(scenarioId)
    }
  }

  // Per-scenario share dispatcher. The sidebar is shown in every
  // non-list explore mode, so the share icon next to each row (and
  // the "share all" icon on the theme-group header, which calls
  // through this same path) must produce a card that matches the
  // panel currently on screen, not a list-view bar chart. Each
  // branch returns a promise so callers can await batch operations
  // (e.g. a theme-group share that iterates scenarios sequentially).
  const shareScenario = useCallback(
    async (scenarioId: string): Promise<void> => {
      if (exploreMode === "radar") {
        await stageShareItem({
          capture: () => onCaptureRadarScenario?.(scenarioId) ?? Promise.resolve(null),
          buildItem: (captured) => ({
            id: crypto.randomUUID(),
            type: "radar",
            scenarioIds: [scenarioId],
            scenarioColors: captured
              ? [captured.color]
              : scenarioColors
                ? [scenarioColors[scenarioId] ?? "#666666"]
                : undefined,
            axes: [...radarVisibleAxes],
            showRange: showRadarRange,
            showTierZones,
            highlightBaseline,
            showDotsOnly,
            hydroclimate,
            cachedSvg: captured?.svg,
            cachedImageDataUrl: captured?.dataUrl,
            cachedChartData: captured?.chartData,
          }),
          addItem: addShareItem,
          errorLabel: "ScenarioSelectionSidebar.shareScenario(radar)",
        })
        return
      }
      if (exploreMode === "equity" && onEquityScenarioShare) {
        await onEquityScenarioShare(scenarioId)
        return
      }
      if (exploreMode === "resilience" && onResilienceScenarioShare) {
        await onResilienceScenarioShare(scenarioId)
        return
      }
      // comparison and data modes (and any future mode without a
      // dedicated share variant) fall through to a list-view bar
      // chart. This matches what the row would have shared from
      // ListView, so the user gets a usable artifact rather than
      // nothing.
      addShareItem({
        id: crypto.randomUUID(),
        type: "barChart",
        scenarioId,
        viewMode: outcomeDisplayMode,
        hydroclimate,
      })
    },
    [
      exploreMode,
      onCaptureRadarScenario,
      onEquityScenarioShare,
      onResilienceScenarioShare,
      addShareItem,
      scenarioColors,
      radarVisibleAxes,
      showRadarRange,
      showTierZones,
      highlightBaseline,
      showDotsOnly,
      hydroclimate,
      outcomeDisplayMode,
    ],
  )

  // Theme-header share. Radar overlays multiple traces on a single
  // chart, so a "share all in theme" action collapses to one radar
  // card with every scenario in the theme. Equity / resilience can't
  // overlay (one chart per scenario, by design), so they iterate
  // `shareScenario` to produce N cards. The list-mode default
  // (StrategyGrid passing no override) keeps its bar-chart loop.
  // Sequential await on the per-scenario branch keeps off-screen
  // captures (resilience tile) from contending for the host.
  const shareThemeScenarios = useCallback(
    async (scenarioIds: string[]): Promise<void> => {
      if (scenarioIds.length === 0) return

      if (exploreMode === "radar") {
        const fallbackColors = scenarioColors
          ? scenarioIds.map((sid) => scenarioColors[sid] ?? "#666666")
          : undefined
        await stageShareItem({
          capture: () =>
            onCaptureRadarScenarios?.(scenarioIds) ?? Promise.resolve(null),
          buildItem: (captured) => ({
            id: crypto.randomUUID(),
            type: "radar",
            // Prefer the resolved order from the capture (it filtered
            // missing entries and deduped). If capture failed, fall
            // back to the requested list so the card still renders
            // live from the store.
            scenarioIds: captured?.scenarioIds ?? [...scenarioIds],
            scenarioColors: captured?.colors ?? fallbackColors,
            axes: [...radarVisibleAxes],
            showRange: showRadarRange,
            showTierZones,
            highlightBaseline,
            showDotsOnly,
            hydroclimate,
            cachedSvg: captured?.svg,
            cachedImageDataUrl: captured?.dataUrl,
            cachedChartData: captured?.chartData,
          }),
          addItem: addShareItem,
          errorLabel: "ScenarioSelectionSidebar.shareThemeScenarios(radar)",
        })
        return
      }

      for (const sid of scenarioIds) {
        await shareScenario(sid)
      }
    },
    [
      exploreMode,
      onCaptureRadarScenarios,
      addShareItem,
      scenarioColors,
      radarVisibleAxes,
      showRadarRange,
      showTierZones,
      highlightBaseline,
      showDotsOnly,
      hydroclimate,
      shareScenario,
    ],
  )

  const hoveredScenarioId = hoveredInteraction?.scenarioId ?? null
  const scenarioRowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const activeScenarioId = hoveredScenarioId ?? highlightedScenario ?? null
  const hasActiveScenario = activeScenarioId !== null

  useEffect(() => {
    if (!activeScenarioId) return
    const timer = setTimeout(() => {
      scenarioRowRefs.current
        .get(activeScenarioId)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 80)
    return () => clearTimeout(timer)
  }, [activeScenarioId])

  const {
    orderedScenarios,
    matchingScenarioIds,
    isLoading,
    scenariosInContiguousThemeOrder,
  } = useOrderedScenarios()

  const hasThemedScenarios = useMemo(
    () => orderedScenarios.some((s) => Boolean(s.theme)),
    [orderedScenarios],
  )
  const themeSubheaderMode =
    groupByTheme && scenariosInContiguousThemeOrder && hasThemedScenarios
  const showThemeBadgeOnRow = !themeSubheaderMode

  const isSearchActive = searchQuery.trim().length > 0

  // Build theme → scenarioIds for ThemeGroupHeader (only when subheaders are in use)
  const themeScenarioIds = useMemo(() => {
    if (!themeSubheaderMode) return new Map<string, string[]>()
    const map = new Map<string, string[]>()
    for (const s of orderedScenarios) {
      if (s.theme) {
        const ids = map.get(s.theme) ?? []
        ids.push(s.scenarioId)
        map.set(s.theme, ids)
      }
    }
    return map
  }, [orderedScenarios, themeSubheaderMode])

  const radarSidebarAnchorRef = useTourAnchor("radar.sidebar")
  const sidebarAnchorRef = useCallback(
    (el: HTMLElement | null) => {
      if (exploreMode === "radar") radarSidebarAnchorRef(el)
    },
    [radarSidebarAnchorRef, exploreMode],
  )

  // Separate anchor for the "search + visibility chips" strip inside
  // the sidebar. The radar tour uses it for a single brief review of
  // the scenario-list controls (the list view tour covers each chip
  // individually).
  const sidebarControlsAnchorRef = useTourAnchor("radar.sidebarControls")

  return (
    <Box
      ref={sidebarAnchorRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[50],
      }}
    >
      {/* Scenario library header */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          px: 1.5,
          pt: 0.5,
          pb: "5px",
          minHeight: 45,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.explore.background,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            lineHeight: 1.3,
            color: theme.palette.explore.text,
          }}
        >
          Scenario library
        </Typography>
      </Box>

      {/* Search + visibility chips */}
      <Box
        ref={sidebarControlsAnchorRef}
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "wrap",
          px: 1.5,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.common.white,
        }}
      >
        <SearchAndChips chipsEyebrow="Tune scenario list" />
      </Box>

      {/* Scrollable scenario list */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          pb: 4,
        }}
      >
        {isLoading && (
          <Typography
            variant="dashboard"
            sx={{ px: 1.5, py: 1, color: theme.palette.grey[500] }}
          >
            Loading…
          </Typography>
        )}

        {!isLoading && showOnlyChosen && selectedScenarios.length === 0 && (
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              py: 3,
              color: theme.palette.text.primary,
              textAlign: "center",
              display: "block",
            }}
          >
            Select a scenario to see it here
          </Typography>
        )}

        {orderedScenarios.flatMap((scenario, index) => {
          const isChosen = singleSelect
            ? scenario.scenarioId === equityFocusScenario
            : selectedScenarios.includes(scenario.scenarioId)
          const isPinned = pinnedScenarioIds.includes(scenario.scenarioId)
          const isSearchMatch =
            isSearchActive && matchingScenarioIds.has(scenario.scenarioId)
          // Match StrategyGridRow: search hit = white + blue ring. Other rows = #faf8f5 (no opacity dim)
          const color = scenarioColors?.[scenario.scenarioId]
          const accentColor = color || theme.palette.blue.bright
          const isActive =
            isPinned ||
            scenario.scenarioId === highlightedScenario ||
            scenario.scenarioId === hoveredScenarioId

          const prevScenario =
            index > 0 ? orderedScenarios[index - 1] : undefined
          const isNewThemeGroup =
            themeSubheaderMode &&
            (index === 0 || scenario.theme !== prevScenario?.theme)

          const items: React.ReactNode[] = []

          if (isNewThemeGroup && scenario.theme) {
            const ids = themeScenarioIds.get(scenario.theme) ?? []
            items.push(
              <ThemeGroupHeader
                key={`theme-header-${scenario.theme}-${index}`}
                themeKey={scenario.theme as ScenarioTheme}
                scenarioIds={ids}
                isFirst={index === 0}
                layout="flex"
                onRowHover={onRowHover}
                singleSelect={singleSelect}
                onShareScenarios={shareThemeScenarios}
              />,
            )
          }

          items.push(
            <Box
              key={scenario.scenarioId}
              data-scenario-id={scenario.scenarioId}
              ref={(el: HTMLDivElement | null) => {
                if (el) scenarioRowRefs.current.set(scenario.scenarioId, el)
                else scenarioRowRefs.current.delete(scenario.scenarioId)
              }}
              onMouseEnter={() => onRowHover?.([scenario.scenarioId])}
              onMouseLeave={() => onRowHover?.(null)}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                cursor: "pointer",
                overflow: "hidden",
                borderRadius: theme.borderRadius.sm,
                borderBottom: `1px solid ${theme.palette.grey[200]}`,
                ...(isSearchActive
                  ? {
                      "--row-bg": isActive
                        ? `${accentColor}1A`
                        : isSearchMatch
                          ? theme.palette.common.white
                          : "#faf8f5",
                      backgroundColor: "var(--row-bg)",
                      outline: isSearchMatch
                        ? `1px solid ${theme.palette.blue.bright}`
                        : "none",
                    }
                  : {
                      "--row-bg": isActive
                        ? theme.palette.background.paper
                        : hasActiveScenario
                          ? "#f0eeeb"
                          : "#faf8f5",
                      backgroundColor: "var(--row-bg)",
                    }),
                transition:
                  "background-color 0.2s ease, border-color 0.2s ease, border-left-color 0.2s ease",
                "&:hover": isSearchActive
                  ? {
                      "--row-bg": isActive
                        ? `${accentColor}26`
                        : theme.palette.background.paper,
                      backgroundColor: "var(--row-bg)",
                    }
                  : {
                      "--row-bg": theme.palette.background.paper,
                      backgroundColor: "var(--row-bg)",
                    },
              }}
            >
              {singleSelect ? (
                <Box
                  onClick={(e) => {
                    e.stopPropagation()
                    handleScenarioSelect(scenario.scenarioId)
                  }}
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: `2px solid ${isChosen ? theme.palette.primary.main : theme.palette.grey[400]}`,
                    backgroundColor: isChosen
                      ? theme.palette.primary.main
                      : "transparent",
                    flexShrink: 0,
                    mt: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                />
              ) : (
                <Checkbox
                  size="small"
                  checked={isChosen}
                  onChange={() => toggleScenario(scenario.scenarioId)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    ...theme.scenarios.checkbox.sm,
                    flexShrink: 0,
                  }}
                />
              )}

              <Box
                onClick={() => handleScenarioSelect(scenario.scenarioId)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  pr: showKeyOperations ? "140px" : 0,
                  transition: "padding-right 200ms ease",
                }}
              >
                <StrategyHeader
                  strategy={scenario}
                  titleVariant="body2"
                  compact
                  showDescription={showDefinitions}
                  expandDescription={
                    showDefinitions && scenario.scenarioId === hoveredScenarioId
                  }
                  descriptionMaxWidth="none"
                  showThemeBadge={showThemeBadgeOnRow}
                  titleStartAdornment={
                    color ? (
                      <Box
                        component="span"
                        sx={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: color,
                          flexShrink: 0,
                        }}
                      />
                    ) : undefined
                  }
                  inlineActions={
                    <InlineRowActions
                      scenarioId={scenario.scenarioId}
                      scenarioLabel={scenario.label}
                      displayMode={outcomeDisplayMode}
                      isPinned={isPinned}
                      accentColor={accentColor}
                      dense
                      shareIconNudgeTop="-2px"
                      onShare={() => {
                        void shareScenario(scenario.scenarioId)
                      }}
                      togglePinnedScenario={togglePinnedScenario}
                      hidePinning
                    />
                  }
                />

                <AnimatePresence>
                  {scenario.scenarioId === hoveredInteraction?.scenarioId &&
                    hoveredInteraction.outcome != null && (
                      <motion.div
                        key="outcome-hover-detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <Box sx={{ pt: 0.5, pb: 0.75 }}>
                          <Typography
                            variant="compactSubtitle"
                            sx={{
                              display: "block",
                              fontWeight: 500,
                              color: theme.palette.text.primary,
                            }}
                          >
                            {hoveredInteraction.outcome}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                              mt: 0.25,
                            }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "3px",
                                flexShrink: 0,
                                bgcolor:
                                  tierColors[
                                    Math.round(
                                      hoveredInteraction.tierValue!,
                                    ) as keyof typeof tierColors
                                  ] ?? theme.palette.grey[400],
                              }}
                            />
                            <Typography
                              variant="compactCaption"
                              sx={{ color: theme.palette.grey[600] }}
                            >
                              {getTierLabel(
                                Math.round(hoveredInteraction.tierValue!),
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    )}
                </AnimatePresence>
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 12,
                  bottom: 0,
                  width: 130,
                  display: "flex",
                  opacity: showKeyOperations ? 1 : 0,
                  pointerEvents: showKeyOperations ? "auto" : "none",
                  transition: "opacity 200ms ease",
                }}
              >
                <Box
                  sx={{
                    width: "1px",
                    flexShrink: 0,
                    backgroundColor: theme.palette.grey[300],
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    pt: 1,
                    ml: 1,
                    "& > .MuiBox-root": {
                      justifyContent: "center",
                    },
                  }}
                >
                  <OperationsIconGroup
                    scenarioId={scenario.scenarioId}
                    size="sm"
                    layout="horizontal"
                  />
                </Box>
              </Box>
            </Box>,
          )

          return items
        })}
      </Box>
    </Box>
  )
}
