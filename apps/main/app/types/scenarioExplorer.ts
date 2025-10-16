// Types for Scenario Explorer visualization and chart data

export interface ChartDataPoint {
  label: string
  color: string
  value: number
}

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
