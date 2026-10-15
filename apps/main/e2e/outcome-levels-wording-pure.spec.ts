import { test, expect } from "@playwright/test"
import { getLevelName } from "../app/content/tiers"
import { barChartDataToCSV } from "../app/features/scenarioExplorer/explorer/share/export/csv/barChartCsv"
import { equityDataToCSV } from "../app/features/scenarioExplorer/explorer/share/export/csv/equityCsv"
import { resilienceHeatmapDataToCSV } from "../app/features/scenarioExplorer/explorer/share/export/csv/resilienceCsv"

// Exports never say "tier": levels go by name, or as "outcome levels".
// Share items saved before that still carry "Tier N" labels; they read as
// the level name. Node-side spec (no browser).

const TIER_WORD = /\btiers?\b/i
const HEADER = {
  variantTitle: "Test",
  scenarios: [{ id: "s0020", label: "Current operations" }],
  hydroclimate: "historical",
}

test("stored Tier N labels read as level names", () => {
  expect(getLevelName("Tier 1")).toBe("Optimal")
  expect(getLevelName("Tier 2")).toBe("Acceptable")
  expect(getLevelName("Tier 3")).toBe("At-risk")
  expect(getLevelName("Tier 4")).toBe("Critical")
  expect(getLevelName("Acceptable")).toBe("Acceptable")
  expect(getLevelName("Tier 7")).toBe("Tier 7")
})

test("a bar chart CSV from a stored item names the levels", () => {
  const stored = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"].map((label, i) => ({
    label,
    value: 25,
    rawCount: i + 1,
    tierType: "multi_value" as const,
  }))
  const csv = barChartDataToCSV({ CWS_DEL: stored }, HEADER)
  expect(csv).toContain("Outcome,Optimal,Acceptable,At-risk,Critical")
  expect(csv).not.toMatch(TIER_WORD)
})

test("distribution and heatmap CSVs say outcome level", () => {
  const equity = equityDataToCSV(
    {
      scenarioId: "s0020",
      compareToBaseline: true,
      categories: ["Community surface water"],
      objectives: [
        {
          id: 1,
          tier: "Tier 2",
          baselineTier: "Tier 3",
          baselineTierLevel: 3,
          category: "Community surface water",
          locationId: "L1",
          locationName: "Place",
          tierLevel: 2,
          tierCode: "CWS_DEL",
        },
      ],
    },
    HEADER,
  )
  expect(equity).toContain(
    "Outcome,Location,Outcome level,Baseline outcome level",
  )
  expect(equity).not.toMatch(TIER_WORD)
  const heatmap = resilienceHeatmapDataToCSV(
    {
      rows: [
        {
          rowKey: "CWS_DEL",
          rowLabel: "Community surface water",
          colKey: "historical",
          colLabel: "Historical",
          tier: 2,
          value: 1.8,
        },
      ],
    },
    HEADER,
  )
  expect(heatmap).toContain("Row,Column,Outcome level,Value")
  expect(heatmap).not.toMatch(TIER_WORD)
})
