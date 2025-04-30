"use client"

import React from "react"
import { Box, BoxProps } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface BasePanelProps extends BoxProps {
  fullHeight?: boolean
  background?: "light" | "dark" | "accent" | "transparent" | "interstitial"
  paddingVariant?: "normal" | "narrow" | "wide" | "very-wide" | "none"
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
    if (paddingVariant === "wide") return theme.spacing(12)
    if (paddingVariant === "very-wide") return "192px"
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
    const topPad = getTopPadding(basePad)
    return `${topPad} ${basePad} ${basePad} ${basePad}`
  }

  // Get base padding values
  const basePadding = getBasePadding()
  const mobilePadding = getMobilePadding()

  return {
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
