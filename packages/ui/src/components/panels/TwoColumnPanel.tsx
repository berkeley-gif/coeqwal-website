"use client"

import React from "react"
import { Box, Typography, BoxProps } from "@mui/material"
import { styled } from "@mui/material/styles"
// import { ResponsiveStyleValue } from "@mui/system"

interface TwoColumnPanelProps extends BoxProps {
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
    justifyContent?: "flex-start" | "center" | "flex-end" | { xs?: "flex-start" | "center" | "flex-end"; md?: "flex-start" | "center" | "flex-end"; lg?: "flex-start" | "center" | "flex-end" }
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | { xs?: "flex-start" | "center" | "flex-end" | "stretch"; md?: "flex-start" | "center" | "flex-end" | "stretch"; lg?: "flex-start" | "center" | "flex-end" | "stretch" }
  }
  /** Text color - theme color path or hex color */
  textColor?: string
  /** Background elements (absolutely positioned) */
  children?: React.ReactNode
  /** Optional background image */
  backgroundImage?: string
}

const TwoColumnRoot = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "fullHeight" &&
    prop !== "fullWidth" &&
    prop !== "backgroundColor" &&
    prop !== "textColor" &&
    prop !== "includeHeaderSpacing" &&
    prop !== "backgroundImage",
})<TwoColumnPanelProps>(({
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
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "row",

    // Header spacing via padding-top
    paddingTop: includeHeaderSpacing ? `${theme.layout.headerHeight}px` : 0,

    paddingLeft: "78px",
    paddingRight: "78px",

    // Background color
    backgroundColor: backgroundColor || "transparent",

    // Text color
    color: textColor || theme.palette.text.primary,

    // Optional background image
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: backgroundImage ? "cover" : undefined,
    backgroundPosition: backgroundImage ? "center" : undefined,
  }
})

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
  children,
  ...rest
}: TwoColumnPanelProps) {
  const isLeftContent = contentColumn === "left"

  return (
    <TwoColumnRoot
      fullHeight={fullHeight}
      fullWidth={fullWidth}
      backgroundColor={backgroundColor}
      textColor={textColor}
      includeHeaderSpacing={includeHeaderSpacing}
      backgroundImage={backgroundImage}
      {...rest}
    >
      {/* Left Column - 50% width */}
      <Box
        sx={{
          width: "50%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: isLeftContent
            ? contentAlignment.justifyContent
            : "flex-start",
          alignItems: isLeftContent
            ? contentAlignment.alignItems
            : "flex-start",
          position: "relative",
        }}
      >
        {leftTitle && (
          <Typography variant="h2" gutterBottom>
            {leftTitle}
          </Typography>
        )}
        {leftContent}
      </Box>

      {/* Right Column - 50% width */}
      <Box
        sx={{
          width: "50%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: !isLeftContent
            ? contentAlignment.justifyContent
            : "flex-start",
          alignItems: !isLeftContent
            ? contentAlignment.alignItems
            : "flex-start",
          position: "relative",
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
    </TwoColumnRoot>
  )
}
