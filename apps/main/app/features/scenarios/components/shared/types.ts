/**
 * Shared types for scenario components
 *
 * Used by OutcomeGlyphItem, OutcomeGrid, OperationsIconGroup, etc.
 */

import type { ScenarioTheme } from "../../../../content/scenarios"

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

/**
 * Scenario data shape for UI components
 * Components use this minimal interface for flexibility
 */
export interface ScenarioForDisplay {
  scenarioId: string
  label: string
  description: string
  theme?: ScenarioTheme
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
