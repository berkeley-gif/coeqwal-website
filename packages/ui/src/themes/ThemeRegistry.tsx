"use client"

import * as React from "react"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import baseTheme from "./theme"

interface ThemeRegistryProps {
  children: React.ReactNode
  fontFamily?: string
  fontWeights?: {
    light?: number
    regular?: number
    medium?: number
    bold?: number
  }
}

export function ThemeRegistry({
  children,
  fontFamily,
  fontWeights = { light: 300, regular: 400, medium: 500, bold: 700 },
}: ThemeRegistryProps) {
  // Create a theme instance with the dynamic font family if provided
  const theme = React.useMemo(() => {
    if (!fontFamily) return baseTheme

    // Create a new theme that extends the base theme but with the new font family
    return createTheme({
      ...baseTheme,
      typography: {
        ...baseTheme.typography,
        fontFamily: `"${fontFamily}"`,
        fontWeightLight: fontWeights.light || 300,
        fontWeightRegular: fontWeights.regular || 400,
        fontWeightMedium: fontWeights.medium || 500,
        fontWeightBold: fontWeights.bold || 700,
        // Also update variant-specific font families
        body1: {
          ...baseTheme.typography.body1,
          fontFamily: `"${fontFamily}"`,
          letterSpacing: "normal",
        },
        body2: {
          ...baseTheme.typography.body2,
          fontFamily: `"${fontFamily}"`,
          letterSpacing: "normal",
        },
        h1: {
          ...baseTheme.typography.h1,
          fontFamily: `"${fontFamily}"`,
          letterSpacing: "normal",
        },
        h2: {
          ...baseTheme.typography.h2,
          fontFamily: `"${fontFamily}"`,
          letterSpacing: "normal",
        },
        h3: {
          ...baseTheme.typography.h3,
          fontFamily: `"${fontFamily}"`,
          letterSpacing: "normal",
        },
        h4: {
          ...baseTheme.typography.h4,
          fontFamily: `"${fontFamily}"`,
          letterSpacing: "normal",
        },
        h5: {
          ...baseTheme.typography.h5,
          fontFamily: `"${fontFamily}"`,
          letterSpacing: "normal",
        },
        h6: {
          ...baseTheme.typography.h6,
          fontFamily: `"${fontFamily}"`,
          letterSpacing: "normal",
        },
        button: {
          ...baseTheme.typography.button,
          fontFamily: `"${fontFamily}"`,
          letterSpacing: "normal",
        },
        caption: {
          ...baseTheme.typography.caption,
          letterSpacing: "normal",
        },
        overline: {
          ...baseTheme.typography.overline,
          letterSpacing: "normal",
        },
        subtitle1: {
          ...baseTheme.typography.subtitle1,
          letterSpacing: "normal",
        },
        subtitle2: {
          ...baseTheme.typography.subtitle2,
          letterSpacing: "normal",
        },
      },
    })
  }, [fontFamily, fontWeights])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
