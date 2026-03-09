// apps/main/components/ActiveThemePanel.tsx
// Thin client wrapper — owns the lookup, passes single theme down
"use client"

import { usePanelRoute } from "../hooks/usePanelRoute"
import { WATER_THEMES } from "../content/themes"
import { ThemePanel } from "./ThemePanel"

export function ActiveThemePanel() {
  const { activeThemeKey } = usePanelRoute()
  const activeTheme = WATER_THEMES.find((t) => t.id === activeThemeKey) ?? null

  return <ThemePanel theme={activeTheme} />
}
