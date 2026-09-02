"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Box, CircularProgress, Typography } from "@repo/ui/mui"
import { normalizePathname } from "../lib/routePath"
import { TABS, type TabKey } from "../types/tabs"

export function NavigationOverlay() {
  const pathname = normalizePathname(usePathname())
  const [navigatingTab, setNavigatingTab] = useState<TabKey | null>(null)

  useEffect(() => {
    const handleNavigating = (event: Event) => {
      const tab = (event as CustomEvent<{ tab: TabKey }>).detail?.tab
      if (tab) setNavigatingTab(tab)
    }
    window.addEventListener("explore:navigating", handleNavigating)
    return () =>
      window.removeEventListener("explore:navigating", handleNavigating)
  }, [])

  // Once the pathname actually changes, the destination route has
  // mounted, so the overlay's job is done.
  useEffect(() => {
    setNavigatingTab(null)
  }, [pathname])

  if (!navigatingTab) return null

  // Reuse each tab's existing panel color (same source SmoothTabs
  // draws from) so the overlay reads as a preview of the destination
  // rather than a generic system dialog.
  const tabColor = TABS.find((t) => t.key === navigatingTab)?.panelColor
  const label = navigatingTab[0]?.toUpperCase() + navigatingTab.slice(1)

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "fixed",
        inset: 0,
        // Highest token in the scale - must sit above the header,
        // the map, and any dropdowns/tooltips currently open.
        zIndex: (theme) => theme.zIndex.tooltipAboveModal,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        backgroundColor: tabColor ?? "background.paper",
        color: "common.white",
      }}
    >
      {/* MUI's indeterminate CircularProgress animates via CSS
          (stroke-dashoffset keyframes), not JS/rAF - so it keeps
          spinning smoothly on the compositor thread even while the
          main thread is busy parsing/executing the incoming bundle. */}
      <CircularProgress color="inherit" />
      <Typography variant="body1" color="inherit">
        Loading {label}…
      </Typography>
    </Box>
  )
}
