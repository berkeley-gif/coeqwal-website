/**
 * StrategyGrid type definitions
 */

import type {
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "../../scenarios/components/shared"
import type { OutcomeScoreData } from "../../scenarios/hooks"

export interface StrategyGridProps {
  // Data
  getChartDataForScenario: (
    scenarioId: string,
  ) => Record<string, ChartDataPoint[]>
  /** Optional: Score data for all scenarios (for accessibility tooltip display) */
  allScoreData?: Record<string, Record<string, OutcomeScoreData>>
  outcomeNames: OutcomeName[]
  /** Scenarios to display (from useScenarioList().scenarios) */
  scenarios: ScenarioForDisplay[]
  highlightedScenarios?: Set<string>
  showSearchDivider?: boolean
  themeMatchingScenarioIds?: Set<string>
  showThemeDivider?: boolean
  /** When true, shows a divider between every pair of adjacent scenarios that belong to different themes */
  showAllThemeDividers?: boolean

  // Events
  onOutcomeSelect: (scenarioId: string, outcome: string) => void
  onTierClick?: (scenarioId: string, outcomeCode: string) => void
  onToggleScenario: (scenarioId: string) => void

  // State (fully controlled)
  selectedScenarios: string[]
  selectedOutcomes: Record<string, string | null>
  showMapView: boolean
  showOnlyChosen: boolean
  showDefinitions: boolean
  onShowOnlyChosenChange?: (value: boolean) => void
  onShowDefinitionsChange?: (value: boolean) => void

  // Layout
  compact?: boolean
  renderMode?: "all" | "headersOnly" | "contentOnly"

  // Sorting (optional)
  sortBy?: string | null
  sortDirection?: "asc" | "desc"
  onSortChange?: (outcomeCode: string | null, direction: "asc" | "desc") => void
}
