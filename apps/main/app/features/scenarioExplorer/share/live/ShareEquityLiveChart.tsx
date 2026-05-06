"use client"

/**
 * ShareEquityLiveChart
 *
 * Distribution thumbnail rendered from live tier data when the share
 * item has no cached SVG / PNG (URL-restored items can't carry visual
 * cache). Mirrors `ShareRadarLiveChart` for the radar variant.
 *
 * Reuses `useEquityObjectives` so the data path is identical to the
 * live `EquityPanel` and the offscreen capture mount; SWR cache hits
 * keep the network cost negligible whenever the live panel has
 * already loaded the same scenario. The captured `hydroclimate`
 * field is shown by the parent's badge but does not influence the
 * data fetch here: the hook reads the explorer store's hydroclimate,
 * matching `OffscreenEquityCapture`. A URL-restored item viewed at a
 * different store hydroclimate will therefore fall back to the
 * current store data, which is the same trade-off the offscreen
 * capture already accepts.
 *
 * The chart mounts at full capture dimensions inside
 * `CapturedSizeFrame` so the URL-restored view scales the same way a
 * cached SVG thumbnail does (uniform CSS scale of the whole chart
 * vs. a responsive re-layout at the card width).
 */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { TierGridSnapshot } from "@repo/viz"
import { useEquityObjectives } from "../../hooks/useEquityObjectives"
import { CAPTURE_DIMENSIONS } from "../capture/dimensions"
import CapturedSizeFrame from "./CapturedSizeFrame"

const TIERS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"]

const EQUITY_W = CAPTURE_DIMENSIONS.equity.width
const EQUITY_H = CAPTURE_DIMENSIONS.equity.height

export interface ShareEquityLiveChartProps {
  scenarioId: string
  compareToBaseline: boolean
}

export default function ShareEquityLiveChart({
  scenarioId,
  compareToBaseline,
}: ShareEquityLiveChartProps) {
  const theme = useTheme()
  const { objectives, categories, ready } = useEquityObjectives({
    scenarioId,
    compareToBaseline,
  })

  if (!ready || objectives.length === 0) {
    return (
      <Box
        sx={{
          mt: 1,
          minHeight: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.grey[500],
          fontSize: "0.75rem",
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: theme.borderRadius.sm,
        }}
      >
        Loading distribution chart...
      </Box>
    )
  }

  return (
    <CapturedSizeFrame
      captureWidth={EQUITY_W}
      captureHeight={EQUITY_H}
      sx={{
        mt: 1,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.palette.common.white,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <TierGridSnapshot
        objectives={objectives}
        categories={categories}
        tiers={TIERS}
        colorMode="tier"
        showComparison={compareToBaseline}
        showMapView={false}
        responsive={false}
        width={EQUITY_W}
        height={EQUITY_H}
      />
    </CapturedSizeFrame>
  )
}
