/**
 * Radar-chart CSV builder. Outcomes as rows, scenarios as columns,
 * with decimal tier scores so sub-tier interpolation survives.
 */

import {
  buildCsvHeaderBlock,
  csvQuote,
  type CsvHeaderInput,
} from "./csvFormat"

/**
 * Convert the internal radar coordinate (-1 … +1) back to a weighted
 * tier score on the 1-4 scale used by the tier system:
 *   1 = Optimal, 2 = Acceptable, 3 = At-risk, 4 = Critical
 */
function radarValueToTierScore(v: number): number {
  return Math.round((4 - (v + 1) * 1.5) * 100) / 100
}

/**
 * Convert radar chart data into a readable CSV string.
 *
 * Layout: outcomes as rows, scenarios as columns. The shared header
 * block carries the scenarios list and the tier scale legend. The
 * data table is `Key outcomes,<scenario-1>,<scenario-2>,...` followed
 * by one row per outcome with decimal tier scores (1.0-4.0). The
 * decimal carries sub-tier interpolation that integer rounding would
 * lose, so radar deliberately keeps decimals.
 */
export function radarDataToCSV(
  rawData: Record<string, unknown>,
  header: CsvHeaderInput,
  scenarioIds?: string[],
  scenarioNameLookup?: (id: string) => string,
  outcomeNameLookup?: (code: string) => string,
): string | null {
  const ids = scenarioIds ?? Object.keys(rawData)
  if (ids.length === 0) return null

  const data: Record<string, Record<string, number | null>> = {}
  for (const id of ids) {
    const entry = rawData[id]
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      data[id] = entry as Record<string, number | null>
    }
  }
  const scenarioEntries = Object.entries(data)
  if (scenarioEntries.length === 0) return null

  const outcomeCodes = Array.from(
    new Set(scenarioEntries.flatMap(([, v]) => Object.keys(v))),
  )

  const scenarioLabels = scenarioEntries.map(
    ([id]) => scenarioNameLookup?.(id) ?? id,
  )

  const lines: string[] = []
  lines.push(...buildCsvHeaderBlock(header))
  lines.push("")
  lines.push(["Key outcomes", ...scenarioLabels.map(csvQuote)].join(","))

  for (const code of outcomeCodes) {
    const label = outcomeNameLookup?.(code) ?? code
    const vals = scenarioEntries.map(([, values]) => {
      const v = values[code]
      return v != null ? String(radarValueToTierScore(v)) : ""
    })
    lines.push([csvQuote(label), ...vals].join(","))
  }

  return lines.join("\n")
}
