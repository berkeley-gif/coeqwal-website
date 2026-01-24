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

export interface StrategyGridContentProps {
  /** Scenarios to display */
  scenarios: ScenarioForDisplay[]
  /** Set of highlighted scenario IDs (search matches) */
  highlightedScenarios: Set<string>
  /** Whether to show search divider between highlighted and non-highlighted */
  showSearchDivider: boolean
  /** Selected/chosen scenario IDs */
  selectedScenarios: string[]
  /** Show only chosen scenarios */
  showOnlyChosen: boolean
  /** Show scenario descriptions */
  showDefinitions: boolean
  /** Compact layout mode */
  compact: boolean
  /** Layout mode for responsive behavior */
  layoutMode: LayoutMode
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
  /** Toggle tooltip (basic - no scenario context) */
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
  /** Toggle tooltip with scenario context (for accessibility) */
  onTooltipToggleWithContext?: (
    name: string,
    anchor: HTMLElement,
    context: TooltipScenarioContext,
  ) => void
  /** Sort change handler */
  onSortChange?: (outcome: string | null, direction: "asc" | "desc") => void
}

/**
 * StrategyGridContent renders the list of scenario rows with support for
 * search highlighting, summary panels, and search result dividers.
 */
export function StrategyGridContent({
  scenarios,
  highlightedScenarios,
  showSearchDivider,
  selectedScenarios,
  showOnlyChosen,
  showDefinitions,
  compact,
  layoutMode,
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
  onTooltipToggle,
  onTooltipToggleWithContext,
  onSortChange,
}: StrategyGridContentProps) {
  const theme = useTheme()

  // Filter scenarios if showOnlyChosen is enabled
  const displayScenarios = showOnlyChosen
    ? scenarios.filter((s) => selectedScenarios.includes(s.scenarioId))
    : scenarios

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

        const rows: React.ReactNode[] = []

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
            showDefinitions={showDefinitions}
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
            onTooltipToggle={createTooltipHandler(scenario)}
            onSortChange={onSortChange}
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

        return rows
      })}
    </>
  )
}

export default StrategyGridContent
