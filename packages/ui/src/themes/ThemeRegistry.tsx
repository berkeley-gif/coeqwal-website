"use client"

/**
 * ThemeRegistry - Theme provider wrapper
 *
 * Provides MUI theme context and motion configuration to the application.
 * Currently supports switching between base and story themes.
 *
 * AppRouterCacheProvider ensures Emotion-generated styles are collected during
 * SSR/SSG and injected into <head>, preventing Flash of Unstyled Content (FOUC).
 *
 * WCAG 2.3.3: MotionConfig with reducedMotion="user" automatically respects
 * the user's system preference for reduced motion across all Framer Motion
 * animations in the app.
 */

import * as React from "react"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import GlobalStyles from "@mui/material/GlobalStyles"
import { MotionConfig } from "@repo/motion"
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
    <AppRouterCacheProvider>
      <ThemeProvider theme={themeToUse}>
        {/* Font import must come before all other styles */}
        {fontCssImport && <GlobalStyles styles={fontCssImport} />}
        <CssBaseline />
        {/* WCAG 2.3.3: Respect user's reduced motion preference for all animations */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
