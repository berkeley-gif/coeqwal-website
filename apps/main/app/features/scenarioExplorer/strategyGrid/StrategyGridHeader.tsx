"use client"

/**
 * StrategyGridHeader - Column headers for StrategyGrid
 *
 * Renders the header row(s) for the 4-column grid layout:
 * - Columns 1-2: "Choose scenarios" header (spans checkbox + scenario columns)
 * - Column 3: "Key operations" header with vertical divider
 * - Column 4: "Key outcomes" header
 *
 * Also renders:
 * - Divider continuation elements for visual continuity
 * - Outcome category labels with info/sort buttons
 *
 * Uses CSS grid placement to align with content rows that use subgrid.
 *
 * @see layoutConfig.ts for spacing constant documentation
 * @see StrategyGridContent for the content rows
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoIconButton, ToggleSortButton } from "@repo/ui"
import {
  formatOutcomeLabel,
  type OutcomeName,
} from "../../scenarios/components/shared"
import SearchAndChips from "../components/SearchAndChips"

/**
 * Layout mode for responsive grid behavior
 * - "full": All 4 columns inline (1400px+)
 * - "wrapped": Columns 1-3 inline, column 4 wraps below (600-1399px)
 * - "compact": Mobile layout (below 600px)
 */
export type LayoutMode = "full" | "wrapped" | "compact"

export interface StrategyGridHeaderProps {
  /** Outcome names with display info */
  outcomeNames: OutcomeName[]
  /** Compact mode (simplified header) */
  compact: boolean
  /** Layout mode for responsive behavior */
  layoutMode: LayoutMode
  /** When false, hides the key operations column header */
  showOperations?: boolean
  /** When true, only outcome labels are shown (scenario/ops headers hidden) */
  outcomesOnly?: boolean
  /** When true, hides the column title row (Scenario library / Key operations / Key outcomes) */
  hideColumnTitles?: boolean
  /** Active tooltip outcome name */
  activeTooltip: string | null
  /** Current sort column */
  sortBy: string | null
  /** Sort direction */
  sortDirection: "asc" | "desc"
  /** Whether sort is enabled */
  sortEnabled: boolean
  /** Whether to show only chosen scenarios */
  showOnlyChosen?: boolean
  /** Whether to show alternative baseline scenarios */
  showAlternativeBaselines?: boolean
  /** Called when showOnlyChosen changes */
  onShowOnlyChosenChange?: (value: boolean) => void
  /** Called when showAlternativeBaselines changes */
  onShowAlternativeBaselinesChange?: (value: boolean) => void
  /** Toggle tooltip with anchor */
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
  /** Sort change handler */
  onSortChange?: (outcomeCode: string | null, direction: "asc" | "desc") => void
}

/**
 * StrategyGridHeader renders column headers and outcome category labels.
 *
 * In compact mode, renders a simplified single-row header.
 * In non-compact mode, renders the full 4-column header with:
 * - Column headers
 * - Divider continuation elements
 * - Outcome name headers with controls
 */
export function StrategyGridHeader({
  outcomeNames,
  compact,
  layoutMode,
  showOperations = true,
  outcomesOnly = false,
  hideColumnTitles = false,
  activeTooltip,
  sortBy,
  sortDirection,
  sortEnabled,
  onTooltipToggle,
  onSortChange,
}: StrategyGridHeaderProps) {
  // Compact mode uses simplified header
  if (compact) {
    return <CompactHeader />
  }

  // outcomesOnly: only show outcome category labels, no scenario/ops headers
  if (outcomesOnly) {
    return (
      <OutcomeCategoryLabels
        outcomeNames={outcomeNames}
        activeTooltip={activeTooltip}
        sortBy={sortBy}
        sortDirection={sortDirection}
        sortEnabled={sortEnabled}
        onTooltipToggle={onTooltipToggle}
        onSortChange={onSortChange}
        outcomesOnly
        layoutMode={layoutMode}
      />
    )
  }

  // Full mode: 4 columns with outcome labels in header
  // Wrapped mode: 3 columns, no outcome labels in header (they appear in rows)
  const showOutcomeLabels = layoutMode === "full"

  return (
    <>
      {/* Column headers row */}
      <ColumnHeaders
        layoutMode={layoutMode}
        showOperations={showOperations}
        hideColumnTitles={hideColumnTitles}
      />

      {/* Divider continuation for Column 3 - only in full mode when operations visible */}
      {!hideColumnTitles && showOutcomeLabels && showOperations && (
        <DividerContinuation column={3} className="outcome-col" />
      )}

      {/* Outcome category labels (Column 4) - only in full mode */}
      {showOutcomeLabels && (
        <OutcomeCategoryLabels
          className="outcome-col"
          outcomeNames={outcomeNames}
          activeTooltip={activeTooltip}
          sortBy={sortBy}
          sortDirection={sortDirection}
          sortEnabled={sortEnabled}
          onTooltipToggle={onTooltipToggle}
          onSortChange={onSortChange}
          layoutMode={layoutMode}
        />
      )}
    </>
  )
}

/**
 * Compact header - simplified single-row header for mobile/condensed view
 */
function CompactHeader() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        pb: theme.space.component.md,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: theme.palette.grey[900],
          fontWeight: 500,
        }}
      >
        Scenario library
      </Typography>
    </Box>
  )
}

/**
 * Column headers - the main header row with column titles
 */
interface ColumnHeadersProps {
  layoutMode: LayoutMode
  showOperations?: boolean
  hideColumnTitles?: boolean
}

