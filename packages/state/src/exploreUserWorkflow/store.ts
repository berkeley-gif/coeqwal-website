import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { ExploreState, ExploreUserWorkflowActions } from "./types"

// Combined store interface: state + actions
export interface ExploreUserWorkflowStoreState
  extends ExploreUserWorkflowActions {
  // Visitor's preferences, selections, and search state within explore tab
  explore: ExploreState
}

// Initial state: visitor starts with default preferences and no selections
const initialExploreState: ExploreState = {
  // Visitor view preferences / defaults
  showMapView: false,
  showOnlyChosen: false,
  showDefinitions: true,

  // Visitor selections: start empty
  chosenStrategies: [],
  selectedOutcomes: {},

  // Visitor location search: start inactive
  searchQuery: "",
  isSearching: false,
}

export const useExploreUserWorkflowStore =
  create<ExploreUserWorkflowStoreState>()(
    immer<ExploreUserWorkflowStoreState>((set) => ({
      // Initial state: visitor starts with default preferences
      explore: initialExploreState,

      // Visitor view preference actions: how does the visitor want to see data?
      setMapView: (show) =>
        set((state) => void (state.explore.showMapView = show)),
      setShowOnlyChosen: (show) =>
        set((state) => void (state.explore.showOnlyChosen = show)),
      setShowDefinitions: (show) =>
        set((state) => void (state.explore.showDefinitions = show)),

      // Visitor selection actions: what has the visitor chosen?
      toggleStrategyChoice: (strategyValue) =>
        set((state) => {
          const index = state.explore.chosenStrategies.indexOf(strategyValue)
          if (index > -1) {
            // Visitor is deselecting this strategy
            state.explore.chosenStrategies.splice(index, 1)
          } else {
            // Visitor is selecting this strategy
            state.explore.chosenStrategies.push(strategyValue)
          }
        }),

      setSelectedOutcome: (strategy, outcome) =>
        set((state) => {
          state.explore.selectedOutcomes[strategy] = outcome
        }),

      // Visitor location search actions: let visitor search for places on the map
      setSearchQuery: (query) =>
        set((state) => {
          state.explore.searchQuery = query
          state.explore.isSearching = query.length > 0
        }),

      // Reset actions: clear selections
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
          state.explore = { ...initialExploreState, chosenStrategies: [] }
        }),
    })),
  )
