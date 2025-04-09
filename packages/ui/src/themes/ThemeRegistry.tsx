"use client"

import * as React from "react"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import baseTheme from "./theme"

interface ThemeRegistryProps {
  children: React.ReactNode
  fontFamily?: string
}

export function ThemeRegistry({ children, fontFamily }: ThemeRegistryProps) {
  // Create a theme instance with the dynamic font family if provided
  const theme = React.useMemo(() => {
    if (!fontFamily) return baseTheme

    // Create a new theme that extends the base theme but with the new font family
    return createTheme({
      ...baseTheme,
      typography: {
        ...baseTheme.typography,
        fontFamily: `"${fontFamily}", Arial, sans-serif`,
        // Also update variant-specific font families
        body1: {
          ...baseTheme.typography.body1,
          fontFamily: `"${fontFamily}", Arial, sans-serif`,
        },
        body2: {
          ...baseTheme.typography.body2,
          fontFamily: `"${fontFamily}", Arial, sans-serif`,
        },
        h1: {
          ...baseTheme.typography.h1,
          fontFamily: `"${fontFamily}", Arial, sans-serif`,
        },
        h2: {
          ...baseTheme.typography.h2,
          fontFamily: `"${fontFamily}", Arial, sans-serif`,
        },
        h3: {
          ...baseTheme.typography.h3,
          fontFamily: `"${fontFamily}", Arial, sans-serif`,
        },
        h4: {
          ...baseTheme.typography.h4,
          fontFamily: `"${fontFamily}", Arial, sans-serif`,
        },
        h5: {
          ...baseTheme.typography.h5,
          fontFamily: `"${fontFamily}", Arial, sans-serif`,
        },
        h6: {
          ...baseTheme.typography.h6,
          fontFamily: `"${fontFamily}", Arial, sans-serif`,
        },
      },
    })
  }, [fontFamily])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
