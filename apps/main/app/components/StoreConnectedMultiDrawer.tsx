"use client"

import React from "react"
import { MultiDrawer } from "@repo/ui"
import { useDrawerStore } from "@repo/state"
import type { TabKey, SecondaryNavItem } from "@repo/ui"

interface StoreConnectedMultiDrawerProps {
  drawerWidth?: number
  overlay?: boolean
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
  showSecondaryNav?: boolean
  secondaryNavItems?: SecondaryNavItem[]
  showRailButton?: boolean
}

/**
 * Connects the MultiDrawer component to the drawer store
 */
export function StoreConnectedMultiDrawer({
  drawerWidth,
  overlay = false,
  showRailButton = false,
}: StoreConnectedMultiDrawerProps) {
  // Get individual pieces of state from the store to avoid infinite loop
  const activeTab = useDrawerStore((state) => state.activeTab)
  const content = useDrawerStore((state) => state.content)
  const openDrawer = useDrawerStore((state) => state.openDrawer)
  const closeDrawer = useDrawerStore((state) => state.closeDrawer)

  // Sync drawer state with store
  const handleDrawerStateChange = (open: boolean, tab: TabKey | null) => {
    if (open && tab) {
      openDrawer(tab)
    } else {
      closeDrawer()
    }
  }

  return (
    <MultiDrawer
      drawerWidth={drawerWidth}
      activeTab={activeTab}
      onDrawerStateChange={handleDrawerStateChange}
      overlay={overlay}
      drawerContent={content}
      showRailButton={showRailButton}
    />
  )
}
