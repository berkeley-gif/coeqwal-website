"use client"

/**
 * Compact read-only pill for the active hydroclimate (title only)
 *
 * Presentational only, pass label text and accent color from app data.
 *
 * For toolbar and map overlay contexts, derive `title` / `accentColor` via
 * `getHydroclimateBadgeDisplay(hc)` in `apps/main`.
 *
 * For Share cards, a richer multi-line variant lives at
 * `apps/main/app/features/scenarioExplorer/share/cards/HydroclimateBadge.tsx`.
 * Use that one when you need both label and description rendered together.
 */

import React from "react"
import { Box, Typography, useTheme } from "@mui/material"

export interface HydroclimateBadgeProps {
  /** Primary line, e.g. "Historical hydroclimate" */
  title: string
  /** Hex color for border / background tint */
  accentColor: string
  /**
   * - `tinted`, translucent scorecard-style wash (toolbar)
   * - `solid`, fully opaque light pastel from the accent (e.g. over map)
   */
  surface?: "tinted" | "solid"
}

export function HydroclimateBadge({
  title,
  accentColor,
  surface = "tinted",
}: HydroclimateBadgeProps) {
  const theme = useTheme()

  // Stronger alphas than scorecard chips (`0F` / `28`) so the fill reads more clearly.
  const translucentShell = {
    backgroundColor: `${accentColor}40`,
    border: `1px solid ${accentColor}55`,
  }

  const opaqueShell = {
    backgroundColor: `color-mix(in srgb, ${accentColor} 30%, white)`,
    border: `1px solid color-mix(in srgb, ${accentColor} 52%, white)`,
    boxShadow: theme.shadows[2],
  }

  const shell = surface === "solid" ? opaqueShell : translucentShell

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "4px",
        px: 0.75,
        py: 0.375,
        flexShrink: 0,
        maxWidth: "100%",
        ...shell,
      }}
    >
      <Typography
        variant="dashboard"
        sx={{
          fontWeight: 500,
          // Neutral gray, `text.primary` here is blue-tinted and reads purple on red/orange fills.
          color: theme.palette.grey[800],
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </Typography>
    </Box>
  )
}
