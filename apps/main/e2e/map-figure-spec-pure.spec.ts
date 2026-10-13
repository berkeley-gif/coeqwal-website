import { test, expect } from "@playwright/test"
import { mapFigureSpec } from "../app/features/scenarioExplorer/explorer/tools/chrome/layout/mapFigureSpec"
import { buildFigureTemplate } from "../app/features/scenarioExplorer/explorer/share/figureTemplate"

test("nothing on the map means no caption", () => {
  expect(
    mapFigureSpec({
      mode: "bar",
      outcomeNames: [],
      scenarioLabel: "Current operations",
      hydroclimateLabel: "Historical",
      comparedWithBaseline: false,
    }),
  ).toBeNull()
})

test("one outcome from Bar names outcome, strategy, hydroclimate", () => {
  const spec = mapFigureSpec({
    mode: "bar",
    outcomeNames: ["Environmental flows"],
    scenarioLabel: "Current operations",
    hydroclimateLabel: "Moderate stress",
    comparedWithBaseline: false,
  })
  const t = buildFigureTemplate(spec!)
  expect(t.toolLabel).toBe("Map")
  expect(t.chartKindLabel).toBe("Bar tool")
  expect(t.rows.map((r) => [r.label, r.value])).toEqual([
    ["Outcome", "Environmental flows"],
    ["Strategy", "Current Operations"],
    ["Hydroclimate", "Moderate stress"],
  ])
  expect(t.legendHeading).toBe("Tier")
})

test("distribution comparison names the baseline", () => {
  const t = buildFigureTemplate(
    mapFigureSpec({
      mode: "equity",
      outcomeNames: ["Agricultural revenue", "Community surface water"],
      scenarioLabel: "Groundwater pumping limits in the San Joaquin Valley",
      hydroclimateLabel: "Historical",
      comparedWithBaseline: true,
    })!,
  )
  expect(t.chartKindLabel).toBe("Distribution tool")
  expect(t.rows[0]?.value).toBe("Agricultural revenue, Community surface water")
  expect(t.rows[1]?.value).toBe(
    "Groundwater Pumping Limits in the San Joaquin Valley, Compared with Current Operations",
  )
})

test("unknown scenario label is omitted, not printed as null", () => {
  const t = buildFigureTemplate(
    mapFigureSpec({
      mode: "radar",
      outcomeNames: ["Reservoir storage"],
      scenarioLabel: null,
      hydroclimateLabel: null,
      comparedWithBaseline: false,
    })!,
  )
  expect(t.rows.map((r) => r.label)).toEqual(["Outcome"])
})
