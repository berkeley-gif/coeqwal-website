"use client"

/**
 * useRadarPlotTheme
 *
 * Pulls the chart-chrome palette (grid stroke, range band, baseline accent,
 * dot strokes, tier-zone fills) the `RadarPlot` viz component needs out of
 * the MUI theme so callers can mount a radar without duplicating token wiring.
 * Shared between the main explore radar (`RadarPanel`) and the Share-tab /
 * drawer live thumbnails (`ShareRadarLiveChart`).
 *
 * Keep all dependencies primitive (string / number) - `theme.palette.grey` and
 * similar palette branches are objects whose identity changes on every render
 * even when their fields are stable, so they would break the memo otherwise.
 */

import { useMemo } from "react"
import { useTheme } from "@repo/ui/mui"
import { type RadarPlotPalette } from "@repo/viz"

export function useRadarPlotTheme(): RadarPlotPalette {
  const theme = useTheme()

  const gridStroke = theme.palette.grey[300]
  const tierLabelText = theme.palette.text.secondary
  const commonWhite = theme.palette.common.white
  const rangeBandFill = theme.palette.grey[300]
  const rangeBandStroke = theme.palette.grey[400]

  return useMemo<RadarPlotPalette>(
    () => ({
      gridStroke,
      tierLabelText,
      dotStroke: commonWhite,
      tierZoneFills: [commonWhite, commonWhite, commonWhite, commonWhite],
      rangeBandFill,
      rangeBandStroke,
      // The "baseline gold" matches `CURRENT_OPS_COLOR` (s0020 / Current
      // Operations) used elsewhere in the app's chart palette. Kept as a
      // literal here to avoid coupling the explore hook to viz internals;
      // change once the theme exposes a dedicated `baselineAccent` token.
      baselineColor: "#cc9a06",
      // Subtle outline so distribution dots read as discrete locations without
      // adding a heavy black border; leaves theme-dark behaviour to a follow-up.
      distributionDotStroke: "rgba(0,0,0,0.25)",
    }),
    [gridStroke, tierLabelText, commonWhite, rangeBandFill, rangeBandStroke],
  )
}
