"use client"

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

/**
 * Neutral framed figure for the how-to-read modals. Hosts an SVG and an
 * optional caption. Kept intentionally plain so the surrounding neo-Swiss
 * section layout provides the visual rhythm.
 */
export function Figure({
  caption,
  children,
  variant = "neutral",
}: {
  caption?: string
  children: React.ReactNode
  variant?: "neutral" | "bare" | "ink"
}) {
  const theme = useTheme()
  const neutralStyles = {
    p: theme.space.component.md,
    border: theme.border.light,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.palette.grey[50],
  }
  const inkStyles = {
    p: theme.space.component.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.palette.tabPanels.exploreDeep,
    border: `1px solid rgba(255, 255, 255, 0.08)`,
  }

  return (
    <Box
      sx={{
        my: theme.space.component.sm,
        ...(variant === "neutral"
          ? neutralStyles
          : variant === "ink"
            ? inkStyles
            : {
                p: 0,
                border: "none",
                borderRadius: 0,
                backgroundColor: "transparent",
              }),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.space.component.xs,
      }}
    >
      {children}
      {caption ? (
        <Typography
          variant="caption"
          sx={{
            color:
              variant === "ink"
                ? "rgba(255, 255, 255, 0.72)"
                : theme.palette.grey[700],
            textAlign: "center",
            maxWidth: 520,
          }}
        >
          {caption}
        </Typography>
      ) : null}
    </Box>
  )
}

export default Figure
