/**
 * StrategyGrid type definitions
 */

export interface ChartDataPoint {
  label: string
  color: string
  value: number
  tierType?: string
}

export interface OutcomeName {
  shortCode: string
  name: string
  displayName: string
}

export interface Strategy {
  value: string
  label: string
  description: string
  theme?: string
}

export interface StrategyGridProps {
  // Data props
  getChartDataForStrategy: (
    strategyValue: string,
  ) => Record<string, ChartDataPoint[]>
  outcomeNames: OutcomeName[]
  strategies?: Strategy[] // Optional filtered strategies list
  highlightedStrategies?: Set<string> // Strategy values to highlight (search matches)
  showSearchDivider?: boolean // Whether to show a divider between search results and other strategies

  // Event handlers
  onOutcomeSelect: (strategyValue: string, outcome: string) => void
  onTierClick?: (strategy: string, outcome: string) => void
  onToggleScenario: (strategyValue: string) => void

  // State props (fully controlled)
  selectedScenarios: string[]
  selectedOutcomes: Record<string, string | null> // strategy -> outcome mapping (null = no outcome selected)
  showMapView: boolean
  showOnlyChosen: boolean
  showDefinitions: boolean

  // Layout props
  compact?: boolean // When true, shows labels below charts instead of column headers (for 50% width views)
  renderMode?: "all" | "headersOnly" | "contentOnly" // Controls what parts to render (for split header/content layouts)

  // UI control handlers
  onMapViewChange: (enabled: boolean) => void
  onShowOnlyChosenChange: (enabled: boolean) => void
  onShowDefinitionsChange: (enabled: boolean) => void

  // Sorting props (optional - only used in list view)
  sortBy?: string | null // Outcome display name to sort by
  sortDirection?: "asc" | "desc" // Sort direction
  onSortChange?: (outcome: string | null, direction: "asc" | "desc") => void
}

/**
 * Helper function to detect if tier data represents a single value
 * Uses the tierType metadata from the API
 */
export function isSingleValueTier(chartData: ChartDataPoint[] | undefined): boolean {
  if (!chartData || chartData.length === 0) return false
  // Check the tierType metadata from the first data point (all points in a tier have the same type)
  return chartData[0]?.tierType === "single_value"
}
