"use client"

/**
 * PanelEyebrow - Section label for map overlay narrative panels
 *
 * Tracked uppercase label that establishes topic context above body text.
 *
 * Uses Box (not Typography) to avoid the .MuiTypography-root color
 * override applied by CallResponsePanel to its children.
 */

import { Box, useTheme, alpha } from "@repo/ui/mui"
import type { ReactNode } from "react"

interface PanelEyebrowProps {
  children: ReactNode
}

export function PanelEyebrow({ children }: PanelEyebrowProps) {
  const theme = useTheme()

  return (
    <Box
      component="span"
      sx={{
        fontFamily: theme.typography.fontFamily,
        fontSize: "0.875rem", // 14px.matches c
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: alpha(theme.palette.common.white, 0.6),
        display: "block",
      }}
    >
      {children}
    </Box>
  )
}
