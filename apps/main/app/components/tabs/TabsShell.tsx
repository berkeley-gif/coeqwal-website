"use client"

/**
 * TabsShell - flex column wrapper for SmoothTabs + TabPanels.
 *
 * Explore is viewport-locked (its tools manage their own internal
 * scrolling), so only Explore gets a bounded height here. Learn and
 * Share scroll the page naturally, same as any long page - no height
 * constraint, no overflow clipping.
 */

import { Box } from "@repo/ui/mui"
import { useTabs } from "../../context/Tabs"

export default function TabsShell({ children }: { children: React.ReactNode }) {
  const { state } = useTabs()
  const isExploreTab = state.activeTab === "explore"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        ...(isExploreTab && {
          height: "100dvh",
          overflow: "hidden",
        }),
      }}
    >
      {children}
    </Box>
  )
}
