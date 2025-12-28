"use client"

/**
 * InfoOverlay - A floating info card
 *
 * A subtle, semi-transparent card positioned absolutely within its container.
 * Used for contextual information on map views, for example.
 */

import React from "react"
import { Box, Typography, useTheme } from "@mui/material"

export interface InfoOverlayProps {
  /** The message to display */
  children: React.ReactNode
  /** Position from top edge (spacing multiplier, e.g., 2 = 16px) */
  top?: number
  /** Position from right edge (spacing multiplier) */
  right?: number
  /** Position from bottom edge (spacing multiplier) */
  bottom?: number
  /** Position from left edge (spacing multiplier) */
  left?: number
  /** Maximum width of the overlay */
  maxWidth?: string
  /** Additional sx props */
  sx?: object
}

export function InfoOverlay({
  children,
  top,
  right,
  bottom,
  left,
  maxWidth,
  sx,
}: InfoOverlayProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: "absolute",
        top: theme.spacing(top ?? theme.space.component.lg),
        right: right !== undefined ? theme.spacing(right) : undefined,
        bottom: bottom !== undefined ? theme.spacing(bottom) : undefined,
        left: left !== undefined ? theme.spacing(left) : undefined,
        backgroundColor: theme.background.whiteOverlay[95],
        borderRadius: theme.borderRadius.md,
        p: theme.space.component.lg,
        boxShadow: theme.shadow.subtle,
        maxWidth: maxWidth ?? theme.layout.maxWidth.sm,
        zIndex: theme.zIndex.mapControls,
        pointerEvents: "auto",
        ...sx,
      }}
    >
      <Typography
        variant="compactSubtitle"
        sx={{
          color: theme.palette.text.primary,
          lineHeight: 1.4,
          display: "block",
        }}
      >
        {children}
      </Typography>
    </Box>
  )
}

export default InfoOverlay
