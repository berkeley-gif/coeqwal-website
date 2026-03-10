"use client"

/**
 * ContentPanel - Full-viewport rounded panel with border
 */

import React from "react"
import { Box, useTheme } from "@mui/material"
import type { SxProps, Theme } from "@mui/material"

export interface ContentPanelProps {
  /** Panel content */
  children?: React.ReactNode
  /** Override minimum height (default: fills viewport minus vertical margins) */
  minHeight?: string | number
  /** Additional sx props */
  sx?: SxProps<Theme>
}

export function ContentPanel({
  children,
  minHeight,
  sx,
}: ContentPanelProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        mx: theme.space.section.sm,
        my: theme.space.section.sm,
        minHeight: minHeight ?? "50vh",
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.palette.common.white,
        border: theme.border.heavy,
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}
