"use client"

/**
 * VisualizeRail. Full-height CTA rail on the right edge of the List view.
 *
 * Nudges the user toward Bar mode once they've selected at least one
 * scenario — muted/inert at zero selections, active once there's
 * something to visualize.
 */

import React from "react"
import { Box, Typography, useTheme, ArrowForwardIcon } from "@repo/ui/mui"

const RAIL_WIDTH = 66

interface VisualizeRailProps {
  active: boolean
  onClick: () => void
}
export default function VisualizeRail({ active, onClick }: VisualizeRailProps) {
  const theme = useTheme()

  return (
    <Box
      component="button"
      type="button"
      disabled={!active}
      onClick={onClick}
      aria-label="Start visualizing: switch to Bar mode"
      sx={{
        flexShrink: 0,
        width: RAIL_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        border: "none",
        borderLeft: `1px solid ${theme.palette.divider}`,
        backgroundColor: active
          ? theme.palette.tabPanels.explore
          : theme.palette.grey[100],
        color: active ? theme.palette.common.white : theme.palette.grey[400],
        cursor: active ? "pointer" : "default",
        transition: "background-color 150ms ease, color 150ms ease",
        "&:hover": active ? { filter: "brightness(1.15)" } : {},
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.blue.bright}`,
          outlineOffset: -2,
        },
      }}
    >
      <ArrowForwardIcon sx={{ fontSize: "1.25rem" }} />
      <Typography
        variant="dashboard"
        sx={{
          writingMode: "vertical-rl",
          fontWeight: 600,
          fontSize: "0.8125rem",
          whiteSpace: "nowrap",
          color: "inherit",
        }}
      >
        Start visualizing
      </Typography>
    </Box>
  )
}
