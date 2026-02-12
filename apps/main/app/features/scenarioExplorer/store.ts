/**
 * Scenario Explorer store - state management for multi-view scenario exploration
 *
 * This store manages state that is shared across multiple components in the
 * Scenario Explorer feature. Local UI state (like modal open/close, hover states)
 * should remain in individual components.
 */

import { create, immer } from "@repo/state/zustand"

// ============================================================================
// Types
// ============================================================================

/**
 * The current tool mode within the "Choose scenarios" view.
 * - list: Default grid view of all scenarios
 * - map: Spatial visualization with map overlay
 * - comparison: Parallel coordinates chart comparison
 * - equity: Equity analysis tool with map on right
 */
export type ExploreMode = "list" | "map" | "comparison" | "equity"

/**
 * The main view within the Explore section.
 * - explorer: "Choose scenarios" view with tool modes (list/map/comparison)
 * - data: "Explore data in depth" view
 */
export type MainView = "explorer" | "data"

// ============================================================================
// State Interface
// ============================================================================

interface ScenarioExplorerState {
  // Navigation
  mainView: MainView
  exploreMode: ExploreMode

  // Scenario selection (shared across all views)
  selectedScenarios: string[]
  highlightedScenario: string | null
  pinnedScenarioId: string | null

  // Filtering
  searchQuery: string
  showOnlyChosen: boolean

  // Display options
  showDefinitions: boolean

  // Tier selection (for map visualization)
  selectedTier: { strategy: string; outcome: string } | null
}

// ============================================================================
// Actions Interface
// ============================================================================

interface ScenarioExplorerActions {
  // Navigation
  setMainView: (view: MainView) => void
  setExploreMode: (mode: ExploreMode) => void

  // Scenario selection
  toggleScenario: (scenarioId: string) => void
  selectScenarios: (scenarioIds: string[]) => void
  clearScenarios: () => void
  setHighlightedScenario: (scenarioId: string | null) => void
  setPinnedScenarioId: (scenarioId: string | null) => void

  // Filtering
  setSearchQuery: (query: string) => void
  setShowOnlyChosen: (show: boolean) => void

  // Display options
  setShowDefinitions: (show: boolean) => void

  // Tier selection
  setSelectedTier: (tier: { strategy: string; outcome: string } | null) => void

  // Reset functions
  resetFilters: () => void
  resetSelections: () => void
  resetAll: () => void
}

type ScenarioExplorerStore = ScenarioExplorerState & ScenarioExplorerActions

// ============================================================================
// Initial State
// ============================================================================

const initialState: ScenarioExplorerState = {
  mainView: "explorer",
  exploreMode: "list",
  selectedScenarios: [],
  highlightedScenario: null,
  pinnedScenarioId: null,
  searchQuery: "",
  showOnlyChosen: false,
  showDefinitions: true,
  selectedTier: null,
}

// ============================================================================
// Store
// ============================================================================

export const useScenarioExplorerStore = create<ScenarioExplorerStore>()(
  immer<ScenarioExplorerStore>((set) => ({
    ...initialState,

    // Navigation
    setMainView: (view) =>
      set((state) => {
        state.mainView = view
      }),

    setExploreMode: (mode) =>
      set((state) => {
        state.exploreMode = mode
      }),

    // Scenario selection
    toggleScenario: (scenarioId) =>
      set((state) => {
        const index = state.selectedScenarios.indexOf(scenarioId)
        if (index > -1) {
          state.selectedScenarios.splice(index, 1)
        } else {
          state.selectedScenarios.push(scenarioId)
        }
      }),

    selectScenarios: (scenarioIds) =>
      set((state) => {
        state.selectedScenarios = scenarioIds
      }),

    clearScenarios: () =>
      set((state) => {
        state.selectedScenarios = []
      }),

    setHighlightedScenario: (scenarioId) =>
      set((state) => {
        state.highlightedScenario = scenarioId
      }),

    setPinnedScenarioId: (scenarioId) =>
      set((state) => {
        state.pinnedScenarioId = scenarioId
      }),

    // Filtering
    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query
      }),

    setShowOnlyChosen: (show) =>
      set((state) => {
        state.showOnlyChosen = show
      }),

    // Display options
    setShowDefinitions: (show) =>
      set((state) => {
        state.showDefinitions = show
      }),

    // Tier selection
    setSelectedTier: (tier) =>
      set((state) => {
        state.selectedTier = tier
      }),

    // Reset functions
    resetFilters: () =>
      set((state) => {
        state.searchQuery = ""
      }),

    resetSelections: () =>
      set((state) => {
        state.selectedScenarios = []
        state.highlightedScenario = null
        state.pinnedScenarioId = null
        state.selectedTier = null
      }),

    resetAll: () =>
      set((state) => {
        Object.assign(state, initialState)
      }),
  })),
)
