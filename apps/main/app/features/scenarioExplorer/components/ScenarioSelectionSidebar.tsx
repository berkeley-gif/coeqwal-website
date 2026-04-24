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
    dataUrl: string
    color: string
    chartData: Record<string, unknown>
  } | null>
}

export default function ScenarioSelectionSidebar({
  scenarioColors,
  hoveredInteraction,
  onRowHover,
  singleSelect = false,
  onCaptureRadarScenario,
}: ScenarioSelectionSidebarProps) {
  const theme = useTheme()
  const tierColors = useMemo(() => getTierColorsFromTheme(theme), [theme])

  const {
    selectedScenarios,
    toggleScenario,
    selectScenarios,
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
    highlightBaseline,
    showDotsOnly,
  } = useScenarioExplorerStore()

  const handleScenarioSelect = (scenarioId: string) => {
    return singleSelect
      ? selectScenarios([scenarioId])
      : toggleScenario(scenarioId)
  }

  const hoveredScenarioId = hoveredInteraction?.scenarioId ?? null
  const scenarioRowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const activeScenarioId = hoveredScenarioId ?? highlightedScenario ?? null
  const hasActiveScenario = activeScenarioId !== null

  // When switching to single-select mode, keep only the first selected scenario
  useEffect(() => {
    if (singleSelect && selectedScenarios.length > 1) {
      const firstScenario = selectedScenarios[0]
      if (firstScenario) {
        selectScenarios([firstScenario])
      }
    }
  }, [singleSelect, selectedScenarios, selectScenarios])

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

  // The sidebar is a tour anchor for the resilience tour ("sidebar
  // drives the small multiples"). The radar tour also highlights the
  // sidebar as a high-level orientation step; merge both ids onto the
  // same DOM node so either registry resolves to the same outer Box.
  // Equity does not step through it.
  const resilienceSidebarAnchorRef = useTourAnchor("resilience.sidebar")
  const radarSidebarAnchorRef = useTourAnchor("radar.sidebar")
  const sidebarAnchorRef = useCallback(
    (el: HTMLElement | null) => {
      resilienceSidebarAnchorRef(el)
      if (exploreMode === "radar") radarSidebarAnchorRef(el)
    },
    [resilienceSidebarAnchorRef, radarSidebarAnchorRef, exploreMode],
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
          const isChosen = selectedScenarios.includes(scenario.scenarioId)
          const isPinned = pinnedScenarioIds.includes(scenario.scenarioId)
          const isSearchMatch =
            isSearchActive && matchingScenarioIds.has(scenario.scenarioId)
          // Match StrategyGridRow: search hit = white + blue ring; other rows = #faf8f5 (no opacity dim)
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
                      onShare={async () => {
                        if (exploreMode === "radar") {
                          const result = await onCaptureRadarScenario?.(
                            scenario.scenarioId,
                          )
                          addShareItem({
                            id: crypto.randomUUID(),
                            type: "radar",
                            scenarioIds: [scenario.scenarioId],
                            scenarioColors: result
                              ? [result.color]
                              : scenarioColors
                                ? [
                                    scenarioColors[scenario.scenarioId] ??
                                      "#666666",
                                  ]
                                : undefined,
                            axes: [...radarVisibleAxes],
                            showRange: showRadarRange,
                            highlightBaseline,
                            showDotsOnly,
                            hydroclimate,
                            cachedImageDataUrl: result?.dataUrl,
                            cachedChartData: result?.chartData,
                          })
                        } else {
                          addShareItem({
                            id: crypto.randomUUID(),
                            type: "barChart",
                            scenarioId: scenario.scenarioId,
                            viewMode: outcomeDisplayMode,
                            hydroclimate,
                          })
                        }
                      }}
                      togglePinnedScenario={togglePinnedScenario}
                      hidePinning={exploreMode === "radar"}
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
