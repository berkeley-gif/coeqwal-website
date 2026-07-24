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
  /** Active water-year-type filter at capture, e.g. "Dry; Critical" (absent = all years) */
  waterYearTypesLabel?: string
  members: Array<{
    label: string
    series: number[]
    waterYears?: number[]
    /** Per-member provenance: true when the series came from the live API */
    isLive?: boolean
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

const STATS_HEADER = "Member,Mean,CV,Min,P10,P25,Median,P75,P90,Max,Source"

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
        ...(data.waterYearTypesLabel
          ? ([["Water year types", data.waterYearTypesLabel]] as Array<
              [string, string]
            >)
          : []),
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
        m.isLive ? "Live" : "Sample",
      ].join(","),
    )
  }

  const maxLen = Math.max(...data.members.map((m) => m.series.length))
  const allYears = data.members.every(
    (m) => m.waterYears && m.waterYears.length === m.series.length,
  )
  if (allYears && maxLen > 0) {
    // Every member carries aligned water years, but the SETS can differ
    // between members (the water-year-type filter classifies per scenario,
    // and null-value years are dropped per member). Pivot on the sorted
    // union of years and look each member's value up by year, leaving a
    // blank cell where a member lacks that year, so a row's label is
    // correct for every column.
    const years = Array.from(
      new Set(data.members.flatMap((m) => m.waterYears!)),
    ).sort((a, b) => a - b)
    const byYear = data.members.map(
      (m) => new Map(m.waterYears!.map((y, i) => [y, m.series[i]])),
    )
    lines.push("")
    lines.push(
      ["Water year"]
        .concat(data.members.map((m) => csvEscape(m.label)))
        .join(","),
    )
    for (const year of years) {
      lines.push(
        [String(year)]
          .concat(
            byYear.map((map) => {
              const v = map.get(year)
              return v == null ? "" : num(v)
            }),
          )
          .join(","),
      )
    }
  } else if (maxLen > 0) {
    // At least one member has no year labels (sample data), so a shared
    // year axis does not exist; fall back to a 1-based index.
    lines.push("")
    lines.push(
      ["Year index"]
        .concat(data.members.map((m) => csvEscape(m.label)))
        .join(","),
    )
    for (let row = 0; row < maxLen; row++) {
      lines.push(
        [String(row + 1)]
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
