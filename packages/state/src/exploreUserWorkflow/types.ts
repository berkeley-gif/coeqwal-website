// Visitor's state within the Explore tab: preferences, selections, and search behavior
export interface ExploreState {
  // Visitor view preferences: how does the visitor want to see data?
  showMapView: boolean
  showOnlyChosen: boolean
  showDefinitions: boolean

  // Visitor strategy selections: what has the visitor chosen to explore?
  chosenStrategies: string[]
  selectedOutcomes: Record<string, string | null>

  // Visitor location search: what place is the visitor looking for on the map?
  searchQuery: string
  isSearching: boolean
}

// Actions the visitor can take in the Explore tab
export interface ExploreUserWorkflowActions {
  // Reset actions
  reset: () => void
  resetExplore: () => void

  // Visitor view preferences: how does the visitor want to see data?
  setMapView: (show: boolean) => void
  setShowOnlyChosen: (show: boolean) => void
  setShowDefinitions: (show: boolean) => void

  // Visitor selections: what has the visitor chosen?
  toggleStrategyChoice: (strategyValue: string) => void
  setSelectedOutcome: (strategy: string, outcome: string | null) => void

  // Visitor location search: let visitor search for places on the map
  setSearchQuery: (query: string) => void
}

export interface ExploreUserWorkflowState {
  explore: ExploreState
}
