"use client"

/**
 * OutcomeGrid - Responsive grid of outcome glyph items
 *
 * Shared component for rendering outcome tier visualizations in a grid layout.
 * Used by both Learn mode (KeyOutcomesPanel) and Explore mode (StrategyGrid).
 *
 * Supports:
 * - Section headers ("Multiple location outcomes", "Single location outcomes")
 * - Responsive grid layouts
 * - Tooltip integration
 * - Sort button support (Explore mode)
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { OUTCOME_DISPLAY_ORDER } from "../../hooks"
import { OutcomeGlyphItem } from "./OutcomeGlyphItem"
import type { ChartDataPoint } from "./types"

export interface OutcomeGridProps {
  /** Chart data keyed by outcome display name */
  chartData: Record<string, ChartDataPoint[]>
  /** Whether the grid is in a loading state */
  isLoading?: boolean
  /** Currently selected outcome (shows border) */
  selectedOutcome?: string | null
  /** Currently active tooltip outcome */
  activeTooltip?: string | null
  /** Whether to show section headers */
  showSectionHeaders?: boolean
  /** Whether to show outcome labels under glyphs */
  showLabels?: boolean
  /** Whether to show info buttons */
  showInfoButtons?: boolean
  /** Whether to show sort buttons */
  showSortButtons?: boolean
  /** Current sort outcome */
  sortBy?: string | null
  /** Current sort direction */
  sortDirection?: "asc" | "desc"
  /** Glyph size override */
  size?: number
  /** Called when a glyph is clicked */
  onGlyphClick?: (outcome: string) => void
  /** Called when info button is clicked */
  onInfoClick?: (
    outcome: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => void
  /** Called when sort changes */
  onSortChange?: (outcome: string | null, direction: "asc" | "desc") => void
}

export function OutcomeGrid({
  chartData,
  isLoading = false,
  selectedOutcome,
  activeTooltip,
  showSectionHeaders = true,
  showLabels = true,
  showInfoButtons = true,
  showSortButtons = false,
  sortBy,
  sortDirection = "asc",
  size,
  onGlyphClick,
  onInfoClick,
  onSortChange,
}: OutcomeGridProps) {
  const theme = useTheme()

  // Helper to check if outcome has valid data
  const hasData = (outcome: string): boolean => {
    const tierData = chartData[outcome]
    return (
      tierData !== undefined &&
      tierData.length > 0 &&
      tierData.some((tier) => tier.value > 0)
    )
  }

  // Multiple location outcomes (first 5) and single location outcomes (remaining)
  const multipleLocationOutcomes = OUTCOME_DISPLAY_ORDER.slice(0, 5)
  const singleLocationOutcomes = OUTCOME_DISPLAY_ORDER.slice(5)

  const renderOutcomeItem = (outcome: string) => {
    const isSelected = selectedOutcome === outcome
    const isTooltipActive = activeTooltip === outcome
    const outcomeData = chartData[outcome]
    const isActive = hasData(outcome)
    const isSorted = sortBy === outcome

    return (
      <OutcomeGlyphItem
        key={outcome}
        displayName={outcome}
        name={outcome}
        chartData={outcomeData}
        isActive={!isLoading && isActive}
        isSelected={isSelected}
        isTooltipActive={isTooltipActive}
        size={size}
        showLabel={showLabels}
        showInfoButton={showInfoButtons}
        showSortButton={showSortButtons}
        sortState={isSorted ? sortDirection : null}
        onGlyphClick={() => onGlyphClick?.(outcome)}
        onInfoClick={(e) => onInfoClick?.(outcome, e)}
        onSortToggle={(newState) => {
          if (newState === null) {
            onSortChange?.(null, "asc") // Clear sort
          } else {
            onSortChange?.(outcome, newState)
          }
        }}
      />
    )
  }

  return (
    <Box>
      {/* Multiple location outcomes - first 5 */}
      {showSectionHeaders && (
        <Typography
          variant="compactMicro"
          sx={{
            display: "block",
            mb: theme.space.component.sm,
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.grey[600],
            letterSpacing: "0.5px",
          }}
        >
          Multiple location outcomes
        </Typography>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(5, 1fr)" },
          gap: theme.space.gap.sm,
          alignItems: "start",
          mb: showSectionHeaders ? theme.space.component.md : 0,
        }}
      >
        {multipleLocationOutcomes.map(renderOutcomeItem)}
      </Box>

      {/* Single location outcomes - remaining */}
      {showSectionHeaders && (
        <Typography
          variant="compactMicro"
          sx={{
            display: "block",
            mb: theme.space.component.sm,
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.grey[600],
            letterSpacing: "0.5px",
          }}
        >
          Single location outcomes
        </Typography>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" },
          gap: theme.space.gap.sm,
          alignItems: "start",
        }}
      >
        {singleLocationOutcomes.map(renderOutcomeItem)}
      </Box>
    </Box>
  )
}

export default OutcomeGrid
