"use client"

/**
 * StrategyGridContent - Scenario rows container for StrategyGrid
 *
 * Maps scenarios to StrategyGridRow components and handles:
 * - Search result dividers between highlighted and non-highlighted rows
 * - Summary panel rendering when an outcome is expanded
 * - Filtering based on showOnlyChosen state
 *
 * This component is rendered when renderMode is "contentOnly" or "all".
 *
 * @see StrategyGridRow for individual row rendering
 * @see layoutConfig.ts for spacing constant documentation
 */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { SummaryPanel } from "../../map/overlays/scenarioPanels"
import type {
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "../../scenarios/components/shared"
import { StrategyGridRow } from "./StrategyGridRow"
import type { LayoutMode } from "./StrategyGridHeader"

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
  /** Map view mode */
  showMapView: boolean
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
  /** Expanded summary outcomes per scenario */
  expandedSummaries: Record<string, string | null>
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
  /** Select outcome */
  onOutcomeSelect: (scenarioId: string, outcome: string) => void
  /** Tier click handler */
  onTierClick?: (scenarioId: string, outcome: string) => void
  /** Toggle summary panel */
  onToggleSummary: (scenarioId: string, outcome: string) => void
  /** Toggle tooltip */
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
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
  showMapView,
  compact,
  layoutMode,
  outcomeNames,
  getChartDataForScenario,
  selectedOutcomes,
  expandedSummaries,
  activeTooltip,
  sortBy,
  sortDirection,
  sortEnabled,
  glyphSize,
  isAlignedGrid,
  onToggleScenario,
  onOutcomeSelect,
  onTierClick,
  onToggleSummary,
  onTooltipToggle,
  onSortChange,
}: StrategyGridContentProps) {
  const theme = useTheme()

  // Filter scenarios if showOnlyChosen is enabled
  const displayScenarios = showOnlyChosen
    ? scenarios.filter((s) => selectedScenarios.includes(s.scenarioId))
    : scenarios

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
            expandedSummaryOutcome={expandedSummaries[scenario.scenarioId] ?? null}
            selectedOutcome={selectedOutcomes[scenario.scenarioId] ?? null}
            hasTierClick={!!onTierClick}
            activeTooltip={activeTooltip}
            sortBy={sortBy}
            sortDirection={sortDirection}
            sortEnabled={sortEnabled}
            glyphSize={glyphSize}
            isAlignedGrid={isAlignedGrid}
            onToggleScenario={onToggleScenario}
            onOutcomeSelect={onOutcomeSelect}
            onTierClick={onTierClick}
            onToggleSummary={onToggleSummary}
            onTooltipToggle={onTooltipToggle}
            onSortChange={onSortChange}
          />,
        )

        // Summary panel (shown when an outcome is expanded)
        const selectedOutcomeForSummary = expandedSummaries[scenario.scenarioId]
        if (selectedOutcomeForSummary && !showMapView) {
          rows.push(
            <SummaryRow
              key={`summary-${scenario.scenarioId}`}
              scenarioId={scenario.scenarioId}
              outcome={selectedOutcomeForSummary}
              onClose={() => onToggleSummary(scenario.scenarioId, selectedOutcomeForSummary)}
            />,
          )
        }

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

/**
 * SummaryRow - Expandable summary panel for a scenario outcome
 */
interface SummaryRowProps {
  scenarioId: string
  outcome: string
  onClose: () => void
}

function SummaryRow({ scenarioId, outcome, onClose }: SummaryRowProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: {
          xs: "32px minmax(0, 1fr)",
          lg: "32px minmax(0, 1fr)",
        },
        gap: theme.space.gap.sm,
        columnGap: theme.space.gap.lg,
        alignItems: "start",
        mb: theme.space.component.sm,
      }}
    >
      {/* Empty column for checkbox alignment */}
      <Box />

      {/* Summary content with close button */}
      <Box sx={{ pr: 2, position: "relative" }}>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: theme.space.component.sm,
            right: theme.space.component.sm,
            background: "none",
            ...theme.typography.body2,
            border: "none",
            cursor: "pointer",
            padding: theme.space.component.xs,
            display: "flex",
            alignItems: "center",
            color: theme.palette.grey[500],
            borderRadius: theme.borderRadius.circle,
            zIndex: 1,
            "&:hover": {
              color: theme.palette.grey[700],
              backgroundColor: theme.palette.grey[200],
            },
          }}
          aria-label="Close summary"
        >
          ×
        </Box>
        <SummaryPanel
          scenarioId={scenarioId}
          outcome={outcome}
          variant="inline"
        />
      </Box>
    </Box>
  )
}

export default StrategyGridContent
