"use client"

import React from "react"
import { Box, BoxProps } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface BasePanelProps extends BoxProps {
  fullHeight?: boolean
  background?: "light" | "dark" | "accent" | "transparent" | "interstitial"
  paddingVariant?:
    | "normal"
    | "narrow"
    | "wide"
    | "very-wide"
    | "content-first"
    | "content-middle"
    | "content-last"
    | "none"
  includeHeaderSpacing?: boolean
  children?: React.ReactNode
  /**
   * Optional background image that will cover the entire panel.  Useful for hero sections
   * or full-bleed graphics. When provided, the image is applied with
   * `background-size: cover` and `background-position: center` so it fills the
   * viewport while maintaining aspect ratio.
   */
  backgroundImage?: string
}

const PanelRoot = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "fullHeight" &&
    prop !== "background" &&
    prop !== "paddingVariant" &&
    prop !== "includeHeaderSpacing" &&
    prop !== "backgroundImage",
})<BasePanelProps>(({
  theme,
  fullHeight,
  background,
  paddingVariant,
  includeHeaderSpacing,
  backgroundImage,
}) => {
  // Base padding based on variant
  const getBasePadding = () => {
    if (paddingVariant === "none") return 0
    if (paddingVariant === "narrow") return theme.spacing(4)
    if (paddingVariant === "wide") return "120px"
    if (paddingVariant === "very-wide") return "192px"
    if (paddingVariant === "content-first") return "192px"
    if (paddingVariant === "content-middle") return "192px"
    if (paddingVariant === "content-last") return "192px"
    return theme.spacing(6) // normal padding
  }

  // Get padding for mobile screens
  const getMobilePadding = () => {
    if (paddingVariant === "none") return 0
    return theme.spacing(3) // for both narrow and normal on mobile
  }

  // Calculate top padding
  const getTopPadding = (basePad: string | number) => {
    if (paddingVariant === "none") {
      return includeHeaderSpacing ? `${theme.layout.headerHeight}px` : 0
    }
    return includeHeaderSpacing
      ? `${theme.layout.headerHeight + parseInt(basePad.toString(), 10)}px`
      : basePad
  }

  // Format the padding string
  const getPaddingString = (basePad: string | number) => {
    if (paddingVariant === "none") {
      return includeHeaderSpacing ? `${theme.layout.headerHeight}px 0 0 0` : 0
    }
    // First content section: full top padding, reduced bottom padding
    if (paddingVariant === "content-first") {
      const topPad = includeHeaderSpacing
        ? `${theme.layout.headerHeight + 192}px`
        : "192px"
      return `${topPad} 192px 120px 192px` // Full top padding, increased bottom (120px)
    }

    // Middle content section: reduced top/bottom padding
    if (paddingVariant === "content-middle") {
      const topPad = includeHeaderSpacing
        ? `${theme.layout.headerHeight + 80}px`
        : "80px"
      return `${topPad} 192px 120px 192px` // Top 80px, bottom 120px for 200px between sections
    }

    // Last content section: reduced top, full bottom padding
    if (paddingVariant === "content-last") {
      const topPad = includeHeaderSpacing
        ? `${theme.layout.headerHeight + 80}px`
        : "80px"
      return `${topPad} 192px 192px 192px` // Reduced top, full bottom padding
    }
    const topPad = getTopPadding(basePad)
    return `${topPad} ${basePad} ${basePad} ${basePad}`
  }

  // Get base padding values
  const basePadding = getBasePadding()
  const mobilePadding = getMobilePadding()

  return {
    margin: 0,
    width: "100%",
    minHeight: fullHeight ? "100vh" : "auto",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    alignItems: "stretch",
    textAlign: "left",

    // Background variants
    backgroundColor:
      background === "light"
        ? theme.palette.background.default
        : background === "dark"
          ? theme.palette.primary.main
          : background === "accent"
            ? theme.palette.pop.main
            : background === "interstitial"
              ? theme.palette.interstitial.main
              : "transparent",

    // Text color based on background
    color:
      background === "dark" ||
      background === "accent" ||
      background === "interstitial"
        ? theme.palette.common.white
        : theme.palette.text.primary,

    // Padding with conditional header spacing
    padding: getPaddingString(basePadding),

    // Responsive adjustments for smaller screens
    [theme.breakpoints.down("md")]: {
      padding: getPaddingString(mobilePadding),
    },

    // Optional full-bleed background image
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: backgroundImage ? "cover" : undefined,
    backgroundPosition: backgroundImage ? "center" : undefined,
  }
})

export function BasePanel({
  fullHeight = true,
  background = "light",
  paddingVariant = "normal",
  includeHeaderSpacing = true,
  backgroundImage,
  children,
  ...rest
}: BasePanelProps) {
  return (
    <PanelRoot
      fullHeight={fullHeight}
      background={background}
      paddingVariant={paddingVariant}
      includeHeaderSpacing={includeHeaderSpacing}
      backgroundImage={backgroundImage}
      {...rest}
    >
      {children}
    </PanelRoot>
  )
}
