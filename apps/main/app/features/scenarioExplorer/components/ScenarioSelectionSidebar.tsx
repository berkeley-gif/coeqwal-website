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

import React, { useMemo, useEffect, useRef } from "react"
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

interface ScenarioSelectionSidebarProps {
  scenarioColors?: Record<string, string>
  hoveredInteraction?: {
    scenarioId: string
    outcome?: string
    tierValue?: number
  } | null
  onRowHover?: (scenarioIds: string[] | null) => void
  onCaptureRadarScenario?: (
    scenarioId: string,
  ) => Promise<{ dataUrl: string; color: string } | null>
}

export default function ScenarioSelectionSidebar({
  scenarioColors,
  hoveredInteraction,
  onRowHover,
  onCaptureRadarScenario,
}: ScenarioSelectionSidebarProps) {
  const theme = useTheme()
  const tierColors = useMemo(() => getTierColorsFromTheme(theme), [theme])

  const {
    selectedScenarios,
    toggleScenario,
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

  const hoveredScenarioId = hoveredInteraction?.scenarioId ?? null
  const scenarioRowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const activeScenarioId = highlightedScenario || hoveredScenarioId || null
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

  const { orderedScenarios, matchingScenarioIds, isLoading } =
    useOrderedScenarios()

  const isSearchActive = searchQuery.trim().length > 0

  // Build theme → scenarioIds map for ThemeGroupHeader
  const themeScenarioIds = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of orderedScenarios) {
      if (s.theme) {
        const ids = map.get(s.theme) ?? []
        ids.push(s.scenarioId)
        map.set(s.theme, ids)
      }
    }
    return map
  }, [orderedScenarios])

  return (
    <Box
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
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "wrap",
          px: 1.5,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <SearchAndChips />
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
          const isSearchDimmed = isSearchActive && !isSearchMatch
          const color = scenarioColors?.[scenario.scenarioId]
          const accentColor = color || theme.palette.blue.bright
          const isActive =
            isPinned ||
            scenario.scenarioId === highlightedScenario ||
            scenario.scenarioId === hoveredScenarioId

          const prevScenario =
            index > 0 ? orderedScenarios[index - 1] : undefined
          const isNewThemeGroup =
            groupByTheme &&
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
                alignItems: "flex-start",
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                cursor: "pointer",
                overflow: "hidden",
                borderRadius: theme.borderRadius.sm,
                borderBottom: `1px solid ${theme.palette.grey[200]}`,
                "--row-bg": isActive
                  ? theme.palette.background.paper
                  : hasActiveScenario
                    ? "#f0eeeb"
                    : "#faf8f5",
                backgroundColor: "var(--row-bg)",
                opacity: isSearchDimmed ? 0.4 : 1,
                transition:
                  "background-color 0.2s ease, border-color 0.2s ease, opacity 200ms ease",
                "&:hover": {
                  "--row-bg": theme.palette.background.paper,
                  backgroundColor: "var(--row-bg)",
                },
              }}
            >
              <Checkbox
                size="small"
                checked={isChosen}
                onChange={() => toggleScenario(scenario.scenarioId)}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  ...theme.scenarios.checkbox.sm,
                  flexShrink: 0,
                  mt: "16px",
                }}
              />

              <Box
                onClick={() => toggleScenario(scenario.scenarioId)}
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
                  showThemeBadge={!groupByTheme}
                  inlineActions={
                    <InlineRowActions
                      scenarioId={scenario.scenarioId}
                      scenarioLabel={scenario.label}
                      displayMode={
                        outcomeDisplayMode as "summary" | "distribution"
                      }
                      isPinned={isPinned}
                      accentColor={accentColor}
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
                          })
                        } else {
                          const vm =
                            outcomeDisplayMode === "distribution"
                              ? "distribution"
                              : "summary"
                          addShareItem({
                            id: crypto.randomUUID(),
                            type: "barChart",
                            scenarioId: scenario.scenarioId,
                            viewMode: vm as "summary" | "distribution",
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
