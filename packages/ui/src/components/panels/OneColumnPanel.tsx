"use client"

/**
 * OneColumnPanel - Single column content panel with header
 *
 * Displays content in a single column layout with optional header text.
 * Used for content sections in the Learn tab.
 */

import React from "react"
import { Box, Typography, BoxProps } from "@mui/material"
import { styled } from "@mui/material/styles"
import { ResponsiveStyleValue } from "@repo/ui/mui"

interface OneColumnPanelProps extends Omit<BoxProps, "content"> {
  /** Main content for the panel */
  content?: React.ReactNode
  /** Optional title for the panel */
  title?: string
  /** When true, panel spans full viewport width (100vw) */
  fullWidth?: boolean
  /** When true, panel spans full viewport height (100vh) */
  fullHeight?: boolean
  /** Background color - any CSS color value */
  backgroundColor?: string
  /** Text color - theme color path or hex color */
  textColor?: string
  /** Whether to include space for header at top */
  includeHeaderSpacing?: boolean
  /** Flex alignment for the content */
  contentAlignment?: {
    justifyContent?: ResponsiveStyleValue<"flex-start" | "center" | "flex-end">
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch"
  }
  /** Background elements (absolutely positioned) */
  children?: React.ReactNode
  /** Optional background image */
  backgroundImage?: string
}

const OneColumnRoot = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "fullHeight" &&
    prop !== "fullWidth" &&
    prop !== "backgroundColor" &&
    prop !== "textColor" &&
    prop !== "includeHeaderSpacing" &&
    prop !== "backgroundImage",
})<OneColumnPanelProps>(({
  theme,
  fullHeight,
  fullWidth,
  backgroundColor,
  textColor,
  includeHeaderSpacing,
  backgroundImage,
}) => {
  return {
    margin: 0,
    width: fullWidth ? "100vw" : "100%",
    height: fullHeight ? "100vh" : "auto",
    minHeight: fullHeight ? "100vh" : "auto",
    position: "relative",
    display: "flex",
    flexDirection: "column",

    // Header spacing via padding-top
    paddingTop: includeHeaderSpacing ? `${theme.layout.headerHeight}px` : 0,

    // Background color
    backgroundColor: backgroundColor || "transparent",

    // Text color
    color: textColor || theme.palette.blue.darkest,

    // Optional background image
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: backgroundImage ? "cover" : undefined,
    backgroundPosition: backgroundImage ? "center" : undefined,
  }
})

export function OneColumnPanel({
  content,
  title,
  fullWidth = false,
  fullHeight = true,
  backgroundColor = "transparent",
  textColor,
  includeHeaderSpacing = true,
  contentAlignment = {
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage,
  children,
  ...rest
}: OneColumnPanelProps) {
  return (
    <OneColumnRoot
      fullHeight={fullHeight}
      fullWidth={fullWidth}
      backgroundColor={backgroundColor}
      textColor={textColor}
      includeHeaderSpacing={includeHeaderSpacing}
      backgroundImage={backgroundImage}
      {...rest}
    >
      {/* Main Content Column - full width */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: contentAlignment.justifyContent,
          alignItems: contentAlignment.alignItems,
          position: "relative",
        }}
      >
        {title && (
          <Typography variant="h2" gutterBottom>
            {title}
          </Typography>
        )}
        {content}
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
    </OneColumnRoot>
  )
}
