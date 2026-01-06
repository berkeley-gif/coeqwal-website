"use client"

/**
 * ThemeRegistry - Theme provider wrapper
 *
 * Provides MUI theme context to the application.
 * Currently supports switching between base and story themes.
 */

import * as React from "react"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import GlobalStyles from "@mui/material/GlobalStyles"
import baseTheme, { fontCssImport } from "./theme"
import storyTheme from "./storyTheme"

interface ThemeRegistryProps {
  theme?: string
  children: React.ReactNode
}

export function ThemeRegistry({
  theme = "base",
  children,
}: ThemeRegistryProps) {
  const themeToUse = theme === "story" ? storyTheme : baseTheme

  return (
    <ThemeProvider theme={themeToUse}>
      {/* Font import must come before all other styles */}
      {fontCssImport && <GlobalStyles styles={fontCssImport} />}
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
