/**
 * Data-in-depth card CSV builder. Emits the standard header block, one
 * summary-statistics row per member, then the annual series as one column
 * per member, labeled by real water years when the capture carried them
 * or by year index otherwise. Only model results are ever exported: a member
 * without them keeps a labeled row with every value blank.
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
  /** Standardized figure title as drawn on the exported image */
  figureTitle?: string
  /** Year basis of the series rows: water years unless the variable is
   *  aggregated by calendar year upstream (the CWS delivery family). */
  yearBasis?: "water" | "calendar"
  members: Array<{
    label: string
    series: number[]
    waterYears?: number[]
    /** Per-member provenance: true when the series came from the live API */
    isLive?: boolean
    /** True when the scenario is not modeled for this variable at all: the
     *  row is present and labeled, but every value cell is empty. */
    liveDataMissing?: boolean
    loadFailed?: boolean
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

type CsvMember = DataChartDataShape["members"][number]

/**
 * True when the member carries model results. Captures made before members
 * carried a provenance flag count only when they carry water years, which
 * only served series ever had.
 */
function hasModelResults(m: CsvMember): boolean {
  if (m.liveDataMissing || m.loadFailed) return false
  if (m.isLive !== undefined) return m.isLive
  return !!m.waterYears && m.waterYears.length === m.series.length
}

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
        ...(data.figureTitle
          ? ([["Figure title", data.figureTitle]] as Array<[string, string]>)
          : []),
        ["Variable", data.variableName],
        ["View", data.viewLabel],
        ["Compare by", data.compareByLabel],
        ["Unit", data.unitLabel],
        ["Data source", "CalSim3 model results"],
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
    // A member without model results (not modeled for this variable, failed
    // to load, or a stand-in series) keeps its labeled row so the reader can
    // see it WAS compared, but every statistic is blank: exporting its
    // numbers would hand the reader fabricated values.
    if (!hasModelResults(m)) {
      lines.push(
        [
          csvEscape(m.label),
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "No data",
        ].join(","),
      )
      continue
    }
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
        "CalSim3 model results",
      ].join(","),
    )
  }

  // Series columns carry model results only; any other member's column is
  // empty.
  const members = data.members.map((m) =>
    hasModelResults(m) ? m : { ...m, series: [], waterYears: [] },
  )
  const maxLen = Math.max(...members.map((m) => m.series.length))
  const allYears = members.every(
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
      new Set(members.flatMap((m) => m.waterYears!)),
    ).sort((a, b) => a - b)
    const byYear = members.map(
      (m) => new Map(m.waterYears!.map((y, i) => [y, m.series[i]])),
    )
    lines.push("")
    lines.push(
      [data.yearBasis === "calendar" ? "Calendar year" : "Water year"]
        .concat(members.map((m) => csvEscape(m.label)))
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
    // At least one member has no year labels (an older capture), so a shared
    // year axis does not exist; fall back to a 1-based index.
    lines.push("")
    lines.push(
      ["Year index"].concat(members.map((m) => csvEscape(m.label))).join(","),
    )
    for (let row = 0; row < maxLen; row++) {
      lines.push(
        [String(row + 1)]
          .concat(
            members.map((m) =>
              m.series[row] == null ? "" : num(m.series[row]!),
            ),
          )
          .join(","),
      )
    }
  }

  return lines.join("\n")
}
