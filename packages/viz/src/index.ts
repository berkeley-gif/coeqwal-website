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
export { default as DecileBarChart } from "./components/DecileBarChart"
export { default as LineChart } from "./components/LineChart"
export type { LineChartData, MonthlyData } from "./components/LineChart"
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
export { default as ScenarioGlyph } from "./components/ScenarioGlyph"
export type {
  ScenarioGlyphProps,
  GlyphVariant,
} from "./components/ScenarioGlyph"
export { default as MorphableDistributionGlyph } from "./components/MorphableDistributionGlyph"
export type { MorphableDistributionGlyphProps } from "./components/MorphableDistributionGlyph"
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

export { default as RadarPlot } from "./components/RadarPlot"
export type { RadarPlotProps, RadarPlotPalette } from "./components/RadarPlot"
export { default as RadarPlotSnapshot } from "./components/RadarPlotSnapshot"
export type { RadarPlotSnapshotProps } from "./components/RadarPlotSnapshot"
export type {
  RadarPlotAxisLabelDetailStyle,
  RadarAxisDetailBottomMode,
  RadarAxisLabelDetailPayload,
  RadarAxisLabelDetailChromeMountPayload,
  RadarAxisLabelDetailChromeOptions,
  RadarAxisLabelDetailPointerBridge,
} from "./components/radarAxisLabelDetail"
export {
  mergeRadarAxisLabelDetailStyle,
  DEFAULT_RADAR_AXIS_LABEL_DETAIL_STYLE,
  radarAxisDetailBottomModeForIndex,
  RADAR_TIER_LABELS,
} from "./components/radarAxisLabelDetail"

export { default as TierHeatmap } from "./components/TierHeatmap"
export type {
  TierHeatmapProps,
  TierHeatmapCell,
} from "./components/TierHeatmap"
export { default as ResilienceHeatmap } from "./components/ResilienceHeatmap"
export type {
  ResilienceHeatmapProps,
  ResilienceHeatmapCell,
  ResilienceAxisItem,
  ResilienceHeatmapPalette,
  ResilienceHeatmapMarginals,
  ResilienceCellRender,
  ResilienceGlyphEntry,
  ResilienceColumnGroup,
} from "./components/ResilienceHeatmap"
export { default as ResilienceHeatmapSnapshot } from "./components/ResilienceHeatmapSnapshot"
export type { ResilienceHeatmapSnapshotProps } from "./components/ResilienceHeatmapSnapshot"
export { default as ResilienceHeatmapSmallMultiples } from "./components/ResilienceHeatmapSmallMultiples"
export {
  getResilienceSmallMultiplesTileHeight,
  RESILIENCE_SMALL_MULTIPLES_CAPTURE_COLUMNS,
} from "./components/ResilienceHeatmapSmallMultiples"
export type {
  ResilienceHeatmapSmallMultiplesProps,
  ResilienceSmallMultiplesTile,
  ResilienceSmallMultiplesTileAspect,
} from "./components/ResilienceHeatmapSmallMultiples"
export { default as TierSankey } from "./components/TierSankey"
export type {
  TierSankeyProps,
  SankeyScenarioFlow,
  TierSankeyGroup,
} from "./components/TierSankey"

export { default as TierGrid } from "./components/TierGrid"
export type { TierGridProps } from "./components/TierGrid"
export { default as TierGridSnapshot } from "./components/TierGridSnapshot"
export type { TierGridSnapshotProps } from "./components/TierGridSnapshot"

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

export { isFullOpacityDuringSidebarHighlight } from "./utils/sidebarHighlightPolicy"

export {
  TIER_COUNT,
  TIER_LEVELS,
  normalizedToRadar,
  radarValueToTier,
  clampTier,
} from "./utils/tierScale"

export {
  THEME_LINE_PALETTES,
  THEME_LINE_PALETTES_LIGHT_TO_DARK,
  getThemeLineColor,
} from "./utils/themeLineColors"
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

export { hierarchicalRowOrder } from "./utils/clustering"

// Curated re-exports from d3: consumers (e.g. storyline-flow) import these from @repo/viz
// so `d3` remains a dependency of this package only. Extend this list when something new is needed.
export {
  area,
  autoType,
  bisector,
  csv,
  curveBasis,
  curveCatmullRom,
  curveLinear,
  curveMonotoneX,
  csvParse,
  extent,
  format,
  interpolateRgb,
  line,
  max,
  mean,
  min,
  range,
  scaleBand,
  scaleLinear,
  scalePoint,
  scaleTime,
  select,
  ticks,
  timeFormat,
} from "d3"

export type { Area, ScaleLinear, ScalePoint, ScaleTime } from "d3"
