/**
 * Shared types for scenario/strategy components
 *
 * Used by OutcomeGlyphItem, OutcomeGrid, OperationsIconGroup, etc.
 */

export interface ChartDataPoint {
  label: string
  color: string
  value: number
  tierType?: "single_value" | "multi_value"
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

/**
 * Helper function to detect if tier data represents a single value
 * Uses the tierType metadata from the API
 */
export function isSingleValueTier(
  chartData: ChartDataPoint[] | undefined,
): boolean {
  if (!chartData || chartData.length === 0) return false
  return chartData[0]?.tierType === "single_value"
}




