"use client"

import React from "react"
import { Box, BoxProps } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface BasePanelProps extends BoxProps {
  fullHeight?: boolean
  background?: "light" | "dark" | "accent" | "transparent"
  paddingVariant?: "normal" | "narrow" | "wide" | "none"
  children?: React.ReactNode
}

const PanelRoot = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "fullHeight" && prop !== "background" && prop !== "paddingVariant",
})<BasePanelProps>(({ theme, fullHeight, background, paddingVariant }) => ({
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
          : "transparent",

  // Text color based on background
  color:
    background === "dark" || background === "accent"
      ? theme.palette.common.white
      : theme.palette.text.primary,

  // Padding variants with fixed top padding
  padding:
    paddingVariant === "none"
      ? `${theme.layout.headerHeight}px 0 0 0`
      : paddingVariant === "narrow"
        ? `${theme.layout.headerHeight}px ${theme.spacing(4)}`
        : paddingVariant === "wide"
          ? `${theme.layout.headerHeight}px ${theme.spacing(12)}`
          : `${theme.layout.headerHeight}px ${theme.spacing(6)}`,

  [theme.breakpoints.down("md")]: {
    padding:
      paddingVariant === "none"
        ? `${theme.layout.headerHeight}px 0 0 0`
        : paddingVariant === "narrow"
          ? `${theme.layout.headerHeight}px ${theme.spacing(3)}`
          : `${theme.layout.headerHeight}px ${theme.spacing(3)}`,
  },
}))

export function BasePanel({
  fullHeight = true,
  background = "light",
  paddingVariant = "normal",
  children,
  ...rest
}: BasePanelProps) {
  return (
    <PanelRoot
      fullHeight={fullHeight}
      background={background}
      paddingVariant={paddingVariant}
      {...rest}
    >
      {children}
    </PanelRoot>
  )
}
