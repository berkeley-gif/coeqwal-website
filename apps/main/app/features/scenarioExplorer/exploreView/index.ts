/**
 * exploreView - barrel exports for explore view sub-feature
 *
 * Active tools:
 * - ListView: Scenario grid tool (StrategyGrid with tier outcome glyphs)
 * - RadarPanel: Radar chart wrapping @repo/viz RadarPlot
 * - EquityPanel: Distribution comparison (chart content by Yuya, a Ph.D. student/developer at the Davis Viz Lab)
 *
 * Preserved (not currently in toolbar, available for future use):
 * - ComparisonPanel: Tradeoffs tool with parallel coords / parity / deviation charts
 * - ResiliencePanel: Resilience analysis tool
 */

export { default as ListView } from "./ListView"
export { default as RadarPanel } from "./RadarPanel"
export type {
  SingleScenarioCaptureFn,
  MultiScenarioCaptureFn,
} from "./RadarPanel"
export { default as EquityPanel } from "./EquityPanel"
export { default as ComparisonPanel } from "./ComparisonPanel"
export { default as ResiliencePanel } from "./ResiliencePanel"
export { default as ResilienceQuadrantPanel } from "./ResilienceQuadrantPanel"
export type {
  ResilienceControlsState,
  ResilienceView,
  CellEncoding,
  DeltaMode,
  AggregateScope,
  QuadrantUnit,
  ResilienceChartDataRow,
  ResilienceHeatmapChartData,
  ResilienceCaptureResult,
  ResilienceCaptureFn,
  ResilienceTileCaptureFn,
  ResilienceScenarioSoloCaptureFn,
} from "./ResiliencePanel"
export type {
  ResilienceQuadrantChartData,
  ResilienceQuadrantCaptureResult,
  ResilienceQuadrantCaptureFn,
} from "./ResilienceQuadrantPanel"
