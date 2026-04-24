"use client"

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import TourTierLegend from "./TourTierLegend"

/**
 * List tour: top visual block for the map step.
 *
 * Mirrors the framing used by `ListTourBarIllustration` so the two
 * list-tour steps share one visual language: warm off-white panel
 * (same as unhighlighted scenario rows), hairline border, small
 * uppercase eyebrow, compact tier legend.
 */
export default function ListTourMapLegend() {
  const theme = useTheme()

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        p: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
        bgcolor: "#faf8f5",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography
        component="span"
        sx={{
          display: "block",
          color: theme.palette.grey[700],
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        Tiers
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box sx={{ display: "inline-block" }}>
          <TourTierLegend bare compact />
        </Box>
      </Box>
    </Box>
  )
}
