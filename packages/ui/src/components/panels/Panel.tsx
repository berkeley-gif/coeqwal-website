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
 * - Opt-in rounded corners via `borderRadius` (token key or raw CSS)
 * - Opt-in inset framing via `inset` (+ `frameBackground`) so all four
 *   rounded corners are visible against a frame.
 */

import React from "react"
import { Box, useTheme } from "@mui/material"
import type { SxProps, Theme } from "@mui/material"
import {
  resolveRadius,
  resolveInset,
  type RadiusValue,
  type PanelInset,
} from "./resolveRadius"

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
  /** Padding for navbar (default: true) */
  includeNavbarPadding?: boolean
  /** Additional sx props for the container */
  sx?: SxProps<Theme>
  /** Additional sx props for the content wrapper (only used with backgroundImage) */
  contentSx?: SxProps<Theme>
  /** Panel content */
  children: React.ReactNode
  /** Rounded corner radius for the panel surface. Token key
   *  ("none"|"xs"|"sm"|"md"|"lg"|"xl"|"2xl"|"pill"|"circle") or raw CSS value.
   *  Default: no radius (square). */
  borderRadius?: RadiusValue
  /** Pull the panel in from the viewport edges so all four rounded
   *  corners are visible. `true` uses a responsive default;
   *  `{ x, y }` overrides. */
  inset?: PanelInset
  /** Background rendered in the frame around an inset panel.
   *  Ignored when `inset` is falsy. Default: transparent (inherits parent). */
  frameBackground?: string
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
  includeNavbarPadding = true,
  sx,
  contentSx,
  children,
  borderRadius,
  inset,
  frameBackground,
}: PanelProps) {
  const theme = useTheme()

  const hasBackgroundImage = !!backgroundImage
  const radius = resolveRadius(borderRadius, theme.borderRadius)
  const insetCfg = resolveInset(inset)

  const panelPadding = includePadding
    ? {
        paddingTop: includeNavbarPadding
          ? theme.space.component.sm
          : theme.space.panel.padding,
        paddingBottom: includeNavbarPadding
          ? theme.space.component.sm
          : theme.space.panel.padding,
        paddingLeft: theme.space.panel.padding,
        paddingRight: theme.space.panel.padding,
      }
    : {}

  // Simple mode: no background image, direct styling on container
  if (!hasBackgroundImage) {
    const innerStyles = {
      position: "relative" as const, // For absolute children (scroll indicators, etc.)
      height: fullHeight ? "100vh" : "auto",
      width: "100%",
      overflow: fullHeight || radius !== undefined ? "hidden" : "visible",
      backgroundColor,
      borderRadius: radius,
      ...panelPadding,
    }

    if (insetCfg) {
      return (
        <Box
          component="section"
          id={id}
          aria-label={ariaLabel}
          sx={{
            background: frameBackground ?? "transparent",
            px: insetCfg.x,
            py: insetCfg.y,
            width: "100%",
            ...sx,
          }}
        >
          <Box sx={innerStyles}>{children}</Box>
        </Box>
      )
    }

    return (
      <Box
        component="section"
        id={id}
        aria-label={ariaLabel}
        sx={{
          ...innerStyles,
          ...sx,
        }}
      >
        {children}
      </Box>
    )
  }

  // Grid stacking mode: background color and background image and content
  const gridInnerStyles = {
    position: "relative" as const, // For absolute children (scroll indicators, etc.)
    display: "grid",
    gridTemplateAreas: '"stack"',
    gridTemplateRows: "1fr",
    height: fullHeight ? "100vh" : height,
    width: "100%",
    overflow: "hidden",
    backgroundColor,
    borderRadius: radius,
  }

  const gridInner = (
    <>
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
    </>
  )

  if (insetCfg) {
    return (
      <Box
        component="section"
        id={id}
        aria-label={ariaLabel}
        sx={{
          background: frameBackground ?? "transparent",
          px: insetCfg.x,
          py: insetCfg.y,
          width: "100%",
          ...sx,
        }}
      >
        <Box sx={gridInnerStyles}>{gridInner}</Box>
      </Box>
    )
  }

  return (
    <Box
      component="section"
      id={id}
      aria-label={ariaLabel}
      sx={{
        ...gridInnerStyles,
        ...sx,
      }}
    >
      {gridInner}
    </Box>
  )
}
