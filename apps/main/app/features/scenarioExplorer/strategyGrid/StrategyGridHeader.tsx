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
import { GridControls } from "./GridControls"

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
  activeTooltip,
  sortBy,
  sortDirection,
  sortEnabled,
  showOnlyChosen = false,
  showAlternativeBaselines = false,
  onShowOnlyChosenChange,
  onShowAlternativeBaselinesChange,
  onTooltipToggle,
  onSortChange,
}: StrategyGridHeaderProps) {
  const controls =
    onShowOnlyChosenChange && onShowAlternativeBaselinesChange ? (
      <GridControls
        showOnlyChosen={showOnlyChosen}
        showAlternativeBaselines={showAlternativeBaselines}
        onShowOnlyChosenChange={onShowOnlyChosenChange}
        onShowAlternativeBaselinesChange={onShowAlternativeBaselinesChange}
      />
    ) : null

  // Compact mode uses simplified header
  if (compact) {
    return <CompactHeader controls={controls} />
  }

  // Full mode: 4 columns with outcome labels in header
  // Wrapped mode: 3 columns, no outcome labels in header (they appear in rows)
  const showOutcomeLabels = layoutMode === "full"

  return (
    <>
      {/* Column headers row */}
      <ColumnHeaders layoutMode={layoutMode} />

      {/* Controls in cols 1-2, same row as DividerContinuation / OutcomeCategoryLabels */}
      {controls && (
        <ControlsRow
          controls={controls}
          showOutcomeLabels={showOutcomeLabels}
        />
      )}

      {/* Divider continuation for Column 3 - only in full mode */}
      {showOutcomeLabels && <DividerContinuation column={3} />}

      {/* Outcome category labels (Column 4) - only in full mode */}
      {showOutcomeLabels && (
        <OutcomeCategoryLabels
          outcomeNames={outcomeNames}
          activeTooltip={activeTooltip}
          sortBy={sortBy}
          sortDirection={sortDirection}
          sortEnabled={sortEnabled}
          onTooltipToggle={onTooltipToggle}
          onSortChange={onSortChange}
        />
      )}
    </>
  )
}

/**
 * Compact header - simplified single-row header for mobile/condensed view
 */
function CompactHeader({ controls }: { controls: React.ReactNode }) {
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
        Choose scenarios
      </Typography>
      {controls}
    </Box>
  )
}

/**
 * ControlsRow - GridControls placed in cols 1-2, below the "Choose scenarios" header.
 * Aligns with DividerContinuation and OutcomeCategoryLabels in the same grid row.
 */
function ControlsRow({
  controls,
  showOutcomeLabels,
}: {
  controls: React.ReactNode
  showOutcomeLabels: boolean
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        gridColumn: "1 / 3",
        display: { xs: "none", sm: "flex" },
        alignItems: "center",
        pr: theme.scenarios.grid.divider.gap,
        pb: showOutcomeLabels
          ? theme.scenarios.grid.header.categoryLabels
          : theme.space.component.sm,
        mt: showOutcomeLabels ? theme.scenarios.grid.divider.pullUp : 0,
      }}
    >
      {controls}
    </Box>
  )
}

/**
 * Column headers - the main header row with column titles
 */
interface ColumnHeadersProps {
  layoutMode: LayoutMode
}

function ColumnHeaders({ layoutMode }: ColumnHeadersProps) {
  const theme = useTheme()

  // In full mode, column 4 is visible; in wrapped mode, it's not
  const isFullMode = layoutMode === "full"

  return (
    <>
      {/* Columns 1-2: "Choose scenarios" (spans checkbox + scenario columns) */}
      <Box
        sx={{
          gridColumn: "1 / 3",
          display: { xs: "none", sm: "flex" },
          alignItems: "flex-start",
          alignSelf: "stretch",
          pr: theme.scenarios.grid.divider.gap,
          pb: theme.scenarios.grid.header.standard,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.grey[900],
            fontWeight: 500,
          }}
        >
          Choose scenarios
        </Typography>
      </Box>

      {/* Column 3: "Key operations" */}
      <Box
        sx={{
          gridColumn: "3",
          display: { xs: "none", sm: "flex" },
          alignItems: "flex-start",
          alignSelf: "stretch",
          // In wrapped mode, no divider and no left padding (aligns with icons below)
          // In full mode, divider with standard gap
          pl: isFullMode ? theme.scenarios.grid.divider.gap : 0,
          pb: theme.scenarios.grid.header.standard,
          // Vertical divider only in full mode
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

      {/* Column 4: "Key outcomes" - only in full mode */}
      {isFullMode && (
        <Box
          sx={{
            gridColumn: "4",
            display: { xs: "none", sm: "flex" },
            alignItems: "flex-start",
            alignSelf: "stretch",
            /**
             * Tighter bottom padding than other columns.
             * Outcome category labels appear directly below this header,
             * so we use component.sm (8px) instead of component.lg (16px).
             */
            pb: theme.scenarios.grid.header.outcomes,
            pl: theme.scenarios.grid.divider.gap,
            // Vertical divider at column boundary
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
}

function DividerContinuation({ column }: DividerContinuationProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        gridColumn: String(column),
        display: { xs: "none", sm: "block" },
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
}

function OutcomeCategoryLabels({
  outcomeNames,
  activeTooltip,
  sortBy,
  sortDirection,
  sortEnabled,
  onTooltipToggle,
  onSortChange,
}: OutcomeCategoryLabelsProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        gridColumn: "4",
        display: { xs: "none", sm: "grid" },
        gridTemplateColumns: `repeat(${outcomeNames.length}, 1fr)`,
        gap: theme.space.gap.sm,
        pb: theme.scenarios.grid.header.categoryLabels,
        pl: theme.scenarios.grid.divider.gap,
        /**
         * Divider pull-up: negates the grid row gap (8px)
         * so the border appears continuous with the header above.
         */
        mt: theme.scenarios.grid.divider.pullUp,
        borderLeft: `1px solid ${theme.palette.grey[300]}`,
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
