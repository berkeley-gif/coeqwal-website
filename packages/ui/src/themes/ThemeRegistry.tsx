"use client"

import * as React from "react"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import baseTheme from "./theme"
import storyTheme from "./storyTheme"

interface ThemeRegistryProps {
  theme?: string,
  children: React.ReactNode,
}

export function ThemeRegistry({
  theme="base",
  children,
}: ThemeRegistryProps) {
  const themeToUse = (theme === "story") ? storyTheme : baseTheme

  return (
    <ThemeProvider theme={themeToUse}>
      {children}
      <CssBaseline />
    </ThemeProvider>
  )
}
