/**
 * Distribution (equity) card CSV builder. One row per (location,
 * outcome) tier assignment, with a baseline-tier column when
 * comparison was on at capture time.
 */

import {
  buildCsvHeaderBlock,
  csvEscape,
  type CsvHeaderInput,
} from "./csvFormat"

/**
 * Distribution-card chart data persisted by `captureEquityOffscreen`.
 * Mirrors the `EquityChartData` shape from `OffscreenEquityCapture.tsx`;
 * duplicated as a structural type so the exporter can stay free of
 * UI-package imports.
 */
export type EquityChartDataShape = {
  kind?: "equity"
  scenarioId: string
  compareToBaseline: boolean
  categories: string[]
  objectives: Array<{
    id: number
    tier: string
    baselineTier?: string
    baselineTierLevel?: number
    category: string
    locationId: string
    locationName: string
    tierLevel: number
    tierCode: string
  }>
}

/**
 * Convert a distribution-card payload into a CSV table. Layout: one
 * row per (location, outcome) tier assignment, with a baseline-tier
 * column when comparison was on at capture time. Both the scenario
 * tier and baseline tier columns are integers 1-4. The canonical
 * tier scale legend rides through the shared header block.
 */
export function equityDataToCSV(
  data: EquityChartDataShape,
  header: CsvHeaderInput,
): string | null {
  if (!Array.isArray(data.objectives) || data.objectives.length === 0) {
    return null
  }

  const lines: string[] = []
  lines.push(...buildCsvHeaderBlock(header))
  lines.push("")

  const tableHeader = data.compareToBaseline
    ? ["Outcome", "Location", "Tier", "Baseline tier"]
    : ["Outcome", "Location", "Tier"]
  lines.push(tableHeader.join(","))

  for (const obj of data.objectives) {
    const row = [
      csvEscape(obj.category),
      csvEscape(obj.locationName),
      String(obj.tierLevel),
    ]
    if (data.compareToBaseline) {
      // Prefer the integer field. Fall back to parsing the legacy
      // formatted string ("Tier N") for items that were captured
      // before `baselineTierLevel` was added to the payload.
      const baselineLevel =
        obj.baselineTierLevel ??
        (obj.baselineTier
          ? parseInt(obj.baselineTier.replace(/^Tier\s+/, ""), 10)
          : Number.NaN)
      row.push(Number.isFinite(baselineLevel) ? String(baselineLevel) : "")
    }
    lines.push(row.join(","))
  }
  return lines.join("\n")
}
