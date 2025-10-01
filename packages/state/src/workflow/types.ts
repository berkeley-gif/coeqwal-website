export type WorkflowStep = "none" | "choose" | "compare" | "empower"

export interface ExploreState {
  showMapView: boolean
  showOnlyChosen: boolean
  showDefinitions: boolean
  chosenStrategies: string[]
  
  // Scenario explorer state
  selectedOutcomes: Record<string, string | null>
  searchQuery: string
  isSearching: boolean
}

export interface WorkflowState {
  currentStep: WorkflowStep
  explore: ExploreState
}
