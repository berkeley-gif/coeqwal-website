import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { DrawerState, TabKey } from "./types"

export interface DrawerStoreState extends DrawerState {
  // Actions
  openDrawer: (tab: TabKey, width?: number) => void
  closeDrawer: () => void
  setActiveTab: (tab: TabKey | null) => void
  setDrawerWidth: (width: number) => void
  setDrawerContent: (content: Record<string, unknown>) => void
  // Convenience methods for specific panels
  openGlossaryPanel: () => void
}

export const useDrawerStore = create<DrawerStoreState>()(
  immer<DrawerStoreState>((set) => ({
    // Initial state
    isOpen: false,
    activeTab: null,
    drawerWidth: 360, // Default width
    content: {},

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
        // Clear any content when closing
        state.content = {}
      }),

    setActiveTab: (tab) =>
      set((state) => {
        // If switching tabs, clear content
        if (state.activeTab !== tab) {
          state.content = {}
        }

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

    // Convenience method for glossary panel
    openGlossaryPanel: () =>
      set((state) => {
        state.isOpen = true
        state.activeTab = "glossary"
        state.content = { selectedSection: undefined }
      }),
  })),
)
