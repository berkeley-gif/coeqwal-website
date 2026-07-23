/**
 * Data-in-depth card CSV builder. Emits the standard header block, one
 * summary-statistics row per member, then the annual series as one column
 * per member, labeled by real water years when the capture carried them
 * (live data) or by year index (sample data).
 */

import {
  buildCsvHeaderBlock,
  csvEscape,
  type CsvHeaderInput,
} from "./csvFormat"

/**
 * Data-in-depth chart payload persisted on the share item by
 * `captureDataInDepthOffscreen`. Structural type so the exporter stays free
 * of UI-package imports.
 */
export type DataChartDataShape = {
  kind?: "data"
  variableName: string
  viewLabel: string
  compareByLabel: string
  unitLabel: string
  source: string
  members: Array<{
    label: string
    series: number[]
    waterYears?: number[]
    stats: {
      min: number
      p10: number
      p25: number
      p50: number
      p75: number
      p90: number
      max: number
      mean: number
      cv: number
    }
    value: number
  }>
}

const STATS_HEADER = "Member,Mean,CV,Min,P10,P25,Median,P75,P90,Max"

/** Trim float noise without losing precision users care about. */
function num(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(6)))
}

/**
 * Convert a data-in-depth card payload into a CSV table, or null when there
 * are no members to export. Layout: header block, blank line, per-member
 * summary statistics, blank line, then the annual series table (only when at
 * least one member carries a series).
 */
export function dataInDepthToCSV(
  data: DataChartDataShape,
  header: CsvHeaderInput,
): string | null {
  if (!Array.isArray(data.members) || data.members.length === 0) return null

  const lines: string[] = []
  lines.push(
    ...buildCsvHeaderBlock({
      ...header,
      extra: [
        ["Variable", data.variableName],
        ["View", data.viewLabel],
        ["Compare by", data.compareByLabel],
        ["Unit", data.unitLabel],
        ["Data source", data.source === "live" ? "Live data" : "Sample data"],
        ...(header.extra ?? []),
      ],
    }),
  )

  lines.push("")
  lines.push(STATS_HEADER)
  for (const m of data.members) {
    lines.push(
      [
        csvEscape(m.label),
        num(m.stats.mean),
        num(m.stats.cv),
        num(m.stats.min),
        num(m.stats.p10),
        num(m.stats.p25),
        num(m.stats.p50),
        num(m.stats.p75),
        num(m.stats.p90),
        num(m.stats.max),
      ].join(","),
    )
  }

  const maxLen = Math.max(...data.members.map((m) => m.series.length))
  if (maxLen > 0) {
    // Use real water years only when every member's years align with its
    // series; otherwise fall back to a 1-based index so columns stay aligned.
    const allYears = data.members.every(
      (m) => m.waterYears && m.waterYears.length === m.series.length,
    )
    const yearLabel = (row: number): string => {
      if (allYears) {
        const first = data.members[0]!.waterYears!
        return String(first[row] ?? "")
      }
      return String(row + 1)
    }
    lines.push("")
    lines.push(
      [allYears ? "Water year" : "Year index"]
        .concat(data.members.map((m) => csvEscape(m.label)))
        .join(","),
    )
    for (let row = 0; row < maxLen; row++) {
      lines.push(
        [yearLabel(row)]
          .concat(
            data.members.map((m) =>
              m.series[row] == null ? "" : num(m.series[row]!),
            ),
          )
          .join(","),
      )
    }
  }

  return lines.join("\n")
}
