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
  // Convenience methods for specific panels
  openLearnPanel: () => void
  openCurrentOpsPanel: () => void
  openThemesPanel: (selectedOperation?: string) => void
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

    // Convenience methods for specific buttons
    openLearnPanel: () =>
      set((state) => {
        // Close current panel content first if changing tabs
        if (state.activeTab !== "learn") {
          state.content = {}
        }

        state.isOpen = true
        state.activeTab = "learn"
        state.content = { selectedSection: undefined }
      }),

    openCurrentOpsPanel: () =>
      set((state) => {
        // Close current panel content first if changing tabs
        if (state.activeTab !== "currentOps") {
          state.content = {}
        }

        state.isOpen = true
        state.activeTab = "currentOps"
        state.content = { selectedSection: undefined }
      }),

    openThemesPanel: (selectedOperation) =>
      set((state) => {
        // Check if we're already on the themes tab with the same operation selected
        if (
          state.activeTab === "themes" &&
          state.content?.selectedOperation === selectedOperation
        ) {
          // Toggle behavior - close if the same operation is already selected
          state.isOpen = false
          state.activeTab = null
          state.content = {}
          return
        }

        // Otherwise, handle the transition to the themes panel
        const isTabChange = state.activeTab !== "themes"

        // First update the tab (critical for panel switching)
        state.activeTab = "themes"
        state.isOpen = true

        // Clear existing content if switching tabs
        if (isTabChange) {
          state.content = {}
        }

        // Then set the new content to ensure proper rendering
        state.content = { selectedOperation }
      }),
  })),
)
