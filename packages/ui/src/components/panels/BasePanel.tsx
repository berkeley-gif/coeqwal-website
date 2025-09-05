"use client"

import React from "react"
import { Box, BoxProps } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface BasePanelProps extends BoxProps {
  fullHeight?: boolean
  /** When true, panel spans full viewport width (100vw) */
  fullWidth?: boolean
  /** Explicit width for the panel. Use instead of sx.width for clarity */
  panelWidth?: string | number
  background?: "light" | "dark" | "accent" | "transparent"
  paddingVariant?:
    | "normal"
    | "narrow"
    | "wide"
    | "very-wide"
    | "content-centered"
    | "none"
  includeHeaderSpacing?: boolean
  children?: React.ReactNode
  /**
   * Optional background image (poster image) that will cover the entire panel.  Useful for hero sections
   * or full-bleed graphics. When provided, the image is applied with
   * `background-size: cover` and `background-position: center` so it fills the
   * viewport while maintaining aspect ratio.
   */
  backgroundImage?: string
}

const PanelRoot = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "fullHeight" &&
    prop !== "fullWidth" &&
    prop !== "panelWidth" &&
    prop !== "background" &&
    prop !== "paddingVariant" &&
    prop !== "includeHeaderSpacing" &&
    prop !== "backgroundImage",
})<BasePanelProps>(({
  theme,
  fullHeight,
  fullWidth,
  panelWidth,
  background,
  paddingVariant,
  includeHeaderSpacing,
  backgroundImage,
  id,
}) => {
  const toPx = (v: string | number) => (typeof v === "number" ? `${v}px` : v)
  const toNum = (v: string | number) => parseInt(v.toString(), 10)

  // Base padding Desktop
  const getBasePaddingDesktop = () => {
    if (paddingVariant === "none") return 0
    if (paddingVariant === "narrow") return theme.spacing(4)
    if (paddingVariant === "wide") return "120px"
    if (paddingVariant === "very-wide") return "192px"
    if (paddingVariant === "content-centered") return "192px"
    return theme.spacing(6) // normal padding
  }

  // Base padding Tablet
  const getBasePaddingTablet = () => {
    if (paddingVariant === "none") return 0
    if (paddingVariant === "narrow") return theme.spacing(4)
    if (paddingVariant === "wide") return "80px"
    if (paddingVariant === "very-wide") return "120px"
    if (paddingVariant === "content-centered") return "120px"
    return theme.spacing(5) // normal padding
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
      ? `${theme.layout.headerHeight + toNum(basePad)}px`
      : basePad
  }

  // Format the padding string
  const getPaddingString = (basePad: string | number) => {
    const side = toPx(basePad)
    if (paddingVariant === "none") {
      return includeHeaderSpacing ? `${theme.layout.headerHeight}px 0 0 0` : 0
    }

    // Centered content: minimal padding, flexbox centering
    if (paddingVariant === "content-centered") {
      const topPad = includeHeaderSpacing
        ? `${theme.layout.headerHeight}px`
        : "0px"
      return `${topPad} ${side} 0px ${side}`
    }
    const topPad = getTopPadding(basePad)
    return `${topPad} ${side} ${side} ${side}`
  }
  // Base paddings by breakpoint tier
  const desktopSide = getBasePaddingDesktop()
  const tabletSide = getBasePaddingTablet()
  const mobileSide = getMobilePadding()

  return {
    margin: 0,
    width: panelWidth ?? (fullWidth ? "100vw" : "100%"),
    minHeight: fullHeight ? "100vh" : "auto",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    alignItems: paddingVariant === "content-centered" ? "center" : "stretch",
    justifyContent:
      paddingVariant === "content-centered" ? "center" : "flex-start",
    textAlign: "left",

    // Background variants
    backgroundColor:
      background === "light"
        ? theme.palette.background.default
        : background === "dark"
          ? theme.palette.primary.main
          : background === "accent"
            ? theme.palette.accent.gold
            : "transparent",

    // Text color based on background
    color:
      background === "dark" || background === "accent"
        ? theme.palette.common.white
        : theme.palette.text.primary,

    // Desktop / default padding
    padding: getPaddingString(desktopSide),

    // Responsive adjustments for smaller screens
    [theme.breakpoints.between("md", "lg")]: {
      padding: getPaddingString(tabletSide),
    },

    [theme.breakpoints.down("sm")]: {
      padding: getPaddingString(mobileSide),
    },

    // Optional full-bleed background image
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: backgroundImage ? "cover" : undefined,
    backgroundPosition: backgroundImage ? "center" : undefined,

    // ---- Special-case: tablet hero padding for #home ----
    // We want the final computed padding (including header considerations)
    // to be ~50vh on top. We just force 50vh top + 120px sides/bottom
    // across the whole tablet band (sm..lg). This effectively "includes"
    // header spacing in the 50vh figure.
    ...(id === "home"
      ? {
          [theme.breakpoints.between("sm", "lg")]: {
            paddingTop: "50vh",
            paddingRight: "120px",
            paddingBottom: "120px",
            paddingLeft: "120px",
          },
        }
      : {}),
  }
})

export function BasePanel({
  fullHeight = true,
  fullWidth = false,
  panelWidth,
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
      fullWidth={fullWidth}
      panelWidth={panelWidth}
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