function ColumnHeaders({
  layoutMode,
  showOperations = true,
  hideColumnTitles = false,
}: ColumnHeadersProps) {
  const theme = useTheme()

  // In full mode, column 4 is visible; in wrapped mode, it's not
  const isFullMode = layoutMode === "full"

  return (
    <>
      {/* Columns 1-2: Search + visibility chips */}
      <Box
        sx={{
          gridColumn: "1 / 3",
          display: layoutMode === "compact" ? "none" : "flex",
          alignItems: "center",
          alignSelf: "stretch",
          flexWrap: "wrap",
          gap: 0.5,
          pr: theme.scenarios.grid.divider.gap,
          pb: 0.75,
        }}
      >
        <SearchAndChips />
      </Box>

      {/* Column 3: "Key operations" — hidden when showOperations is false or titles hidden */}
      {showOperations && !hideColumnTitles && (
        <Box
          sx={{
            gridColumn: "3",
            display: layoutMode === "compact" ? "none" : "flex",
            alignItems: "flex-start",
            alignSelf: "stretch",
            pl: isFullMode ? theme.scenarios.grid.divider.gap : 0,
            pb: theme.scenarios.grid.header.standard,
            borderLeft: isFullMode
              ? `1px solid ${theme.palette.grey[300]}`
              : "none",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.grey[600],
              fontWeight: 500,
            }}
          >
            Key operations
          </Typography>
        </Box>
      )}

      {/* Column 4: "Key outcomes" — only in full mode, hidden when titles hidden */}
      {isFullMode && !hideColumnTitles && (
        <Box
          className="outcome-col"
          sx={{
            gridColumn: "4",
            display: "flex",
            alignItems: "flex-start",
            alignSelf: "stretch",
            pb: theme.scenarios.grid.header.outcomes,
            pl: theme.scenarios.grid.divider.gap,
            borderLeft: `1px solid ${theme.palette.grey[300]}`,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.grey[600],
              fontWeight: 500,
            }}
          >
            Key outcomes
          </Typography>
        </Box>
      )}
    </>
  )
}

/**
 * DividerContinuation - Empty box with border to create continuous vertical divider
 *
 * The parent grid has row gaps, which creates visual breaks in the dividers.
 * This component uses a negative margin to "pull up" and fill that gap,
 * creating the appearance of a continuous vertical line.
 */
interface DividerContinuationProps {
  column: number
  className?: string
}

function DividerContinuation({ column, className }: DividerContinuationProps) {
  const theme = useTheme()

  return (
    <Box
      className={className}
      sx={{
        gridColumn: String(column),
        display: "block",
        /**
         * Divider pull-up: negates the grid row gap (8px)
         * so the border appears continuous with the header above.
         */
        mt: theme.scenarios.grid.divider.pullUp,
        borderLeft: `1px solid ${theme.palette.grey[300]}`,
        alignSelf: "stretch",
      }}
    />
  )
}

/**
 * OutcomeCategoryLabels - Grid of outcome names with info/sort buttons
 *
 * Renders in Column 4, aligned with the outcome glyphs in content rows.
 * Each label includes an info button (tooltip trigger) and optional sort button.
 */
interface OutcomeCategoryLabelsProps {
  outcomeNames: OutcomeName[]
  activeTooltip: string | null
  sortBy: string | null
  sortDirection: "asc" | "desc"
  sortEnabled: boolean
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
  onSortChange?: (outcomeCode: string | null, direction: "asc" | "desc") => void
  outcomesOnly?: boolean
  layoutMode?: "full" | "wrapped" | "compact"
  className?: string
}

function OutcomeCategoryLabels({
  outcomeNames,
  activeTooltip,
  sortBy,
  sortDirection,
  sortEnabled,
  onTooltipToggle,
  onSortChange,
  outcomesOnly = false,
  layoutMode = "full",
  className,
}: OutcomeCategoryLabelsProps) {
  const theme = useTheme()

  return (
    <Box
      className={className}
      sx={{
        gridColumn: outcomesOnly ? "1 / -1" : "4",
        display: layoutMode === "compact" ? "none" : "grid",
        gridTemplateColumns: `repeat(${outcomeNames.length}, 1fr)`,
        gap: theme.space.gap.sm,
        pb: 0.75,
        pl: theme.scenarios.grid.divider.gap,
        ...(!outcomesOnly && {
          borderLeft: `1px solid ${theme.palette.grey[300]}`,
        }),
        alignSelf: "stretch",
      }}
    >
      {outcomeNames.map(({ shortCode, displayName }) => {
        const isSorted = sortBy === shortCode

        return (
          <Box
            key={shortCode}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: theme.space.gap.xs,
            }}
          >
            <Typography
              component="div"
              sx={{
                fontSize: "0.75rem", // 12px
                fontWeight: 500,
                color: theme.palette.grey[600],
                textAlign: "center",
                lineHeight: 1.3,
                letterSpacing: "0.01em",
              }}
            >
              {formatOutcomeLabel(displayName)}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
              }}
            >
              <InfoIconButton
                isActive={activeTooltip === shortCode}
                onClick={(e) => onTooltipToggle(shortCode, e.currentTarget)}
                title="Click for outcome details"
              />

              {sortEnabled && onSortChange && (
                <ToggleSortButton
                  sortState={isSorted ? sortDirection : null}
                  onToggle={(newState) => {
                    if (newState === null) {
                      onSortChange(null, "asc")
                    } else {
                      onSortChange(shortCode, newState)
                    }
                  }}
                  title="Sort by this outcome"
                />
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default StrategyGridHeader
