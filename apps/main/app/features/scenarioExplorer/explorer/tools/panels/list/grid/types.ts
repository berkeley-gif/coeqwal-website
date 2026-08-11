/**
 * StrategyGrid type definitions
 */

import type {
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "../../../../../../scenarios/components/shared"
import type { ScenarioTheme } from "../../../../../../../content/scenarios"

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
  themeMatchingScenarioIds?: Set<string>
  showThemeDivider?: boolean
  /** When true, shows a divider between every pair of adjacent scenarios that belong to different themes */
  showAllThemeDividers?: boolean
  iconMatchingScenarioIds?: Set<string>
  showIconDivider?: boolean

  // Events
  onToggleScenario: (scenarioId: string) => void

  // State (fully controlled)
  selectedScenarios: string[]
  showMapView: boolean
  showOnlyChosen: boolean
  showAlternativeBaselines: boolean
  onShowOnlyChosenChange?: (value: boolean) => void
  onShowAlternativeBaselinesChange?: (value: boolean) => void

  // Layout
  compact?: boolean
  outcomesOnly?: boolean
  renderMode?: "all" | "headersOnly" | "contentOnly"
  /** When false, hides the key operations column (col 3) from the grid */
  showOperations?: boolean
  /** When true, hides the column title row (Scenario library / Key operations / Key outcomes) */
  hideColumnTitles?: boolean
  /** When true, shows ThemeGroupHeader subheaders above each theme group instead of divider lines */
  groupByTheme?: boolean
  /**
   * When false, theme subheaders are hidden and per-row theme badges are shown, even if groupByTheme
   * is on (e.g. search or sort has interleaved themes). From useOrderedScenarios.
   */
  scenariosInContiguousThemeOrder?: boolean

  // Badge / icon click-to-select
  /** Select all scenarios sharing a theme when badge is clicked */
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  /** Select all scenarios sharing an operation icon when clicked */
  onIconClick?: (iconId: string) => void

  // Sidebar-parity features (Phase 1 unified list)
  /** Map of scenario ID to color for accent border / swatch */
  scenarioColors?: Record<string, string>
  /** Set of pinned scenario IDs */
  pinnedScenarioIds?: string[]
  /** Set of externally active (hovered/highlighted) scenario IDs */
  activeScenarioIds?: Set<string>
  /** Called on mouse enter/leave for hover sync with other panels */
  onRowHover?: (scenarioIds: string[] | null) => void
}
