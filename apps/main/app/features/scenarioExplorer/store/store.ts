import { create, immer } from "@repo/state/zustand"
import type {
  ScenarioExplorerState,
  ScenarioExplorerStore,
  ExplorerView,
  SortOption,
  HydroclimateScenario,
  OutcomeCriteria,
} from "./types"

/**
 * Initial state for Scenario Explorer
 * Visitor starts with list view and no selections
 */
const initialState: ScenarioExplorerState = {
  // View state
  activeView: "list",

  // Selection state
  selectedScenarios: [],
  selectedOutcomes: [],

  // Filter state
  searchQuery: "",
  sortBy: "name-asc",
  hydroclimateScenario: "historical",

  // UI preferences
  showOnlyChosen: false,
  showDefinitions: true,

  // Needs-based search
  outcomeCriteria: [],

  // Map view state
  selectedTier: null,
}

/**
 * Scenario Explorer store
 * Manages state for multi-view scenario exploration interface
 */
export const useScenarioExplorerStore = create<ScenarioExplorerStore>()(
  immer<ScenarioExplorerStore>((set) => ({
    ...initialState,

    // View actions
    setActiveView: (view: ExplorerView) =>
      set((state) => {
        state.activeView = view
      }),

    // Selection actions
    toggleScenario: (scenarioId: string) =>
      set((state) => {
        const index = state.selectedScenarios.indexOf(scenarioId)
        if (index > -1) {
          state.selectedScenarios.splice(index, 1)
        } else {
          state.selectedScenarios.push(scenarioId)
        }
      }),

    selectScenarios: (scenarioIds: string[]) =>
      set((state) => {
        state.selectedScenarios = scenarioIds
      }),

    clearScenarios: () =>
      set((state) => {
        state.selectedScenarios = []
      }),

    toggleOutcome: (outcome: string) =>
      set((state) => {
        const index = state.selectedOutcomes.indexOf(outcome)
        if (index > -1) {
          state.selectedOutcomes.splice(index, 1)
        } else {
          state.selectedOutcomes.push(outcome)
        }
      }),

    selectOutcomes: (outcomes: string[]) =>
      set((state) => {
        state.selectedOutcomes = outcomes
      }),

    clearOutcomes: () =>
      set((state) => {
        state.selectedOutcomes = []
      }),

    // Filter actions
    setSearchQuery: (query: string) =>
      set((state) => {
        state.searchQuery = query
      }),

    setSortBy: (sort: SortOption) =>
      set((state) => {
        state.sortBy = sort
      }),

    setHydroclimateScenario: (scenario: HydroclimateScenario) =>
      set((state) => {
        state.hydroclimateScenario = scenario
      }),

    // UI preference actions
    setShowOnlyChosen: (show: boolean) =>
      set((state) => {
        state.showOnlyChosen = show
      }),

    setShowDefinitions: (show: boolean) =>
      set((state) => {
        state.showDefinitions = show
      }),

    // Needs-based search actions
    addOutcomeCriteria: (criteria: OutcomeCriteria) =>
      set((state) => {
        state.outcomeCriteria.push(criteria)
      }),

    updateOutcomeCriteria: (index: number, criteria: OutcomeCriteria) =>
      set((state) => {
        if (index >= 0 && index < state.outcomeCriteria.length) {
          state.outcomeCriteria[index] = criteria
        }
      }),

    removeOutcomeCriteria: (index: number) =>
      set((state) => {
        if (index >= 0 && index < state.outcomeCriteria.length) {
          state.outcomeCriteria.splice(index, 1)
        }
      }),

    clearOutcomeCriteria: () =>
      set((state) => {
        state.outcomeCriteria = []
      }),

    // Map view actions
    setSelectedTier: (tier: { strategy: string; outcome: string } | null) =>
      set((state) => {
        state.selectedTier = tier
      }),

    // Reset actions
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
