/**
 * Common types for COEQWAL visualizations
 */

// Basic chart configuration shared by all chart types
export interface ChartConfig {
  width?: number
  height?: number
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  title?: string
  xAxisLabel?: string
  yAxisLabel?: string
  responsive?: boolean
  colors?: string[]
  theme?: "light" | "dark"
}

// Types for decile chart data
export interface DecileData {
  decile: number
  value: number
}

export interface DecileChartProps extends ChartConfig {
  data: DecileData[] | Record<string, number | string>
  colorScheme?: "blues" | "greens" | "purples" | "oranges" | "reds"
  showValues?: boolean
  showLegend?: boolean
  compact?: boolean // when true, hide axes/legend/title for glyph use
  showTickLabels?: boolean // show/hide tick labels on axes
  axisColor?: string // color for axes and ticks
  barWidthPixels?: number // Width of the bar in pixels
}

// Types for time series data
export interface TimeSeriesData {
  date: Date | string
  value: number
}

export interface TimeSeriesChartProps extends ChartConfig {
  data: TimeSeriesData[]
  lineColor?: string
  areaColor?: string
  showPoints?: boolean
}

export interface ScenarioComparisonData {
  scenario: string
  value: number
}

export interface ScenarioComparisonChartProps extends ChartConfig {
  data: ScenarioComparisonData[]
  barColor?: string
  sortByValue?: boolean
  horizontal?: boolean
}
