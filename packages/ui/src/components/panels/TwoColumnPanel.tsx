"use client"

import React from "react"
import {
  Box,
  Typography,
  BoxProps,
  ResponsiveStyleValue,
} from "../../mui-components"

interface TwoColumnPanelProps {
  /** Content for left column */
  leftContent?: React.ReactNode
  /** Content for right column */
  rightContent?: React.ReactNode
  /** Optional title for left column */
  leftTitle?: string
  /** Optional title for right column */
  rightTitle?: string
  /** When true, panel spans full viewport width (100vw) */
  fullWidth?: boolean
  /** When true, panel spans full viewport height (100vh) */
  fullHeight?: boolean
  /** Background color - any CSS color value */
  backgroundColor?: string
  /** Whether to include space for header at top */
  includeHeaderSpacing?: boolean
  /** Which column should contain the main content */
  contentColumn?: "left" | "right"
  /** Flex alignment for the content column */
  contentAlignment?: {
    justifyContent?: ResponsiveStyleValue<"flex-start" | "center" | "flex-end">
    alignItems?: ResponsiveStyleValue<
      "flex-start" | "center" | "flex-end" | "stretch"
    >
  }
  /** Text color - theme color path or hex color */
  textColor?: string
  /** Background elements (absolutely positioned) */
  children?: React.ReactNode
  /** Optional background image */
  backgroundImage?: string
  /** Responsive column order - can reverse columns/rows on smaller screens */
  reverseOnMobile?: boolean
  /** Show debug borders to visualize column layout */
  debug?: boolean
  /** Additional sx props */
  sx?: BoxProps["sx"]
  /** ID for the panel */
  id?: string
}

export function TwoColumnPanel({
  leftContent,
  rightContent,
  leftTitle,
  rightTitle,
  fullWidth = false,
  fullHeight = true,
  backgroundColor = "transparent",
  textColor,
  includeHeaderSpacing = true,
  contentColumn = "left",
  contentAlignment = {
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage,
  reverseOnMobile = false,
  debug = false,
  children,
  sx,
  id,
}: TwoColumnPanelProps) {
  const isLeftContent = contentColumn === "left"

  return (
    <Box
      id={id}
      sx={[
        (theme) => ({
          margin: 0,
          width: fullWidth ? "100vw" : "100%",
          height: fullHeight ? "100vh" : "auto",
          minHeight: fullHeight ? "100vh" : "auto",
          position: "relative",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" }, // Column on mobile/tablet, row on desktop

          // Header spacing via padding-top
          paddingTop: includeHeaderSpacing
            ? `${theme.layout.headerHeight}px`
            : 0,

          paddingLeft: "78px",
          paddingRight: "78px",

          // Background color
          backgroundColor: backgroundColor || "transparent",

          // Text color
          color: textColor || theme.palette.text.primary,

          // Optional background image
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : undefined,
          backgroundSize: backgroundImage ? "cover" : undefined,
          backgroundPosition: backgroundImage ? "center" : undefined,
        }),
        // Additional sx props
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/* Left Column */}
      <Box
        sx={{
          flex: { xs: "1 1 100%", lg: "1 1 50%" }, // Full width on mobile/tablet, 50% on desktop
          order: reverseOnMobile ? { xs: 2, lg: 1 } : 1, // Responsive order
          display: "flex",
          flexDirection: "column",
          justifyContent: isLeftContent
            ? contentAlignment.justifyContent
            : "flex-start",
          alignItems: isLeftContent
            ? contentAlignment.alignItems
            : "flex-start",
          position: "relative",
          minHeight: { xs: "auto", lg: "100%" }, // Auto height on mobile/tablet, full height on desktop
          // Debug borders (conditional)
          ...(debug && {
            border: "2px solid red",
            borderStyle: "dashed",
            zIndex: 9999,
          }),
        }}
      >
        {leftTitle && (
          <Typography variant="h2" gutterBottom>
            {leftTitle}
          </Typography>
        )}
        {leftContent}
      </Box>

      {/* Right Column */}
      <Box
        sx={{
          flex: { xs: "1 1 100%", lg: "1 1 50%" }, // Full width on mobile/tablet, 50% on desktop
          order: reverseOnMobile ? { xs: 1, lg: 2 } : 2, // Responsive order control
          display: rightContent ? "flex" : { xs: "none", lg: "flex" }, // Hide empty column on mobile/tablet
          flexDirection: "column",
          justifyContent: !isLeftContent
            ? contentAlignment.justifyContent
            : "flex-start",
          alignItems: !isLeftContent
            ? contentAlignment.alignItems
            : "flex-start",
          position: "relative",
          minHeight: { xs: "auto", lg: "100%" }, // Auto height on mobile/tablet, full height on desktop
          // Debug borders (conditional)
          ...(debug && {
            border: "2px solid blue",
            borderStyle: "dashed",
            zIndex: 9999,
          }),
        }}
      >
        {rightTitle && (
          <Typography variant="h2" gutterBottom>
            {rightTitle}
          </Typography>
        )}
        {rightContent}
      </Box>

      {/* Background Elements - absolutely positioned */}
      {children && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  )
}
