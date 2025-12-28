// Types for Scenario Explorer visualization and chart data

import type { ChartDataPoint } from "../scenarios/components/shared/types"

export interface OutcomeInfo {
  shortCode: string
  name: string
  displayName: string
}

export interface TierData {
  allChartData: Record<string, Record<string, ChartDataPoint[]>>
  outcomeNames: OutcomeInfo[]
  isLoading: boolean
  error: string | null
}
