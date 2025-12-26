/**
 * OutcomeChartItem - Single outcome visualization with glyph and label
 *
 * Extracted from StrategyGrid for reusability.
 * Displays a scenario glyph (bars or dots) with label and optional info/sort buttons.
 *
 * TODO: Integrate this component into StrategyGrid.tsx to replace the 4 inline
 * implementations (compact first 5, compact remaining, non-compact first 5,
 * non-compact remaining). Each has slight variations in click handlers and state.
 */

import React from "react"
import { Box, Typography, useTheme, useMediaQuery } from "@repo/ui/mui"
import { InfoIconButton, SortButton } from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import { isSingleValueTier, type ChartDataPoint } from "./types"

interface OutcomeChartItemProps {
  /** Display name of the outcome */
  displayName: string
  /** Internal name (used for tooltip) */
  name: string
  /** Chart data for this outcome */
  chartData: ChartDataPoint[] | undefined
  /** Whether this outcome has active data */
  isActive: boolean
  /** Whether this outcome is currently selected */
  isSelected: boolean
  /** Whether this outcome is expanded (showing summary) */
  isExpanded: boolean
  /** Whether tooltip is active for this outcome */
  isTooltipActive: boolean
  /** Size of the glyph */
  size?: number
  /** Called when outcome is clicked */
  onClick?: () => void
  /** Called when info button is clicked */
  onInfoClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Sort state for this outcome */
  sortState?: "asc" | "desc" | null
  /** Called when sort ascending is clicked */
  onSortAsc?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Called when sort descending is clicked */
  onSortDesc?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Whether to show sort buttons */
  showSortButtons?: boolean
}

export function OutcomeChartItem({
  displayName,
  name,
  chartData,
  isActive,
  isSelected,
  isExpanded,
  isTooltipActive,
  size = 60,
  onClick,
  onInfoClick,
  sortState,
  onSortAsc,
  onSortDesc,
  showSortButtons = false,
}: OutcomeChartItemProps) {
  const theme = useTheme()

  // Responsive glyph size: 50px at sm, 60px at md+
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"))
  const responsiveSize = isMdUp ? 60 : 50
  const actualSize = size === 60 ? responsiveSize : size // Use responsive if default, otherwise use provided size

  // Compute glyph values and variant
  const values: [number, number, number, number] = chartData
    ? (chartData.map((tier) => tier.value).slice(0, 4) as [
        number,
        number,
        number,
        number,
      ])
    : [0, 0, 0, 0]

  const tierColors: [string, string, string, string] = chartData
    ? (chartData.map((tier) => tier.color).slice(0, 4) as [
        string,
        string,
        string,
        string,
      ])
    : [
        theme.palette.tiers.tier1,
        theme.palette.tiers.tier2,
        theme.palette.tiers.tier3,
        theme.palette.tiers.tier4,
      ]

  const variant = isSingleValueTier(chartData) ? "dots" : "bars"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        cursor: isActive ? "pointer" : "default",
        padding: 0,
        borderRadius: theme.borderRadius.md,
        transition: theme.transition.default,
        backgroundColor: isExpanded
          ? theme.palette.blue.bright + "10"
          : "transparent",
        opacity: isActive ? 1 : 0.7,
        border:
          isExpanded || isSelected
            ? theme.border.focus
            : "2px solid transparent",
        minWidth: 0, // Allow grid item to shrink
        overflow: "hidden",
        "&:hover": {
          backgroundColor: isActive ? theme.palette.grey[100] : "transparent",
        },
      }}
      onClick={isActive ? onClick : undefined}
    >
      {/* Glyph or placeholder */}
      {isActive ? (
        <ScenarioGlyph
          variant={variant}
          values={values}
          size={actualSize}
          tierColors={tierColors}
        />
      ) : (
        <Box
          sx={{
            width: actualSize,
            height: actualSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.grey[100],
            borderRadius: theme.borderRadius.md,
            border: theme.border.medium,
          }}
        >
          <Typography
            variant="compactMicro"
            sx={{
              color: theme.palette.text.primary,
              textAlign: "center",
              lineHeight: 1.2, // Tighter than variant default for data viz
              px: 0.5,
            }}
          >
            No data at this time
          </Typography>
        </Box>
      )}

      {/* Label and controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.25,
          mt: 0.5,
          width: "100%",
        }}
      >
        <Typography
          variant="compactMicro"
          component="div"
          sx={{
            textAlign: "center",
            fontWeight: theme.typography.fontWeightMedium,
            color: isActive
              ? theme.palette.blue.darkest
              : theme.palette.grey[500],
            lineHeight: 1.2, // Tighter than variant default for data viz
            wordBreak: "break-word",
            hyphens: "auto",
          }}
        >
          {displayName}
        </Typography>

        {/* Info and sort buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            mt: 0.25,
          }}
        >
          {onInfoClick && (
            <InfoIconButton
              isActive={isTooltipActive}
              onClick={(e) => {
                e.stopPropagation()
                onInfoClick(e)
              }}
              title="Click for outcome details"
            />
          )}
          {showSortButtons && onSortAsc && onSortDesc && (
            <SortButton
              sortState={sortState ?? null}
              onAscClick={(e) => {
                e.stopPropagation()
                onSortAsc(e)
              }}
              onDescClick={(e) => {
                e.stopPropagation()
                onSortDesc(e)
              }}
              title="Sort by this outcome"
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default OutcomeChartItem
