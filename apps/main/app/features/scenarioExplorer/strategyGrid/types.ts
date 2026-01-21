/**
 * StrategyGrid type definitions
 */

import type {
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "../../scenarios/components/shared"

export interface StrategyGridProps {
  // Data
  getChartDataForScenario: (
    scenarioId: string,
  ) => Record<string, ChartDataPoint[]>
  outcomeNames: OutcomeName[]
  /** Scenarios to display (from useScenarioList().scenarios) */
  scenarios: ScenarioForDisplay[]
  highlightedScenarios?: Set<string>
  showSearchDivider?: boolean

  // Events
  onOutcomeSelect: (scenarioId: string, outcome: string) => void
  onTierClick?: (scenarioId: string, outcome: string) => void
  onToggleScenario: (scenarioId: string) => void

  // State (fully controlled)
  selectedScenarios: string[]
  selectedOutcomes: Record<string, string | null>
  showMapView: boolean
  showOnlyChosen: boolean
  showDefinitions: boolean

  // Layout
  compact?: boolean
  renderMode?: "all" | "headersOnly" | "contentOnly"

  // Sorting (optional)
  sortBy?: string | null
  sortDirection?: "asc" | "desc"
  onSortChange?: (outcome: string | null, direction: "asc" | "desc") => void
}
