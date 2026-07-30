"use client"

/**
 * StrategyGridRow - Single scenario row in the StrategyGrid
 *
 * Uses CSS subgrid to inherit column definitions from parent StrategyGrid,
 * (ensuring vertical alignment between components)
 *
 * @see layoutConfig.ts for spacing constant documentation
 */

import React, { useCallback } from "react"
import { Box, useTheme, Checkbox } from "@repo/ui/mui"
import type {
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "../../../../../../scenarios/components/shared"
import { useWorkspaceSlice } from "../../../../store"
import { useTourAnchor } from "../../../tour"
import type { LayoutMode } from "./StrategyGridHeader"
import type { ScenarioTheme } from "../../../../../../../content/scenarios"
import { captureBarChartRow } from "./captureBarChartRow"
import { stageShareItem } from "../../../../share/stage"
import { NonCompactRowContent } from "./StrategyGridRowLayouts"

export interface StrategyGridRowProps {
  /** Scenario data to display */
  scenario: ScenarioForDisplay
  /** Whether this is the first row (adds top margin) */
  isFirst: boolean
  /**
   * First visible scenario row in the list: only this row registers the List tour
   * pin control anchor (`list.row.pin`). Differs from `isFirst` when group-by-theme
   * is on or when pinned rows precede this block.
   */
  tourListFirstItem?: boolean
  /** Whether this row is highlighted (search result match) */
  isHighlighted: boolean
  /** Whether this scenario is selected/chosen */
  isChosen: boolean
  /** Layout mode for responsive behavior */
  layoutMode: LayoutMode
  /** When false, hides the key operations column */
  showOperations?: boolean
  /** Outcome names - used only for the row's share-to-drawer capture, not rendered */
  outcomeNames: OutcomeName[]
  /** Get chart data for this scenario - used only for the row's share-to-drawer capture */
  getChartDataForScenario: (
    scenarioId: string,
  ) => Record<string, ChartDataPoint[]>
  /** Glyph size in pixels, forwarded to the off-screen share capture */
  glyphSize: number
  /** Toggle scenario selection */
  onToggleScenario: (scenarioId: string) => void
  /** Whether to show inline theme badge on each row */
  showThemeBadge?: boolean
  /** Select all scenarios sharing a theme when badge is clicked */
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  /** Select all scenarios sharing an operation icon when clicked */
  onIconClick?: (iconId: string) => void
  /** Optional color for accent border and swatch */
  scenarioColor?: string
  /** Whether this row is in an "active" state (hovered/highlighted externally) */
  isActive?: boolean
  /** Called on mouse enter/leave for hover sync with other panels */
  onRowHover?: (scenarioIds: string[] | null) => void
}

/**
 * StrategyGridRow renders a single scenario as a grid row.
 */
export const StrategyGridRow = React.memo(function StrategyGridRow({
  scenario,
  isFirst,
  tourListFirstItem = false,
  isHighlighted,
  isChosen,
  layoutMode,
  showOperations = true,
  outcomeNames,
  getChartDataForScenario,
  glyphSize,
  onToggleScenario,
  showThemeBadge = true,
  onThemeBadgeClick,
  onIconClick,
  scenarioColor,
  isActive = false,
  onRowHover,
}: StrategyGridRowProps) {
  const theme = useTheme()
  const outcomeDisplayMode = useWorkspaceSlice((s) => s.outcomeDisplayMode)
  const isListMode = useWorkspaceSlice((s) => s.exploreMode === "list")
  const showDefinitions = useWorkspaceSlice((s) => s.showDefinitions)
  const addShareItem = useWorkspaceSlice((s) => s.addShareItem)
  const hydroclimate = useWorkspaceSlice((s) => s.hydroclimate)

  const accentColor = scenarioColor || theme.palette.blue.bright

  // Tour anchors. Only the first list exemplar row registers (see
  // `tourListFirstItem`), so the tour highlights one checkbox / pin / share
  // instead of bulk-registering all rows.
  const listSelectCheckboxTourRef = useTourAnchor("list.select.checkbox")
  const listRowPinTourRef = useTourAnchor("list.row.pin")
  const listRowShareTourRef = useTourAnchor("list.row.share")
  const listRowOperationsTourRef = useTourAnchor("list.row.operations")

  // Chart data feeds only the off-screen share capture below - outcomes
  // are never rendered in this row (they live in the Bar tool now).
  const scenarioChartData = getChartDataForScenario(scenario.scenarioId)

  const handleShare = useCallback(
    () =>
      stageShareItem({
        capture: () =>
          captureBarChartRow({
            outcomeNames,
            chartData: scenarioChartData,
            viewMode: outcomeDisplayMode,
            theme,
            glyphSize,
          }),
        buildItem: (captured) => ({
          id: crypto.randomUUID(),
          type: "barChart",
          scenarioId: scenario.scenarioId,
          viewMode: outcomeDisplayMode,
          hydroclimate,
          cachedChartData: scenarioChartData as Record<string, unknown>,
          cachedSvg: captured?.svg,
          cachedImageDataUrl: captured?.dataUrl,
        }),
        addItem: addShareItem,
        errorLabel: "StrategyGridRow.handleShare",
      }),
    [
      scenario.scenarioId,
      outcomeDisplayMode,
      scenarioChartData,
      addShareItem,
      hydroclimate,
      outcomeNames,
      theme,
      glyphSize,
    ],
  )

  return (
    <Box
      onMouseEnter={
        onRowHover ? () => onRowHover([scenario.scenarioId]) : undefined
      }
      onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
      sx={{
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: "subgrid",
        "--row-bg": isActive
          ? `${accentColor}1A`
          : isHighlighted
            ? theme.palette.common.white
            : "#faf8f5",
        backgroundColor: "var(--row-bg)",
        borderRadius: theme.borderRadius.sm,
        rowGap: theme.scenarios.grid.row.internalGap,
        alignItems: "stretch",
        transition:
          "background-color 0.2s ease, border-color 0.2s ease, border-left-color 0.2s ease",
        outline: isHighlighted
          ? `1px solid ${theme.palette.blue.bright}`
          : "none",
        borderBottom: `1px solid ${theme.palette.grey[200]}`,
        "&:hover": {
          "--row-bg": isActive
            ? `${accentColor}26`
            : theme.palette.background.paper,
          backgroundColor: "var(--row-bg)",
        },
        "&:last-child": {
          borderBottom: "1px solid transparent",
        },
        ...(isFirst && { marginTop: theme.scenarios.grid.row.firstOffset }),
      }}
    >
      {/* Column 1: Checkbox */}
      <Box
        ref={
          tourListFirstItem && isListMode
            ? listSelectCheckboxTourRef
            : undefined
        }
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          alignSelf: "start",
          mr: -0.5,
          pt: isListMode
            ? theme.spacing(theme.scenarios.grid.row.padding as number)
            : `calc(${theme.spacing(theme.scenarios.grid.row.padding as number)} + 20px)`,
          pb: theme.scenarios.grid.row.padding,
        }}
      >
        <Checkbox
          size="small"
          checked={isChosen}
          onChange={() => onToggleScenario(scenario.scenarioId)}
          slotProps={{
            input: { "aria-label": `Select ${scenario.label} scenario` },
          }}
          sx={{
            ...theme.scenarios.checkbox.sm,
            cursor: "pointer",
          }}
        />
      </Box>

      <NonCompactRowContent
        scenario={scenario}
        layoutMode={layoutMode}
        showOperations={showOperations}
        showDescription={showDefinitions}
        showThemeBadge={showThemeBadge}
        onThemeBadgeClick={onThemeBadgeClick}
        onIconClick={onIconClick}
        accentColor={accentColor}
        handleShare={handleShare}
        pinRowTourRef={
          tourListFirstItem && isListMode ? listRowPinTourRef : undefined
        }
        shareRowTourRef={
          tourListFirstItem && isListMode ? listRowShareTourRef : undefined
        }
        operationsRowTourRef={
          tourListFirstItem && isListMode ? listRowOperationsTourRef : undefined
        }
      />
    </Box>
  )
})

export { InlineRowActions } from "./InlineRowActions"
