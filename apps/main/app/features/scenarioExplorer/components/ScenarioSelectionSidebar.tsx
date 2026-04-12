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
import {
  Box,
  Typography,
  useTheme,
  Checkbox,
} from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import {
  StrategyHeader,
  OperationsIconGroup,
} from "../../scenarios/components/shared"
import { InlineRowActions } from "../strategyGrid"
import type { ScenarioTheme } from "../../../content/scenarios"
import { useOrderedScenarios } from "../hooks/useOrderedScenarios"
import ThemeGroupHeader from "./ThemeGroupHeader"
import SearchAndChips from "./SearchAndChips"

interface ScenarioSelectionSidebarProps {
  scenarioColors?: Record<string, string>
  hoveredScenarioId?: string | null
  onRowHover?: (scenarioIds: string[] | null) => void
}

export default function ScenarioSelectionSidebar({
  scenarioColors,
  hoveredScenarioId,
  onRowHover,
}: ScenarioSelectionSidebarProps) {
  const theme = useTheme()

  const {
    selectedScenarios,
    toggleScenario,
    highlightedScenario,
    pinnedScenarioIds,
    togglePinnedScenario,
    showDefinitions,
    showKeyOperations,
    groupByTheme,
    searchQuery,
    addToShare,
    outcomeDisplayMode,
  } = useScenarioExplorerStore()

  const scenarioRowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const activeScenarioId = highlightedScenario || hoveredScenarioId || null

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
                borderBottom: `1px solid ${theme.palette.grey[200]}`,
                backgroundColor: isActive ? `${accentColor}1A` : "transparent",
                opacity: isSearchDimmed ? 0.4 : 1,
                transition:
                  "background-color 200ms ease, opacity 200ms ease",
                "&:hover": {
                  backgroundColor: isActive
                    ? `${accentColor}26`
                    : theme.palette.interaction.selectedBackground,
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
                  descriptionMaxWidth="none"
                  showThemeBadge={!groupByTheme}
                  inlineActions={
                    <InlineRowActions
                      scenarioId={scenario.scenarioId}
                      scenarioLabel={scenario.label}
                      displayMode={outcomeDisplayMode as "summary" | "distribution"}
                      isPinned={isPinned}
                      accentColor={accentColor}
                      addToShare={addToShare}
                      togglePinnedScenario={togglePinnedScenario}
                    />
                  }
                />
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
