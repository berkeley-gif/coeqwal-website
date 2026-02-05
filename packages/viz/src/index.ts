// Export types
export type {
  ChartConfig,
  DecileData,
  DecileChartProps,
  TimeSeriesData,
  TimeSeriesChartProps,
  ScenarioComparisonData,
  ScenarioComparisonChartProps,
} from "./types"

// Export components
export { default as BarChart } from "./components/BarChart"
export type { BarChartProps } from "./components/BarChart"
export { default as DecileBarChart } from "./components/DecileBarChart"
export { default as LineChart } from "./components/LineChart"
export type { LineChartData, MonthlyData } from "./components/LineChart"
export { default as RoseChart } from "./components/RoseChart"
export type { RoseChartProps } from "./components/RoseChart"
export { default as StickChart } from "./components/StickChart"
export type { StickChartProps } from "./components/StickChart"
export { default as VerticalParallelLinePlot } from "./components/VerticalParallelLinePlot"
export type {
  VerticalParallelLineData,
  VerticalParallelLinePlotProps,
} from "./components/VerticalParallelLinePlot"
export { default as VerticalParallelLinePlotPeak } from "./components/VerticalParallelLinePlot.peak"
export { default as OutcomeGlyph } from "./components/OutcomeGlyph"
export type { OutcomeGlyphProps } from "./components/OutcomeGlyph"
export { default as OutcomeDotsGlyph } from "./components/OutcomeDotsGlyph"
export type { OutcomeDotsGlyphProps } from "./components/OutcomeDotsGlyph"
export { default as VerticalBarChart } from "./components/VerticalBarChart"
export type { VerticalBarChartProps } from "./components/VerticalBarChart"
export { default as TierCircles } from "./components/TierCircles"
export type { TierCirclesProps } from "./components/TierCircles"
export { default as VerticalOutcomeGlyph } from "./components/VerticalOutcomeGlyph"
export type { VerticalOutcomeGlyphProps } from "./components/VerticalOutcomeGlyph"
export { default as ScenarioGlyph } from "./components/ScenarioGlyph"
export type { ScenarioGlyphProps } from "./components/ScenarioGlyph"
export { default as PercentileBandChart } from "./components/PercentileBandChart"
export type {
  PercentileBandChartProps,
  PercentileValues,
  MonthlyPercentiles,
} from "./components/PercentileBandChart"
export { default as PercentileMatrix } from "./components/PercentileMatrix"
export { default as SpillChart } from "./components/SpillChart"
export type {
  SpillChartProps,
  SpillMonthlyStats,
  MonthlySpillData,
} from "./components/SpillChart"
export { default as SpillMatrix } from "./components/SpillMatrix"
export type { SpillMatrixProps } from "./components/SpillMatrix"
export type {
  PercentileMatrixProps,
  ReservoirData,
  MatrixCell,
  MatrixDisplayMode,
  VolumeScaleMode,
  CellStats,
  CellStatsMap,
  BreakdownComponent,
  BreakdownDataMap,
  BreakdownComponentsMap,
} from "./components/PercentileMatrix"

// Export hooks
export { useResizeObserver } from "./hooks/useResizeObserver"

// Export utilities
export {
  parseDecileData,
  createDecileColorScale,
  createCategoricalColorScale,
  formatValue,
  calculateChartDimensions,
  getNestedValue,
} from "./utils/d3-utils"
