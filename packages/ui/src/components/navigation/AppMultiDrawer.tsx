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
  headerOffset?: number
}

/**
 * Application multi-drawer component with state accepted as props
 */
export function AppMultiDrawer({
  drawerWidth = 360,
  overlay = false,
  showRailButtons = true,
  activeTab = null,
  drawerContent = null,
  onDrawerStateChange,
  headerOffset = 0,
}: AppMultiDrawerProps) {
  return (
    <MultiDrawer
      drawerWidth={drawerWidth}
      activeTab={activeTab}
      onDrawerStateChange={onDrawerStateChange}
      overlay={overlay}
      drawerContent={drawerContent}
      showRailButtons={showRailButtons}
      headerOffset={headerOffset}
    />
  )
}
