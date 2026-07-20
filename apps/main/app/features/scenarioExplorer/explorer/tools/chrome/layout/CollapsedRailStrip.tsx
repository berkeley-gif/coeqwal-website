"use client"

/**
 * CollapsedRailStrip - slim strip standing in for a collapsed option column
 * in the Data in Depth tool (scenario library sidebar, variables rail).
 *
 * The whole strip is a single button: clicking it reopens the column. Shows
 * a menu glyph and the rail's short label reading top-to-bottom. When
 * `horizontalOnXs` is set the strip lays out as a slim full-width row on xs
 * (for parents that stack their columns vertically on small screens).
 */

import React from "react"
import { Box, Typography, useTheme, MenuIcon } from "@repo/ui/mui"

/** Width (px) of a collapsed rail strip; parents use it to size the slot. */
export const COLLAPSED_RAIL_WIDTH = 44

export type CollapsedRailStripProps = {
  /** Short rail name shown along the strip (e.g. "Scenarios") */
  label: string
  /** Accessible action name (e.g. "Expand scenarios") */
  ariaLabel: string
  onExpand: () => void
  /** Lay the strip out as a slim full-width row on xs */
  horizontalOnXs?: boolean
  /** Draw the rail divider; pass false when a parent slot already does */
  bordered?: boolean
}

export default function CollapsedRailStrip({
  label,
  ariaLabel,
  onExpand,
  horizontalOnXs = false,
  bordered = true,
}: CollapsedRailStripProps) {
  const theme = useTheme()

  return (
    <Box
      component="button"
      type="button"
      onClick={onExpand}
      aria-label={ariaLabel}
      aria-expanded={false}
      sx={{
        display: "flex",
        flexDirection: horizontalOnXs ? { xs: "row", md: "column" } : "column",
        alignItems: "center",
        gap: 1,
        width: horizontalOnXs
          ? { xs: "100%", md: COLLAPSED_RAIL_WIDTH }
          : COLLAPSED_RAIL_WIDTH,
        height: horizontalOnXs ? { xs: "auto", md: "100%" } : "100%",
        flexShrink: 0,
        pt: horizontalOnXs ? { xs: 0.75, md: 1.25 } : 1.25,
        pb: 0.75,
        px: horizontalOnXs ? { xs: 1.5, md: 0 } : 0,
        cursor: "pointer",
        border: "none",
        borderRight: bordered
          ? { md: `1px solid ${theme.palette.divider}` }
          : "none",
        backgroundColor: "transparent",
        color: theme.palette.grey[600],
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.primary,
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: -2,
        },
      }}
    >
      <MenuIcon sx={{ fontSize: "1.2rem" }} />
      <Typography
        component="span"
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          writingMode: horizontalOnXs
            ? { xs: "horizontal-tb", md: "vertical-rl" }
            : "vertical-rl",
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}
