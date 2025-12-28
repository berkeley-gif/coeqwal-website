/**
 * Scenario Explorer store - state management for multi-view scenario exploration
 */

import { create, immer } from "@repo/state/zustand"

// ============================================================================
// Types
// ============================================================================

export type ExplorerView = "list" | "map" | "comparison" | "needs" | "data"

export type HydroclimateScenario =
  | "historical"
  | "warmer-wetter"
  | "warmer-drier-i"
  | "warmer-drier-ii"
  | "warmer-drier-iii"
  | "warmer-drier-iv"

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "outcome-best-first"
  | "outcome-worst-first"
  | "eflow-best"
  | "exports-best"
  | "x2-best"
  | "storage-best"
  | "shortage-best"
  | "delta-ecology-best"
  | "deliveries-best"

export interface OutcomeCriteria {
  outcome: string
  min: number | null
  max: number | null
  weight?: number
}

interface ScenarioExplorerState {
  activeView: ExplorerView
  selectedScenarios: string[]
  selectedOutcomes: string[]
  searchQuery: string
  sortBy: SortOption
  hydroclimateScenario: HydroclimateScenario
  showOnlyChosen: boolean
  showDefinitions: boolean
  outcomeCriteria: OutcomeCriteria[]
  selectedTier: { strategy: string; outcome: string } | null
}

interface ScenarioExplorerActions {
  setActiveView: (view: ExplorerView) => void
  toggleScenario: (scenarioId: string) => void
  selectScenarios: (scenarioIds: string[]) => void
  clearScenarios: () => void
  toggleOutcome: (outcome: string) => void
  selectOutcomes: (outcomes: string[]) => void
  clearOutcomes: () => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: SortOption) => void
  setHydroclimateScenario: (scenario: HydroclimateScenario) => void
  setShowOnlyChosen: (show: boolean) => void
  setShowDefinitions: (show: boolean) => void
  addOutcomeCriteria: (criteria: OutcomeCriteria) => void
  updateOutcomeCriteria: (index: number, criteria: OutcomeCriteria) => void
  removeOutcomeCriteria: (index: number) => void
  clearOutcomeCriteria: () => void
  setSelectedTier: (tier: { strategy: string; outcome: string } | null) => void
  resetFilters: () => void
  resetSelections: () => void
  resetAll: () => void
}

type ScenarioExplorerStore = ScenarioExplorerState & ScenarioExplorerActions

// ============================================================================
// Store
// ============================================================================

const initialState: ScenarioExplorerState = {
  activeView: "list",
  selectedScenarios: [],
  selectedOutcomes: [],
  searchQuery: "",
  sortBy: "name-asc",
  hydroclimateScenario: "historical",
  showOnlyChosen: false,
  showDefinitions: true,
  outcomeCriteria: [],
  selectedTier: null,
}

export const useScenarioExplorerStore = create<ScenarioExplorerStore>()(
  immer<ScenarioExplorerStore>((set) => ({
    ...initialState,

    setActiveView: (view) =>
      set((state) => {
        state.activeView = view
      }),

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

    toggleOutcome: (outcome) =>
      set((state) => {
        const index = state.selectedOutcomes.indexOf(outcome)
        if (index > -1) {
          state.selectedOutcomes.splice(index, 1)
        } else {
          state.selectedOutcomes.push(outcome)
        }
      }),

    selectOutcomes: (outcomes) =>
      set((state) => {
        state.selectedOutcomes = outcomes
      }),
    clearOutcomes: () =>
      set((state) => {
        state.selectedOutcomes = []
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query
      }),
    setSortBy: (sort) =>
      set((state) => {
        state.sortBy = sort
      }),
    setHydroclimateScenario: (scenario) =>
      set((state) => {
        state.hydroclimateScenario = scenario
      }),
    setShowOnlyChosen: (show) =>
      set((state) => {
        state.showOnlyChosen = show
      }),
    setShowDefinitions: (show) =>
      set((state) => {
        state.showDefinitions = show
      }),

    addOutcomeCriteria: (criteria) =>
      set((state) => {
        state.outcomeCriteria.push(criteria)
      }),
    updateOutcomeCriteria: (index, criteria) =>
      set((state) => {
        if (index >= 0 && index < state.outcomeCriteria.length) {
          state.outcomeCriteria[index] = criteria
        }
      }),
    removeOutcomeCriteria: (index) =>
      set((state) => {
        if (index >= 0 && index < state.outcomeCriteria.length) {
          state.outcomeCriteria.splice(index, 1)
        }
      }),
    clearOutcomeCriteria: () =>
      set((state) => {
        state.outcomeCriteria = []
      }),

    setSelectedTier: (tier) =>
      set((state) => {
        state.selectedTier = tier
      }),

    resetFilters: () =>
      set((state) => {
        state.searchQuery = ""
        state.sortBy = "name-asc"
      }),

    resetSelections: () =>
      set((state) => {
        state.selectedScenarios = []
        state.selectedOutcomes = []
        state.selectedTier = null
      }),

    resetAll: () =>
      set((state) => {
        Object.assign(state, initialState)
      }),
  })),
)
