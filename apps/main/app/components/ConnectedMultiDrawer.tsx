"use client"

import { AppMultiDrawer } from "@repo/ui"
import { useDrawerStore } from "@repo/state"
import { useTheme } from "@repo/ui/mui"
import type { TabKey } from "@repo/ui"

interface ConnectedMultiDrawerProps {
  drawerWidth?: number
  overlay?: boolean
  showRailButtons?: boolean
}

/**
 * Connects the AppMultiDrawer to the application's drawer store
 */
export function ConnectedMultiDrawer({
  drawerWidth = 360,
  overlay = false,
  showRailButtons = true,
}: ConnectedMultiDrawerProps) {
  const theme = useTheme()

  // Get state from the store
  const activeTab = useDrawerStore((state) => state.activeTab)
  const content = useDrawerStore((state) => state.content)
  const openDrawer = useDrawerStore((state) => state.openDrawer)
  const closeDrawer = useDrawerStore((state) => state.closeDrawer)

  // Handle drawer state changes
  const handleDrawerStateChange = (open: boolean, tab: TabKey | null) => {
    if (open && tab) {
      openDrawer(tab)
    } else {
      closeDrawer()
    }
  }

  return (
    <AppMultiDrawer
      drawerWidth={drawerWidth}
      overlay={overlay}
      showRailButtons={showRailButtons}
      activeTab={activeTab}
      drawerContent={content}
      onDrawerStateChange={handleDrawerStateChange}
      headerOffset={theme.layout.headerHeight}
    />
  )
}
