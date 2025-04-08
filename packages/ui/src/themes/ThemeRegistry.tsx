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
