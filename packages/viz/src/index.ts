// Export types
export type {
  ChartConfig,
  DecileData,
  DecileBarChartProps,
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
export type { AxisLayout } from "./components/VerticalParallelLinePlot.peak"
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

export { default as PackedDots } from "./components/PackedDots"
export type { PackedDotsProps, DotDatum } from "./components/PackedDots"

export { default as ParityPlot } from "./components/ParityPlot"
export type { ParityPlotProps } from "./components/ParityPlot"
export { default as DeviationPlot } from "./components/DeviationPlot"
export type { DeviationPlotProps } from "./components/DeviationPlot"
export { default as DotStripPlot } from "./components/DotStripPlot"
export type { DotStripPlotProps } from "./components/DotStripPlot"
export { default as DivergingLollipop } from "./components/DivergingLollipop"
export type { DivergingLollipopProps } from "./components/DivergingLollipop"
export { default as DumbbellChart } from "./components/DumbbellChart"
export type { DumbbellChartProps } from "./components/DumbbellChart"
export { default as PairedParallelPlot } from "./components/PairedParallelPlot"
export type { PairedParallelPlotProps } from "./components/PairedParallelPlot"
export { default as ArrowFieldPlot } from "./components/ArrowFieldPlot"
export type { ArrowFieldPlotProps } from "./components/ArrowFieldPlot"

export { default as TierHeatmap } from "./components/TierHeatmap"
export type {
  TierHeatmapProps,
  TierHeatmapCell,
} from "./components/TierHeatmap"
export { default as TierSankey } from "./components/TierSankey"
export type {
  TierSankeyProps,
  SankeyScenarioFlow,
  TierSankeyGroup,
} from "./components/TierSankey"

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

export { THEME_LINE_PALETTES, getThemeLineColor } from "./utils/themeLineColors"
export type { ThemeKey } from "./utils/themeLineColors"

export {
  POINTS_PER_SHAPE,
  SQUARE_SIZE,
  SQUARE_GAP,
  resampleClosedPath,
  rectPoints,
  diamondPoints,
  circlePoints,
  lineSegmentPoints,
  pointsToD,
  easeInOut,
  lerp,
} from "./utils/shape-morph"
export type { ShapeMorphData } from "./utils/shape-morph"
