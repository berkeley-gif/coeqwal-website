"use client"

/**
 * TierSummaryCell.Compact heatmap cell for tier outcome data.
 *
 * Displays a color-blended background (from theme tier palette) with a
 * tier label ("Optimal", "At-risk", etc.) and optional numeric score.
 * Replaces the full glyph in "summary" display mode.
 */

import React, { useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { ChartDataPoint } from "./types"
import {
  computeTierScore,
  getTierLabelForScore,
  getTierLevelForScore,
} from "./tierScore"

export interface TierSummaryCellProps {
  chartData: ChartDataPoint[] | undefined
  isActive: boolean
  isTooltipActive?: boolean
  onClick?: () => void
}

export const TierSummaryCell = React.memo(function TierSummaryCell({
  chartData,
  isActive,
  isTooltipActive,
  onClick,
}: TierSummaryCellProps) {
  const theme = useTheme()

  const score = useMemo(() => computeTierScore(chartData), [chartData])

  const tierLevel = score !== null ? getTierLevelForScore(score) : null
  const tierColors = theme.palette.tiers
  const tierColorMap = {
    1: tierColors.tier1,
    2: tierColors.tier2,
    3: tierColors.tier3,
    4: tierColors.tier4,
  } as const
  const tierColor = tierLevel !== null ? tierColorMap[tierLevel] : undefined

  const label = score !== null ? getTierLabelForScore(score) : null

  if (!isActive || score === null || !tierColor) {
    return (
      <Box sx={{ px: theme.space.component.xs }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 44,
            borderRadius: "6px",
            backgroundColor: theme.palette.grey[100],
            cursor: "default",
          }}
        >
          <Typography
            variant="dashboard"
            sx={{
              color: theme.palette.grey[400],
              fontStyle: "italic",
            }}
          >
            No data
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ px: theme.space.component.xs }}>
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          height: 44,
          px: 1.25,
          borderRadius: "6px",
          backgroundColor: `${tierColor}14`,
          cursor: onClick ? "pointer" : "default",
          transition: "background-color 150ms ease, box-shadow 150ms ease",
          ...(isTooltipActive && {
            boxShadow: `inset 0 0 0 1.5px ${tierColor}`,
          }),
          "&:hover": onClick
            ? { backgroundColor: `${tierColor}24` }
            : undefined,
        }}
      >
        {/* Colored indicator dot */}
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            backgroundColor: tierColor,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="compactCaption"
          sx={{
            color: theme.palette.grey[800],
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  )
})

export default TierSummaryCell
