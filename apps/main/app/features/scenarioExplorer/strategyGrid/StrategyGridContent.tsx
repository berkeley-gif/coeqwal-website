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

import React, { useCallback, useMemo } from "react"
import { Box, Checkbox, useTheme } from "@repo/ui/mui"
import type {
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "../../scenarios/components/shared"
import { StrategyGridRow } from "./StrategyGridRow"
import type { LayoutMode } from "./StrategyGridHeader"
import type { TooltipScenarioContext } from "../../tooltips/useTierTooltipState"
import type { ScenarioTheme } from "../../../content/scenarios"
import { THEME_LABEL_CONFIG } from "../../../content/themes"

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
  /** Toggle all scenarios in a theme group (select/deselect) */
  onThemeGroupToggle?: (themeKey: string) => void
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
  onThemeGroupToggle,
  onIconClick,
}: StrategyGridContentProps) {
  const theme = useTheme()

  // The primary baseline scenario, shown by default, others hidden until expanded
  const PRIMARY_BASELINE_ID = "s0020"

  // Filter scenarios: chosen-only takes precedence, then baseline visibility
  const displayScenarios = (() => {
    // When showing only chosen scenarios, respect that fully.no baseline filtering
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

  const themeScenarioIds = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of displayScenarios) {
      if (s.theme) {
        const ids = map.get(s.theme) ?? []
        ids.push(s.scenarioId)
        map.set(s.theme, ids)
      }
    }
    return map
  }, [displayScenarios])

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

        // Show theme subheader when this is the first scenario in a new theme group
        const prevScenario = index > 0 ? filteredArray[index - 1] : undefined
        const isNewThemeGroup =
          showAllThemeDividers &&
          (index === 0 || scenario.theme !== prevScenario?.theme)

        const rows: React.ReactNode[] = []

        // Theme display: group subheader (unsorted) or per-row badge (sorted)
        if (scenario.theme) {
          const themeConfig =
            THEME_LABEL_CONFIG[scenario.theme as ScenarioTheme]
          const themeColors =
            theme.palette.waterThemes[scenario.theme as ScenarioTheme]

          if (themeConfig && themeColors) {
            if (isNewThemeGroup) {
              const themeKey = scenario.theme as string
              const themeIds = themeScenarioIds.get(themeKey) ?? []
              const allChecked =
                themeIds.length > 0 &&
                themeIds.every((id) => selectedScenarios.includes(id))
              const someChecked =
                !allChecked &&
                themeIds.some((id) => selectedScenarios.includes(id))

              // Unsorted: group subheader above first scenario in each theme group
              rows.push(
                <Box
                  key={`theme-header-${scenario.theme}-${index}`}
                  onClick={
                    onThemeGroupToggle
                      ? () => onThemeGroupToggle(themeKey)
                      : undefined
                  }
                  sx={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    mt: index === 0 ? 0 : theme.space.section.xs,
                    mb: 0.5,
                    px: 0.5,
                    cursor: onThemeGroupToggle ? "pointer" : "default",
                    borderRadius: "4px",
                    "&:hover": onThemeGroupToggle
                      ? { backgroundColor: `${themeColors.background}66` }
                      : undefined,
                  }}
                >
                  {onThemeGroupToggle && (
                    <Checkbox
                      size="small"
                      checked={allChecked}
                      indeterminate={someChecked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onThemeGroupToggle(themeKey)}
                      sx={{
                        padding: 0,
                        flexShrink: 0,
                        transform: "scale(0.8)",
                        color: themeColors.text,
                        "&.Mui-checked": { color: themeColors.text },
                        "&.MuiCheckbox-indeterminate": {
                          color: themeColors.text,
                        },
                      }}
                    />
                  )}
                  <Box
                    component="span"
                    sx={{
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: themeColors.text,
                      backgroundColor: themeColors.background,
                      px: "5px",
                      py: "1.5px",
                      borderRadius: "2px",
                      lineHeight: 1.2,
                    }}
                  >
                    {themeConfig.label}
                  </Box>
                </Box>,
              )
            }
          }
        }

        // Main scenario row
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

        // Theme group divider.separates theme-matching scenarios from the rest
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

        // Icon group divider.separates icon-matching scenarios from the rest
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

        return rows
      })}
    </>
  )
}

export default StrategyGridContent
