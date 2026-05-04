"use client"

/**
 * Pure-presentational mirror of the outcome-glyph row that
 * `StrategyGridRow` renders inside its `outcomeColRef`. Used by
 * `OffscreenBarChartRowCapture` so the captured bar-chart row image
 * has deterministic dimensions, independent of whatever responsive
 * width / glyph size the live row happened to have when the user
 * clicked the share icon.
 *
 * The snapshot intentionally drops every interactive affordance
 * (click handlers, sort buttons, info buttons, tooltips, hover
 * outlines, tour anchors). It still calls into `OutcomeGlyphItem` /
 * `TierSummaryCell` so the glyph rendering matches the live row
 * pixel-for-pixel.
 */

import React, { useEffect, useRef } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import {
  OutcomeGlyphItem,
  TierSummaryCell,
  type ChartDataPoint,
  type OutcomeName,
} from "../../scenarios/components/shared"
import type { OutcomeDisplayMode } from "../store"
import { describeOutcomeLocations } from "../../../content/outcomes"

export interface BarChartRowSnapshotProps {
  outcomeNames: OutcomeName[]
  /** Per-shortCode tier values for this scenario. */
  chartData: Record<string, ChartDataPoint[]>
  viewMode: OutcomeDisplayMode
  /** Final glyph pixel size; defaults to the live md+ responsive size. */
  glyphSize?: number
  width: number
  height: number
  /** Fired after first paint commits so OffscreenCaptureHost can serialize. */
  onReady?: () => void
}

const DEFAULT_GLYPH_SIZE = 60

export default function BarChartRowSnapshot({
  outcomeNames,
  chartData,
  viewMode,
  glyphSize = DEFAULT_GLYPH_SIZE,
  width,
  height,
  onReady,
}: BarChartRowSnapshotProps) {
  const theme = useTheme()
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    const id = requestAnimationFrame(() => onReady?.())
    return () => cancelAnimationFrame(id)
  }, [onReady])

  const isDistribution = viewMode === "distribution"

  return (
    <Box
      sx={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: theme.space.gap.md,
        px: theme.space.component.md,
        py: theme.space.gap.lg,
        backgroundColor: theme.palette.common.white,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(outcomeNames.length, 1)}, 1fr)`,
          gap: theme.space.gap.sm,
          alignItems: isDistribution ? "flex-start" : undefined,
          width: "100%",
        }}
      >
        {outcomeNames.map(({ shortCode, displayName }) => {
          const data = chartData[shortCode]
          const isActive = !!data && data.length > 0
          if (viewMode === "average") {
            return (
              <Box key={shortCode}>
                <TierSummaryCell
                  chartData={data}
                  isActive={isActive}
                  isTooltipActive={false}
                  mode="numeric"
                />
              </Box>
            )
          }
          const variantOverride = isDistribution ? "distribution" : undefined
          return (
            <Box key={shortCode}>
              <OutcomeGlyphItem
                displayName={displayName}
                name={displayName}
                outcomeCode={shortCode}
                chartData={data}
                isActive={isActive}
                isSelected={false}
                isTooltipActive={false}
                variant={variantOverride}
                morphEnabled={false}
                size={glyphSize}
                showLabel
                showInfoButton={false}
                showSortButton={false}
              />
            </Box>
          )
        })}
      </Box>
      {isDistribution && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(outcomeNames.length, 1)}, 1fr)`,
            gap: theme.space.gap.sm,
            width: "100%",
          }}
        >
          {outcomeNames.map(({ shortCode }) => {
            const totalLocations = chartData[shortCode]?.[0]?.totalLocations
            const description = describeOutcomeLocations(
              shortCode,
              totalLocations,
            )
            if (!description) return <Box key={`loc-${shortCode}`} />
            return (
              <Box
                key={`loc-${shortCode}`}
                sx={{
                  color: theme.palette.grey[500],
                  fontSize: "0.65rem",
                  textAlign: "center",
                  lineHeight: 1.3,
                  px: 0.25,
                }}
              >
                {description}
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
