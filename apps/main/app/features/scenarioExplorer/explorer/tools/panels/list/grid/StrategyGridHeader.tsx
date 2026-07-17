"use client"

/**
 * StrategyGridHeader - Column headers for StrategyGrid
 *
 * Renders the header row for the list grid:
 * - Columns 1-2: "Choose scenarios" header (search + chips)
 * - Column 3: "Key operations" header with vertical divider
 *
 * Uses CSS grid placement to align with content rows that use subgrid.
 *
 * @see layoutConfig.ts for spacing constant documentation
 * @see StrategyGridContent for the content rows
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import SearchAndChips from "../../../chrome/sidebar/SearchAndChips"
import { useTourAnchor } from "../../../tour"

/**
 * Layout mode for responsive grid behavior (see theme.scenarios.grid.fullBreakpoint).
 * - "full": container >= fullBreakpoint
 * - "wrapped": 600px - fullBreakpoint
 * - "compact": below 600px
 */
export type LayoutMode = "full" | "wrapped" | "compact"

export interface StrategyGridHeaderProps {
  /** Layout mode for responsive behavior */
  layoutMode: LayoutMode
  /** When false, hides the key operations column header */
  showOperations?: boolean
  /** When true, hides the column title row */
  hideColumnTitles?: boolean
  /** Whether to show only chosen scenarios */
  showOnlyChosen?: boolean
  /** Whether to show alternative baseline scenarios */
  showAlternativeBaselines?: boolean
  /** Called when showOnlyChosen changes */
  onShowOnlyChosenChange?: (value: boolean) => void
  /** Called when showAlternativeBaselines changes */
  onShowAlternativeBaselinesChange?: (value: boolean) => void
}

/**
 * StrategyGridHeader renders the column headers.
 */
export function StrategyGridHeader({
  layoutMode,
  showOperations = true,
  hideColumnTitles = false,
}: StrategyGridHeaderProps) {
  return (
    <ColumnHeaders
      layoutMode={layoutMode}
      showOperations={showOperations}
      hideColumnTitles={hideColumnTitles}
    />
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

  const isFullMode = layoutMode === "full"

  // High-level orientation anchor for the list tour. Highlights the
  // entire search + chips region so the user understands "everything
  // in this band tunes the scenario list" before drilling into the
  // individual chips.
  const scenarioAreaAnchorRef = useTourAnchor("list.scenarioArea")

  return (
    <>
      <Box
        ref={scenarioAreaAnchorRef}
        id="column-headers"
        sx={{
          gridColumn: isFullMode ? "1 / 4" : "1 / -1",
          gridRow: isFullMode ? "1 / 3" : undefined,
          display: layoutMode === "compact" ? "none" : "flex",
          alignItems: "center",
          alignContent: "center",
          alignSelf: isFullMode ? "stretch" : "center",
          flexWrap: "wrap",
          rowGap: 1.125,
          columnGap: isFullMode ? 0.5 : 2,
          ...(!isFullMode && { py: 0.5 }),
        }}
      >
        {!isFullMode && (
          <Typography
            sx={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              lineHeight: 1.3,
              color: theme.palette.text.primary,
              whiteSpace: "nowrap",
            }}
          >
            Scenario library
          </Typography>
        )}
        <SearchAndChips />
      </Box>

      {!hideColumnTitles && (
        <Box
          sx={{
            gridColumn: "3",
            display: layoutMode === "compact" ? "none" : "flex",
            alignItems: "flex-start",
            alignSelf: "stretch",
            overflow: "hidden",
            opacity: showOperations ? 1 : 0,
            pointerEvents: showOperations ? "auto" : "none",
            transition: "opacity 200ms ease",
            pl: isFullMode ? 1 : 0,
            pb: theme.scenarios.grid.header.standard,
            borderLeft: isFullMode
              ? `1px solid ${theme.palette.grey[300]}`
              : "none",
          }}
        >
          <Typography
            variant="dashboard"
            sx={{
              color: theme.palette.grey[600],
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Key operations
          </Typography>
        </Box>
      )}
    </>
  )
}

export default StrategyGridHeader
