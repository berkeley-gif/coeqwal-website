"use client"

/**
 * OverlappingBandsLegend - the "Overlapping percentile bands" legend plus an
 * explanatory caption, used in the description slot of a monthly-distribution
 * section header.
 *
 * Renders as inline spans so it can live inside a Typography description
 * without producing invalid block-in-paragraph markup.
 */

import React from "react"
import { Box } from "@repo/ui/mui"
import { BandLegend } from "./BandsLegend"
import type { BandColors } from "../../config/bandColors"

export function OverlappingBandsLegend({
  colors,
  caption,
}: {
  /** Band ramp for the metric currently shown. */
  colors: BandColors
  /** Italic explainer describing what the upper/lower chart regions mean. */
  caption: string
}) {
  return (
    <Box
      component="span"
      sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1.5 }}
    >
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box
          component="span"
          sx={{ color: "grey.500", typography: "dashboardLabel" }}
        >
          Overlapping percentile bands:
        </Box>
        <BandLegend colors={colors} />
      </Box>
      <Box
        component="span"
        sx={{
          color: "grey.400",
          typography: "compactSubtitle",
          fontStyle: "italic",
        }}
      >
        {caption}
      </Box>
    </Box>
  )
}

export default OverlappingBandsLegend
