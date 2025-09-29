export type WorkflowStep = "none" | "choose" | "compare" | "empower"

export interface ExploreState {
  showMapView: boolean
  showOnlyChosen: boolean
  showDefinitions: boolean
  chosenStrategies: string[]
}

export interface WorkflowState {
  currentStep: WorkflowStep
  explore: ExploreState
}
