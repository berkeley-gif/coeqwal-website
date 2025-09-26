"use client"

import React from "react"
import { Box } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface DashboardPanelProps {
  children?: React.ReactNode
  /** Background color */
  backgroundColor?: string
  /** Text color */
  color?: string
  /** Header height for spacing calculations */
  headerHeight?: number
  /** Include header spacing at the top */
  includeHeaderSpacing?: boolean
  /** Padding values for different breakpoints */
  panelPadding?: {
    desktop?: { top?: number; sides?: number; bottom?: number }
    tablet?: { top?: number; sides?: number; bottom?: number }
    mobile?: { top?: number; sides?: number; bottom?: number }
  }
  /** Additional styles */
  sx?: React.CSSProperties
}

const DashboardPanelRoot = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "backgroundColor" &&
    prop !== "color" &&
    prop !== "headerHeight" &&
    prop !== "includeHeaderSpacing" &&
    prop !== "panelPadding",
})<{
  backgroundColor?: string
  color?: string
  headerHeight?: number
  includeHeaderSpacing?: boolean
  panelPadding?: {
    desktop?: { top?: number; sides?: number; bottom?: number }
    tablet?: { top?: number; sides?: number; bottom?: number }
    mobile?: { top?: number; sides?: number; bottom?: number }
  }
}>(
  ({
    backgroundColor = "#edf2f7",
    color = "#3a4574",
    headerHeight = 70,
    includeHeaderSpacing = true,
    panelPadding = {
      desktop: { top: 24, sides: 24, bottom: 24 },
      tablet: { top: 16, sides: 16, bottom: 16 },
      mobile: { top: 16, sides: 16, bottom: 16 },
    },
  }) => ({
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    backgroundColor,
    color,

    paddingTop: includeHeaderSpacing
      ? `${headerHeight + (panelPadding.desktop?.top || 24)}px`
      : `${panelPadding.desktop?.top || 24}px`,
    paddingLeft: `${panelPadding.desktop?.sides || 24}px`,
    paddingRight: `${panelPadding.desktop?.sides || 24}px`,
    paddingBottom: `${panelPadding.desktop?.bottom || 24}px`,

    "@media (min-width: 900px) and (max-width: 1199px)": {
      paddingTop: includeHeaderSpacing
        ? `${headerHeight + (panelPadding.tablet?.top || 16)}px`
        : `${panelPadding.tablet?.top || 16}px`,
      paddingLeft: `${panelPadding.tablet?.sides || 16}px`,
      paddingRight: `${panelPadding.tablet?.sides || 16}px`,
      paddingBottom: `${panelPadding.tablet?.bottom || 16}px`,
    },

    "@media (max-width: 599px)": {
      paddingTop: includeHeaderSpacing
        ? `${headerHeight + (panelPadding.mobile?.top || 16)}px`
        : `${panelPadding.mobile?.top || 16}px`,
      paddingLeft: `${panelPadding.mobile?.sides || 16}px`,
      paddingRight: `${panelPadding.mobile?.sides || 16}px`,
      paddingBottom: `${panelPadding.mobile?.bottom || 16}px`,
    },
  }),
)

export function DashboardPanel({
  children,
  backgroundColor,
  color,
  headerHeight,
  includeHeaderSpacing = true,
  panelPadding,
  sx,
}: DashboardPanelProps) {
  return (
    <DashboardPanelRoot
      backgroundColor={backgroundColor}
      color={color}
      headerHeight={headerHeight}
      includeHeaderSpacing={includeHeaderSpacing}
      panelPadding={panelPadding}
      sx={sx}
    >
      {children}
    </DashboardPanelRoot>
  )
}

export interface DashboardGridProps {
  children?: React.ReactNode
  /** Gap spacing in pixels */
  spacing?: number
  sx?: React.CSSProperties
}

export function DashboardGrid({
  children,
  spacing = 16,
  sx,
}: DashboardGridProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: `${spacing}px`,
        width: "100%",
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

export interface DashboardCardContainerProps {
  children?: React.ReactNode
  width?: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
  }
  /** Padding in pixels */
  padding?: number
  sx?: React.CSSProperties
}

export function DashboardCardContainer({
  children,
  width = {
    xs: "100%",
    sm: "100%",
    md: "50%",
    lg: "33.33%",
    xl: "41.67%",
  },
  padding = 4,
  sx,
}: DashboardCardContainerProps) {
  return (
    <Box
      sx={{
        width: {
          xs: width.xs,
          sm: width.sm,
          md: width.md,
          lg: width.lg,
          xl: width.xl,
        },
        padding: `${padding}px`,
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}
