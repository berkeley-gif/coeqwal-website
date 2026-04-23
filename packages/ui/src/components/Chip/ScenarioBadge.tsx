"use client"

/**
 * ScenarioBadge - A small inline label tag for annotating scenario metadata
 *
 * Used to show classification info (e.g. "Baseline")
 * alongside the scenario ID. Accepts custom colors for different badge types.
 */

import React from "react"
import { Box, useTheme } from "@mui/material"
import type { SxProps, Theme } from "@mui/material"

export interface ScenarioBadgeProps {
  /** Badge label text */
  label: string
  /** Background color.defaults to accent.gold */
  backgroundColor?: string
  /** Text color.defaults to dark amber */
  color?: string
  sx?: SxProps<Theme>
}

export function ScenarioBadge({
  label,
  backgroundColor,
  color = "#7a5200",
  sx,
}: ScenarioBadgeProps) {
  const theme = useTheme()

  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        maxWidth: "100%",
        minWidth: 0,
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color,
        backgroundColor: backgroundColor ?? theme.palette.accent.gold,
        px: "5px",
        py: "1.5px",
        borderRadius: "2px",
        lineHeight: 1.3,
        whiteSpace: "normal",
        overflowWrap: "break-word",
        wordBreak: "break-word",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
        boxSizing: "border-box",
        verticalAlign: "top",
        ...sx,
      }}
    >
      {label}
    </Box>
  )
}

export default ScenarioBadge
