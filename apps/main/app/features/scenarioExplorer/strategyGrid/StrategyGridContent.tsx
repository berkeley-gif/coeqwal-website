"use client"

/**
 * StrategyGridContent - Scenario rows container for StrategyGrid
 *
 * Maps scenarios to StrategyGridRow components and handles:
 * - Search result dividers between highlighted and non-highlighted rows
 * - Filtering based on showOnlyChosen state
 *
 * This component is rendered when renderMode is "contentOnly" or "all".
 *
 * @see StrategyGridRow for individual row rendering
 * @see layoutConfig.ts for spacing constant documentation
 */

import React, { useCallback } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import type {
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "../../scenarios/components/shared"
import { StrategyGridRow } from "./StrategyGridRow"
import type { LayoutMode } from "./StrategyGridHeader"
import type { TooltipScenarioContext } from "../../tooltips/useTierTooltipState"
import type { ScenarioTheme } from "../../../content/scenarios"
import ThemeGroupHeader from "../components/ThemeGroupHeader"

export interface StrategyGridContentProps {
  /** Scenarios to display */
  scenarios: ScenarioForDisplay[]
  /** Set of highlighted scenario IDs (search matches) */
  highlightedScenarios: Set<string>
  /** Whether to show search divider between highlighted and non-highlighted */
  showSearchDivider: boolean
  /** Set of scenario IDs matching the active theme filter */
  themeMatchingScenarioIds?: Set<string>
  /** Whether to show a divider after the theme-matching group */
  showThemeDivider?: boolean
  /** Whether to show dividers between all adjacent scenarios with different themes */
  showAllThemeDividers?: boolean
  /** When true, shows ThemeGroupHeader subheaders above each theme group */
  groupByTheme?: boolean
  /** Set of scenario IDs matching the active icon filter */
  iconMatchingScenarioIds?: Set<string>
  /** Whether to show a divider after the icon-matching group */
  showIconDivider?: boolean
  /** Selected/chosen scenario IDs */
  selectedScenarios: string[]
  /** Show only chosen scenarios */
  showOnlyChosen: boolean
  /** Show alternative baseline scenarios */
  showAlternativeBaselines: boolean
  /** Compact layout mode */
  compact: boolean
  /** Layout mode for responsive behavior */
  layoutMode: LayoutMode
  /** When false, hides the key operations column */
  showOperations?: boolean
  /** When true, only outcomes are shown (no checkbox, title, or ops columns) */
  outcomesOnly?: boolean
  /** Outcome names with display info */
  outcomeNames: OutcomeName[]
  /** Get chart data for a scenario */
  getChartDataForScenario: (
    scenarioId: string,
  ) => Record<string, ChartDataPoint[]>
  /** Currently selected outcomes per scenario */
  selectedOutcomes: Record<string, string | null>
  /** Active tooltip outcome name */
  activeTooltip: string | null
  /** Current sort column */
  sortBy: string | null
  /** Sort direction */
  sortDirection: "asc" | "desc"
  /** Whether sort is enabled */
  sortEnabled: boolean
  /** Glyph size in pixels */
  glyphSize: number
  /** Whether in aligned grid mode */
  isAlignedGrid: boolean
  /** Toggle scenario selection */
  onToggleScenario: (scenarioId: string) => void
  /** Called when a tier glyph is clicked (for map visualization) */
  onTierClick?: (scenarioId: string, outcomeCode: string) => void
  /** Toggle tooltip (basic - no scenario context) */
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
  /** Toggle tooltip with scenario context (for accessibility) */
  onTooltipToggleWithContext?: (
    name: string,
    anchor: HTMLElement,
    context: TooltipScenarioContext,
  ) => void
  /** Sort change handler */
  onSortChange?: (outcomeCode: string | null, direction: "asc" | "desc") => void
  /** Select all scenarios sharing a theme when badge is clicked */
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  /** Select all scenarios sharing an operation icon when clicked */
  onIconClick?: (iconId: string) => void
}

/**
 * StrategyGridContent renders the list of scenario rows with support for
 * search highlighting, summary panels, and search result dividers.
 */
export function StrategyGridContent({
  scenarios,
  highlightedScenarios,
  showSearchDivider,
  themeMatchingScenarioIds,
  showThemeDivider = false,
  showAllThemeDividers = false,
  groupByTheme = false,
  iconMatchingScenarioIds,
  showIconDivider = false,
  selectedScenarios,
  showOnlyChosen,
  showAlternativeBaselines,
  compact,
  layoutMode,
  showOperations = true,
  outcomesOnly = false,
  outcomeNames,
  getChartDataForScenario,
  selectedOutcomes,
  activeTooltip,
  sortBy,
  sortDirection,
  sortEnabled,
  glyphSize,
  isAlignedGrid,
  onToggleScenario,
  onTierClick,
  onTooltipToggle,
  onTooltipToggleWithContext,
  onSortChange,
  onThemeBadgeClick,
  onIconClick,
}: StrategyGridContentProps) {
  const theme = useTheme()

  // The primary baseline scenario, shown by default, others hidden until expanded
  const PRIMARY_BASELINE_ID = "s0020"

  // Filter scenarios: chosen-only takes precedence, then baseline visibility
  const displayScenarios = (() => {
    // When showing only chosen scenarios, respect that fully — no baseline filtering
    if (showOnlyChosen) {
      return scenarios.filter((s) => selectedScenarios.includes(s.scenarioId))
    }
    // When showing all: hide alternative baselines unless toggled on
    if (!showAlternativeBaselines) {
      return scenarios.filter(
        (s) => s.theme !== "baseline" || s.scenarioId === PRIMARY_BASELINE_ID,
      )
    }
    return scenarios
  })()

  // Pre-compute scenario IDs per theme for ThemeGroupHeader
  const themeScenarioIds = React.useMemo(() => {
    if (!groupByTheme) return new Map<string, string[]>()
    const map = new Map<string, string[]>()
    for (const s of displayScenarios) {
      if (s.theme) {
        const ids = map.get(s.theme) ?? []
        ids.push(s.scenarioId)
        map.set(s.theme, ids)
      }
    }
    return map
  }, [groupByTheme, displayScenarios])

  // Create context-aware tooltip handler for a specific scenario
  // Includes chart data for accurate tier display in tooltips
  const createTooltipHandler = useCallback(
    (scenario: ScenarioForDisplay) => (name: string, anchor: HTMLElement) => {
      if (onTooltipToggleWithContext) {
        // Get chart data for this specific outcome to pass to tooltip
        const scenarioChartData = getChartDataForScenario(scenario.scenarioId)
        const outcomeChartData = scenarioChartData[name]

        onTooltipToggleWithContext(name, anchor, {
          scenarioId: scenario.scenarioId,
          scenarioLabel: scenario.label,
          chartData: outcomeChartData,
        })
      } else {
        onTooltipToggle(name, anchor)
      }
    },
    [onTooltipToggle, onTooltipToggleWithContext, getChartDataForScenario],
  )

  return (
    <>
      {displayScenarios.flatMap((scenario, index, filteredArray) => {
        const isHighlighted = highlightedScenarios.has(scenario.scenarioId)
        const nextScenario = filteredArray[index + 1]
        const isNextHighlighted = nextScenario
          ? highlightedScenarios.has(nextScenario.scenarioId)
          : false

        // Show divider between last highlighted and first non-highlighted
        const shouldShowDivider =
          showSearchDivider && isHighlighted && !isNextHighlighted

        // Show divider after the last theme-matching scenario (filtered view)
        const isThemeMatch =
          themeMatchingScenarioIds?.has(scenario.scenarioId) ?? false
        const isNextThemeMatch = nextScenario
          ? (themeMatchingScenarioIds?.has(nextScenario.scenarioId) ?? false)
          : false
        const shouldShowThemeDivider =
          showThemeDivider && isThemeMatch && !isNextThemeMatch

        // Show divider after the last icon-matching scenario
        const isIconMatch =
          iconMatchingScenarioIds?.has(scenario.scenarioId) ?? false
        const isNextIconMatch = nextScenario
          ? (iconMatchingScenarioIds?.has(nextScenario.scenarioId) ?? false)
          : false
        const shouldShowIconDivider =
          showIconDivider && isIconMatch && !isNextIconMatch

        // Show divider whenever adjacent scenarios belong to different theme groups
        // (skip when groupByTheme is true — headers handle the separation)
        const shouldShowThemeGroupDivider =
          !groupByTheme &&
          showAllThemeDividers &&
          nextScenario !== undefined &&
          scenario.theme !== nextScenario.theme

        const rows: React.ReactNode[] = []

        // Theme group header — before the first scenario in each theme group
        if (groupByTheme && scenario.theme) {
          const prevScenario = index > 0 ? filteredArray[index - 1] : undefined
          const isNewGroup =
            index === 0 || scenario.theme !== prevScenario?.theme
          if (isNewGroup) {
            const ids = themeScenarioIds.get(scenario.theme) ?? []
            rows.push(
              <Box
                key={`theme-header-${scenario.theme}`}
                sx={{ gridColumn: "1 / -1" }}
              >
                <ThemeGroupHeader
                  themeKey={scenario.theme as ScenarioTheme}
                  scenarioIds={ids}
                  isFirst={index === 0}
                />
              </Box>,
            )
          }
        }

        // Main scenario row
        // Use context-aware tooltip handler to include scenario info for accessibility
        rows.push(
          <StrategyGridRow
            key={scenario.scenarioId}
            scenario={scenario}
            isFirst={index === 0}
            isHighlighted={isHighlighted}
            isChosen={selectedScenarios.includes(scenario.scenarioId)}
            compact={compact}
            layoutMode={layoutMode}
            showOperations={showOperations}
            outcomesOnly={outcomesOnly}
            showAlternativeBaselines={showAlternativeBaselines}
            outcomeNames={outcomeNames}
            getChartDataForScenario={getChartDataForScenario}
            selectedOutcome={selectedOutcomes[scenario.scenarioId] ?? null}
            activeTooltip={activeTooltip}
            sortBy={sortBy}
            sortDirection={sortDirection}
            sortEnabled={sortEnabled}
            glyphSize={glyphSize}
            isAlignedGrid={isAlignedGrid}
            onToggleScenario={onToggleScenario}
            onTierClick={onTierClick}
            onTooltipToggle={createTooltipHandler(scenario)}
            onSortChange={onSortChange}
            showThemeBadge={!groupByTheme}
            onThemeBadgeClick={onThemeBadgeClick}
            onIconClick={onIconClick}
          />,
        )

        // Search result divider
        if (shouldShowDivider) {
          rows.push(
            <Box
              key={`divider-${scenario.scenarioId}`}
              sx={{
                gridColumn: "1 / -1",
                my: theme.space.section.sm,
                height: "1px",
                backgroundColor: theme.palette.grey[300],
              }}
            />,
          )
        }

        // Theme group divider — separates theme-matching scenarios from the rest
        if (shouldShowThemeDivider) {
          rows.push(
            <Box
              key={`theme-divider-${scenario.scenarioId}`}
              sx={{
                gridColumn: "1 / -1",
                my: theme.space.section.sm,
                height: "1px",
                backgroundColor: theme.palette.grey[300],
              }}
            />,
          )
        }

        // Icon group divider — separates icon-matching scenarios from the rest
        if (shouldShowIconDivider) {
          rows.push(
            <Box
              key={`icon-divider-${scenario.scenarioId}`}
              sx={{
                gridColumn: "1 / -1",
                my: theme.space.section.sm,
                height: "1px",
                backgroundColor: theme.palette.grey[300],
              }}
            />,
          )
        }

        // Theme group boundary divider — between every theme group in the default sort
        if (shouldShowThemeGroupDivider) {
          rows.push(
            <Box
              key={`theme-group-divider-${scenario.scenarioId}`}
              sx={{
                gridColumn: "1 / -1",
                my: theme.space.section.sm,
                height: "1px",
                backgroundColor: theme.palette.grey[300],
              }}
            />,
          )
        }

        return rows
      })}
    </>
  )
}

export default StrategyGridContent
