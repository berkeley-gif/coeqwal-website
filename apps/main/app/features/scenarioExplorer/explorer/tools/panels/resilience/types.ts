/**
 * Shared result/data types for the resilience panel capture + share path.
 *
 * Extracted from `ResiliencePanel.tsx` so the share/capture layer can
 * reference these shapes without importing the panel component module
 * (which previously created a type-only import cycle between
 * `ResiliencePanel` and `share/capture/types`).
 */

import type { ResilienceView, CellEncoding } from "../../../store"

/**
 * Flat, CSV-friendly row shape for a single captured heatmap cell.
 * Mirrors the fields we can reasonably derive from `ResilienceHeatmapCell`
 * without reaching back into the source matrix.
 */
export interface ResilienceChartDataRow {
  rowKey: string
  rowLabel: string
  colKey: string
  colLabel: string
  tier?: number
  value?: number
  delta?: number
  count?: number
}

/**
 * Payload handed off to the Share drawer when the resilience heatmap
 * is snapshotted. Consumers should treat it as opaque data. The CSV
 * export is the only reader that inspects the row shape today.
 */
export interface ResilienceHeatmapChartData {
  kind: "resilience"
  view: ResilienceView
  cellEncoding: CellEncoding
  tileScope: "panel" | "scenario" | "outcome" | "hydroclimate"
  tileLabel?: string
  rows: ResilienceChartDataRow[]
}

export interface ResilienceCaptureResult {
  /** PNG data URL. Always populated. */
  dataUrl: string
  /**
   * Serialized SVG with computed styles inlined. Populated by the
   * off-screen capture path (tile / solo). The panel-wide capture
   * path leaves this undefined while it is still composed-DOM.
   */
  svg?: string
  chartData: ResilienceHeatmapChartData
}
