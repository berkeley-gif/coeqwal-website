// State management for the Scenario Explorer multi-view interface

/**
 * Available views in the Scenario Explorer
 */
export type ExplorerView = "list" | "map" | "comparison" | "needs" | "data"

/**
 * Hydroclimate scenario options
 * - historical: DWR input time series with last thirty years based on historical climate patterns from observational record
 * - warmer-wetter
 * - warmer-drier-i
 * - warmer-drier-ii
 * - warmer-drier-iii
 * - warmer-drier-iv
 */
export type HydroclimateScenario =
  | "historical"
  | "warmer-wetter"
  | "warmer-drier-i"
  | "warmer-drier-ii"
  | "warmer-drier-iii"
  | "warmer-drier-iv"

/**
 * Sort options for scenarios
 * Can be extended per-view with additional criteria
 */
export type SortOption =
  // Alphabetical
  | "name-asc"
  | "name-desc"
  // By outcome performance
  | "outcome-best-first" // Best performing scenarios first
  | "outcome-worst-first" // Worst performing scenarios first
  // By specific outcome (when one is selected)
  | "eflow-best"
  | "exports-best"
  | "x2-best"
  | "storage-best"
  | "shortage-best"
  | "delta-ecology-best"
  | "deliveries-best"

/**
 * Criteria for needs-based scenario search
 * Allows users to specify outcome requirements
 * Yuya, please add details here
 */
export interface OutcomeCriteria {
  outcome: string
  min: number | null
  max: number | null
  weight?: number // Optional weighting for ranking
}

/**
 * Main state for Scenario Explorer
 */
export interface ScenarioExplorerState {
  // View state
  activeView: ExplorerView

  // Selection state (persists across views)
  selectedScenarios: string[]
  selectedOutcomes: string[]

  // Filter state
  searchQuery: string
  sortBy: SortOption
  hydroclimateScenario: HydroclimateScenario

  // UI preferences (from old exploreUserWorkflow)
  showOnlyChosen: boolean
  showDefinitions: boolean

  // Needs-based search criteria
  outcomeCriteria: OutcomeCriteria[]

  // Map view state
  selectedTier: { strategy: string; outcome: string } | null
}

/**
 * Actions for Scenario Explorer
 */
export interface ScenarioExplorerActions {
  // View actions
  setActiveView: (view: ExplorerView) => void

  // Selection actions
  toggleScenario: (scenarioId: string) => void
  selectScenarios: (scenarioIds: string[]) => void
  clearScenarios: () => void
  toggleOutcome: (outcome: string) => void
  selectOutcomes: (outcomes: string[]) => void
  clearOutcomes: () => void

  // Filter actions
  setSearchQuery: (query: string) => void
  setSortBy: (sort: SortOption) => void
  setHydroclimateScenario: (scenario: HydroclimateScenario) => void

  // UI preference actions
  setShowOnlyChosen: (show: boolean) => void
  setShowDefinitions: (show: boolean) => void

  // Needs-based search actions
  addOutcomeCriteria: (criteria: OutcomeCriteria) => void
  updateOutcomeCriteria: (index: number, criteria: OutcomeCriteria) => void
  removeOutcomeCriteria: (index: number) => void
  clearOutcomeCriteria: () => void

  // Map view actions
  setSelectedTier: (tier: { strategy: string; outcome: string } | null) => void

  // Reset actions
  resetFilters: () => void
  resetSelections: () => void
  resetAll: () => void
}

/**
 * Combined store interface
 */
export interface ScenarioExplorerStore
  extends ScenarioExplorerState,
    ScenarioExplorerActions {}
