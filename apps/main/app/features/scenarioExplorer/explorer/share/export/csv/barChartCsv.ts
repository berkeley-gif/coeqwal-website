/**
 * Bar-chart (strategy grid row) CSV builder. Pivots tier data into one
 * row per outcome with a location count per tier column.
 */

import {
  buildCsvHeaderBlock,
  csvEscape,
  type CsvHeaderInput,
} from "./csvFormat"

export type BarTierEntry = {
  label?: string
  value?: number
  rawCount?: number
  tierType?: "single_value" | "multi_value"
}

/**
 * Convert bar chart tier data into a readable CSV string.
 *
 * Values are reported as number of locations per tier. Single-location
 * outcomes get a 1 in their active tier. The outcome column carries
 * display names rather than the raw `OutcomeCode` keys when an
 * `outcomeNameLookup` is supplied.
 *
 * Layout:
 *
 *   <header block>                            (via buildCsvHeaderBlock)
 *   Outcome, Optimal, Acceptable, At-risk, Critical, Total Locations
 *   Community deliveries, 1, 2, 1, 0, 4
 *   Ag revenue, 0, 1, 0, 0, 1
 */
export function barChartDataToCSV(
  data: Record<string, BarTierEntry[]>,
  header: CsvHeaderInput,
  outcomeNameLookup?: (code: string) => string,
): string {
  const outcomes = Object.keys(data)
  if (outcomes.length === 0) return ""

  const firstTiers = data[outcomes[0]!]!
  const tierNames = firstTiers.map((t) => t.label ?? "")

  const tableHeader = [
    "Outcome",
    ...tierNames.map(csvEscape),
    "Total Locations",
  ]

  const rows = outcomes.map((outcome) => {
    const tiers = data[outcome]!
    const isSingle = tiers[0]?.tierType === "single_value"

    let counts: string[]
    let total: string
    if (isSingle) {
      counts = tiers.map((t) => (t.value && t.value > 0 ? "1" : "0"))
      total = "1"
    } else {
      counts = tiers.map((t) => String(t.rawCount ?? 0))
      total = String(tiers.reduce((sum, t) => sum + (t.rawCount ?? 0), 0))
    }
    const outcomeLabel = outcomeNameLookup?.(outcome) ?? outcome
    return [csvEscape(outcomeLabel), ...counts, total]
  })

  return [
    ...buildCsvHeaderBlock(header),
    "",
    tableHeader.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n")
}
