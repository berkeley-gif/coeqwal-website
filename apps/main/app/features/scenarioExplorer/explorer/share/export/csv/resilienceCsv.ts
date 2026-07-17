/**
 * Resilience heatmap CSV builder. One row per (row, column) cell with
 * both the categorical tier and the underlying continuous value.
 */

import {
  buildCsvHeaderBlock,
  csvEscape,
  type CsvHeaderInput,
} from "./csvFormat"

/**
 * Resilience heatmap row shape, mirroring `ResilienceChartDataRow` in
 * `ResiliencePanel.tsx`. Duplicated here as a plain type to avoid a
 * runtime import cycle between the exporter and the explore view.
 */
export type ResilienceHeatmapRow = {
  rowKey: string
  rowLabel: string
  colKey: string
  colLabel: string
  tier?: number
  value?: number
  delta?: number
  count?: number
}

export type ResilienceHeatmapChartDataShape = {
  view?: string
  cellEncoding?: string
  tileScope?: string
  tileLabel?: string
  rows: ResilienceHeatmapRow[]
}

/**
 * Convert a flat resilience heatmap payload into a CSV table. Layout:
 * one row per (row, column) cell with tier and value columns. Tier
 * is the categorical (1-4) bucket the heatmap drew, value is the
 * underlying continuous score. Variant-specific metadata (Subject,
 * View, Encoding) rides through the header block's `extra` channel.
 */
export function resilienceHeatmapDataToCSV(
  data: ResilienceHeatmapChartDataShape,
  header: CsvHeaderInput,
): string | null {
  if (!Array.isArray(data.rows) || data.rows.length === 0) return null
  const tableHeader = ["Row", "Column", "Tier", "Value"]
  const lines: string[] = []
  lines.push(...buildCsvHeaderBlock(header))
  lines.push("")
  lines.push(tableHeader.join(","))
  for (const row of data.rows) {
    lines.push(
      [
        csvEscape(row.rowLabel),
        csvEscape(row.colLabel),
        row.tier != null ? String(row.tier) : "",
        row.value != null ? String(row.value) : "",
      ].join(","),
    )
  }
  return lines.join("\n")
}
