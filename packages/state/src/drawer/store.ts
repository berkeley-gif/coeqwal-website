import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { DrawerState } from "./types"

// TabKey type from the component
type TabKey = "learn" | "currentOps" | "themes"

export interface DrawerStoreState extends DrawerState {
  // Actions
  openDrawer: (tab: TabKey, width?: number) => void
  closeDrawer: () => void
  setActiveTab: (tab: TabKey | null) => void
  setDrawerWidth: (width: number) => void
  setDrawerContent: (content: Record<string, unknown>) => void
}

export const useDrawerStore = create<DrawerStoreState>()(
  immer<DrawerStoreState>((set) => ({
    // Initial state
    isOpen: false,
    activeTab: null,
    drawerWidth: 360, // Default width

    // Actions
    openDrawer: (tab, width = 360) =>
      set((state) => {
        state.isOpen = true
        state.activeTab = tab
        state.drawerWidth = width
      }),

    closeDrawer: () =>
      set((state) => {
        state.isOpen = false
        state.activeTab = null
      }),

    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab
        state.isOpen = tab !== null
      }),

    setDrawerWidth: (width) =>
      set((state) => {
        state.drawerWidth = width
      }),

    setDrawerContent: (content) =>
      set((state) => {
        state.content = content
      }),
  })),
)
