/**
 * Scenario Explorer store - state management for multi-view scenario exploration
 *
 * This store manages state that is shared across multiple components in the
 * Scenario Explorer feature. Local UI state (like modal open/close, hover states)
 * should remain in individual components.
 */

import { create, immer } from "@repo/state/zustand"
import type { ScenarioTheme } from "../../content/scenarios"

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
export type ExploreMode =
  | "list"
  | "map"
  | "comparison"
  | "equity"
  | "resilience"

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

  // Theme filtering
  selectedTheme: ScenarioTheme | null
  showOnlyTheme: boolean
  showThemeBadges: boolean

  // Icon filtering
  selectedIconId: string | null

  // Display options
  showAlternativeBaselines: boolean

  // Chart toggles (comparison panel)
  relativeToBaseline: boolean
  highlightBaseline: boolean
  overlayTiers: boolean
  defineOutcome: boolean

  // Hydroclimate period selection (shared across all views)
  hydroclimatePeriod: string

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

  // Theme filtering
  setSelectedTheme: (theme: ScenarioTheme | null) => void
  setShowOnlyTheme: (show: boolean) => void
  setShowThemeBadges: (show: boolean) => void

  // Icon filtering
  setSelectedIconId: (iconId: string | null) => void

  // Display options
  setShowAlternativeBaselines: (show: boolean) => void

  // Chart toggles
  setRelativeToBaseline: (show: boolean) => void
  setHighlightBaseline: (show: boolean) => void
  setOverlayTiers: (show: boolean) => void
  setDefineOutcome: (show: boolean) => void

  // Hydroclimate period
  setHydroclimatePeriod: (period: string) => void

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
  selectedTheme: null,
  showOnlyTheme: false,
  showThemeBadges: false,
  selectedIconId: null,
  showAlternativeBaselines: false,
  relativeToBaseline: true,
  highlightBaseline: false,
  overlayTiers: false,
  defineOutcome: false,
  hydroclimatePeriod: "historical",
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

    // Theme filtering
    setSelectedTheme: (theme) =>
      set((state) => {
        state.selectedTheme = theme
        if (theme === null) {
          state.showOnlyTheme = false
        }
      }),

    setShowOnlyTheme: (show) =>
      set((state) => {
        state.showOnlyTheme = show
      }),

    setShowThemeBadges: (show) =>
      set((state) => {
        state.showThemeBadges = show
      }),

    // Icon filtering
    setSelectedIconId: (iconId) =>
      set((state) => {
        state.selectedIconId = iconId
      }),

    // Display options
    setShowAlternativeBaselines: (show) =>
      set((state) => {
        state.showAlternativeBaselines = show
      }),

    // Chart toggles
    setRelativeToBaseline: (show) =>
      set((state) => {
        state.relativeToBaseline = show
      }),

    setHighlightBaseline: (show) =>
      set((state) => {
        state.highlightBaseline = show
      }),

    setOverlayTiers: (show) =>
      set((state) => {
        state.overlayTiers = show
      }),

    setDefineOutcome: (show) =>
      set((state) => {
        state.defineOutcome = show
      }),

    // Hydroclimate period
    setHydroclimatePeriod: (period) =>
      set((state) => {
        state.hydroclimatePeriod = period
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
        state.selectedTheme = null
        state.showOnlyTheme = false
        state.selectedIconId = null
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
