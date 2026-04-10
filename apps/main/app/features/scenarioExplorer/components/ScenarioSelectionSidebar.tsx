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
  IconButton,
  Tooltip,
  icons,
} from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import {
  StrategyHeader,
  OperationsIconGroup,
} from "../../scenarios/components/shared"
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
    sharedScenarioIds,
    addToShare,
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
          justifyContent: "space-between",
          px: 1.5,
          py: 0.5,
          minHeight: 44,
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

        {showKeyOperations && (
          <Typography
            variant="dashboard"
            sx={{
              color: theme.palette.explore.text,
              fontWeight: 500,
              flexShrink: 0,
              opacity: 0.7,
            }}
          >
            Key operations
          </Typography>
        )}
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
          py: 0.5,
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
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                px: 1.5,
                py: 1,
                cursor: "pointer",
                borderLeft: `3px solid ${
                  isActive || isChosen || isPinned ? accentColor : "transparent"
                }`,
                borderBottom: `1px solid ${theme.palette.grey[200]}`,
                backgroundColor: isActive ? `${accentColor}1A` : "transparent",
                opacity: isSearchDimmed ? 0.4 : 1,
                transition:
                  "background-color 200ms ease, border-color 200ms ease, opacity 200ms ease",
                "&:hover": {
                  backgroundColor: isActive
                    ? `${accentColor}26`
                    : theme.palette.interaction.selectedBackground,
                  borderLeftColor: accentColor,
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
                  mt: "2px",
                }}
              />

              {color && (
                <Box
                  aria-hidden="true"
                  sx={{
                    width: isActive ? 20 : 14,
                    height: 3,
                    borderRadius: "1.5px",
                    backgroundColor: color,
                    flexShrink: 0,
                    mt: "10px",
                    transition: "width 200ms ease",
                  }}
                />
              )}

              <Box
                onClick={() => toggleScenario(scenario.scenarioId)}
                sx={{ flex: 1, minWidth: 0 }}
              >
                <StrategyHeader
                  strategy={scenario}
                  titleVariant="body2"
                  showDescription={showDefinitions}
                  descriptionMaxWidth="none"
                  showThemeBadge={!groupByTheme}
                />
              </Box>

              <Box
                sx={{
                  overflow: "hidden",
                  width: showKeyOperations ? "auto" : 0,
                  opacity: showKeyOperations ? 1 : 0,
                  flexShrink: 0,
                  transition: "width 300ms ease, opacity 250ms ease",
                  display: "flex",
                  alignItems: "flex-start",
                  pt: "2px",
                }}
              >
                <OperationsIconGroup
                  scenarioId={scenario.scenarioId}
                  size="sm"
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.25,
                  flexShrink: 0,
                  mt: "2px",
                }}
              >
                {(() => {
                  const isShared = sharedScenarioIds.includes(
                    scenario.scenarioId,
                  )
                  return (
                    <Tooltip
                      title={isShared ? "Added to share" : "Add to share"}
                      arrow
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToShare(scenario.scenarioId)
                        }}
                        sx={{
                          p: 0.25,
                          opacity: isShared || isActive ? 1 : 0,
                          color: isShared
                            ? theme.palette.blue.bright
                            : isActive
                              ? "rgba(255,255,255,0.7)"
                              : theme.palette.grey[500],
                          transition: "opacity 200ms ease",
                          "*:hover > &": { opacity: 1 },
                        }}
                      >
                        <icons.IosShare sx={{ fontSize: "0.8rem" }} />
                      </IconButton>
                    </Tooltip>
                  )
                })()}

                <Tooltip title={isPinned ? "Unpin" : "Pin"} arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePinnedScenario(scenario.scenarioId)
                    }}
                    sx={{
                      p: 0.25,
                      opacity: isPinned || isActive ? 1 : 0,
                      color: isPinned ? accentColor : theme.palette.grey[500],
                      transition: "opacity 200ms ease",
                      "*:hover > &": { opacity: 1 },
                    }}
                  >
                    <icons.PushPin
                      sx={{
                        fontSize: "0.875rem",
                        transform: isPinned ? "none" : "rotate(45deg)",
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>,
          )

          return items
        })}
      </Box>
    </Box>
  )
}
