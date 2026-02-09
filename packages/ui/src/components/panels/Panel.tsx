"use client"

/**
 * Panel - Base full-viewport panel with standard spacing
 *
 * A minimal, reusable container that provides consistent outer spacing from theme tokens.
 * Consumers control their own layout within the panel.
 *
 * Features:
 * - Standard panel spacing from theme.space.panel.*
 * - Optional background image with grid stacking
 * - Full viewport height by default, configurable
 * - WCAG 2.0 AA compliant with semantic section element
 */

import React from "react"
import { Box, useTheme } from "@mui/material"
import type { SxProps, Theme } from "@mui/material"

export interface PanelProps {
  /** Panel ID for navigation */
  id?: string
  /** Accessible label for the section */
  ariaLabel?: string
  /** Background color (theme color or CSS value) */
  backgroundColor?: string
  /** Optional background image URL (enables grid stacking when provided) */
  backgroundImage?: string
  /** Background image sizing (default: "cover") */
  backgroundSize?: string
  /** Background image position (default: "center") */
  backgroundPosition?: string
  /** Background image repeat (default: "no-repeat") */
  backgroundRepeat?: string
  /** Full viewport height (default: true) */
  fullHeight?: boolean
  /** Custom height override */
  height?: string | number
  /** Include standard panel padding (default: true) */
  includePadding?: boolean
  /** Additional sx props for the container */
  sx?: SxProps<Theme>
  /** Additional sx props for the content wrapper (only used with backgroundImage) */
  contentSx?: SxProps<Theme>
  /** Panel content */
  children: React.ReactNode
}

export function Panel({
  id,
  ariaLabel,
  backgroundColor = "transparent",
  backgroundImage,
  backgroundSize = "cover",
  backgroundPosition = "center",
  backgroundRepeat = "no-repeat",
  fullHeight = true,
  height,
  includePadding = true,
  sx,
  contentSx,
  children,
}: PanelProps) {
  const theme = useTheme()

  // Determine if we need grid stacking (when background image is provided)
  const hasBackgroundImage = !!backgroundImage

  // Standard panel padding from theme
  const panelPadding = includePadding
    ? {
        paddingTop: theme.space.panel.topOffset,
        paddingBottom: theme.space.panel.bottomOffset,
        paddingLeft: theme.space.panel.padding,
        paddingRight: theme.space.panel.padding,
      }
    : {}

  // Simple mode: no background image, direct styling on container
  if (!hasBackgroundImage) {
    return (
      <Box
        component="section"
        id={id}
        aria-label={ariaLabel}
        sx={{
          position: "relative", // For absolute children (scroll indicators, etc.)
          height: fullHeight ? "100vh" : height,
          width: "100%",
          overflow: "hidden",
          backgroundColor,
          ...panelPadding,
          ...sx,
        }}
      >
        {children}
      </Box>
    )
  }

  // Grid stacking mode: background color → background image → content
  return (
    <Box
      component="section"
      id={id}
      aria-label={ariaLabel}
      sx={{
        position: "relative", // For absolute children (scroll indicators, etc.)
        display: "grid",
        gridTemplateAreas: '"stack"',
        gridTemplateRows: "1fr",
        height: fullHeight ? "100vh" : height,
        width: "100%",
        overflow: "hidden",
        backgroundColor,
        ...sx,
      }}
    >
      {/* Background image layer */}
      <Box
        aria-hidden="true"
        sx={{
          gridArea: "stack",
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize,
          backgroundPosition,
          backgroundRepeat,
          zIndex: 0,
        }}
      />

      {/* Content layer */}
      <Box
        sx={{
          gridArea: "stack",
          zIndex: 1,
          ...panelPadding,
          ...contentSx,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
