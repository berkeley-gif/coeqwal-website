"use client"

/**
 * ContentPanel. Full-viewport colored section with heading and
 * reading-width-constrained body content.
 */

import React from "react"
import { Box, Typography, useTheme } from "@mui/material"
import type { SxProps, Theme } from "@mui/material"

export interface ContentPanelProps {
  /** Panel content (rendered inside a max-width wrapper) */
  children?: React.ReactNode
  /** Background color for the full-bleed panel */
  background?: string
  /** Heading text rendered above the body */
  heading?: string
  /** Override minimum height (default: 100vh) */
  minHeight?: string | number
  /** Additional sx props applied to the outer container */
  sx?: SxProps<Theme>
}

export function ContentPanel({
  children,
  background,
  heading,
  minHeight,
  sx,
}: ContentPanelProps) {
  const theme = useTheme()

  return (
    <Box sx={{ backgroundColor: background, ...sx }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          minHeight: minHeight ?? "100vh",
          pt: theme.space.panel.padding,
          px: theme.space.panel.padding,
          pb: theme.space.panel.padding,
        }}
      >
        {heading && (
          <Typography
            variant="h4"
            component="h2"
            fontWeight={300}
            color="text.secondary"
          >
            {heading}
          </Typography>
        )}
        <Box sx={{ maxWidth: theme.space.paragraphMaxWidth.default }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
