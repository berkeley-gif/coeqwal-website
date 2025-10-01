import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { WorkflowStep, ExploreState } from "./types"

export interface WorkflowStoreState {
  currentStep: WorkflowStep // steps are 1. choose, 2. compare, 3. empower
  explore: ExploreState // user settings
  
  // Workflow actions
  setStep: (step: WorkflowStep) => void
  setMapView: (show: boolean) => void
  setShowOnlyChosen: (show: boolean) => void
  setShowDefinitions: (show: boolean) => void
  toggleStrategyChoice: (strategyValue: string) => void
  resetExplore: () => void
  reset: () => void
  
  // Scenario explorer actions
  setSelectedOutcome: (strategy: string, outcome: string | null) => void
  setSearchQuery: (query: string) => void
}

const initialExploreState: ExploreState = {
  // Existing workflow state
  showMapView: false,
  showOnlyChosen: false,
  showDefinitions: true,
  chosenStrategies: [],
  
  // Scenario explorer state
  selectedOutcomes: {},
  searchQuery: "",
  isSearching: false,
}

export const useWorkflowStore = create<WorkflowStoreState>()(
  immer<WorkflowStoreState>((set) => ({
    currentStep: "none",
    explore: initialExploreState,

    // Workflow actions
    setStep: (step) => set((state) => void (state.currentStep = step)),

    // Explore actions
    setMapView: (show) =>
      set((state) => void (state.explore.showMapView = show)),
    setShowOnlyChosen: (show) =>
      set((state) => void (state.explore.showOnlyChosen = show)),
    setShowDefinitions: (show) =>
      set((state) => void (state.explore.showDefinitions = show)),
    toggleStrategyChoice: (strategyValue) =>
      set((state) => {
        const index = state.explore.chosenStrategies.indexOf(strategyValue)
        if (index > -1) {
          state.explore.chosenStrategies.splice(index, 1)
        } else {
          state.explore.chosenStrategies.push(strategyValue)
        }
      }),

    // Scenario explorer actions
    setSelectedOutcome: (strategy, outcome) =>
      set((state) => {
        state.explore.selectedOutcomes[strategy] = outcome
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.explore.searchQuery = query
        state.explore.isSearching = query.length > 0
      }),

    // Reset actions
    resetExplore: () =>
      set(
        (state) =>
          void (state.explore = {
            ...initialExploreState,
            chosenStrategies: [],
          }),
      ),
    reset: () =>
      set((state) => {
        state.currentStep = "none"
        state.explore = { ...initialExploreState, chosenStrategies: [] }
      }),
  })),
)
