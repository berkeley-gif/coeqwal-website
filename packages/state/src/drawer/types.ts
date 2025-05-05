import type { TabKey } from "@repo/ui"

// Additional configuration options for the drawer
export type DrawerSize = "default" | "large" | "full"

// State for the drawer
export interface DrawerState {
  // Current state
  isOpen: boolean
  activeTab: TabKey | null
  drawerWidth: number
  content?: Record<string, unknown>
}
