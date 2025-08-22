"use client"

import { MultiDrawer } from "./MultiDrawer"
import type { TabKey } from "./MultiDrawer"

export interface AppMultiDrawerProps {
  drawerWidth?: number
  overlay?: boolean
  showRailButtons?: boolean
  activeTab?: TabKey | null
  drawerContent?: any
  onDrawerStateChange?: (open: boolean, tab: TabKey | null) => void
}

/**
 * Application multi-drawer component - pure UI component that accepts state as props
 */
export function AppMultiDrawer({
  drawerWidth = 360,
  overlay = false,
  showRailButtons = true,
  activeTab = null,
  drawerContent = null,
  onDrawerStateChange,
}: AppMultiDrawerProps) {
  return (
    <MultiDrawer
      drawerWidth={drawerWidth}
      activeTab={activeTab}
      onDrawerStateChange={onDrawerStateChange}
      overlay={overlay}
      drawerContent={drawerContent}
      showRailButtons={showRailButtons}
    />
  )
}
