import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { WorkflowStep, ExploreState } from "./types"

export interface WorkflowStoreState {
  currentStep: WorkflowStep
  explore: ExploreState
  // actions
  setStep: (step: WorkflowStep) => void
  setMapView: (show: boolean) => void
  setShowOnlyChosen: (show: boolean) => void
  setShowDefinitions: (show: boolean) => void
  toggleStrategyChoice: (strategyValue: string) => void
  resetExplore: () => void
  reset: () => void
}

const initialExploreState: ExploreState = {
  showMapView: false,
  showOnlyChosen: false,
  showDefinitions: true,
  chosenStrategies: [],
}

export const useWorkflowStore = create<WorkflowStoreState>()(
  immer<WorkflowStoreState>((set) => ({
    currentStep: "none",
    explore: initialExploreState,
    
    // Workflow actions
    setStep: (step) => set((state) => void (state.currentStep = step)),
    
    // Explore actions
    setMapView: (show) => set((state) => void (state.explore.showMapView = show)),
    setShowOnlyChosen: (show) => set((state) => void (state.explore.showOnlyChosen = show)),
    setShowDefinitions: (show) => set((state) => void (state.explore.showDefinitions = show)),
    toggleStrategyChoice: (strategyValue) => set((state) => {
      const index = state.explore.chosenStrategies.indexOf(strategyValue)
      if (index > -1) {
        state.explore.chosenStrategies.splice(index, 1)
      } else {
        state.explore.chosenStrategies.push(strategyValue)
      }
    }),
    
    // Reset actions
    resetExplore: () => set((state) => void (state.explore = { ...initialExploreState, chosenStrategies: [] })),
    reset: () => set((state) => {
      state.currentStep = "none"
      state.explore = { ...initialExploreState, chosenStrategies: [] }
    }),
  }))
)
