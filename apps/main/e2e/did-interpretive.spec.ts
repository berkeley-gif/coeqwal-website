import { test, expect } from "@playwright/test"
import {
  formatValue,
  summarySentence,
  type SummaryContext,
  type SummaryMember,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/hooks/interpretiveText"

// Interpretive-sentence contract for the winter-run salmon variable: the
// confirmed wording is "Winter-run Chinook salmon for <scenario> under the
// <hydroclimate> occupy <XX%> of suitable spawning habitat, on average",
// built from the MEAN of the displayed proportion series converted to
// percent for prose (a 3-year population
// average reads as an average, not a median). Other variables keep the
// generic median-based sentences. Node-side spec, runs in e2e-core.

const salmonCtx: SummaryContext = {
  view: "dist",
  compareBy: "scenarios",
  variableName: "Winter-run abundance",
  variableId: "salmon_abund",
  unit: "proportion",
  locationName: "Sacramento winter-run Chinook",
  climateName: "Historical",
  scenarioName: "Current Operations",
}

const member = (
  label: string,
  series: number[],
  isReference = false,
): SummaryMember => ({ id: label, label, series, isReference })

test("salmon sentence follows the confirmed habitat-occupancy template", () => {
  const s = summarySentence(
    [member("Current Operations", [0.4, 0.5], true)],
    salmonCtx,
  )
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations under the Historical hydroclimate occupy 45% of suitable spawning habitat, on average.",
  )
})

test("salmon sentence lists compared scenarios by their own occupancy", () => {
  // Compared members report occupancy percents, never relative-change
  // percents: mixing the two on a percent-unit variable reads ambiguous.
  const s = summarySentence(
    [
      member("Current Operations", [0.4, 0.5], true),
      member("Salmon flows", [0.54, 0.66]),
    ],
    salmonCtx,
  )
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations under the Historical hydroclimate occupy 45% of suitable spawning habitat, on average; for comparison: Salmon flows 60%.",
  )
})

test("salmon sentence ranges across compared climate futures", () => {
  const s = summarySentence(
    [member("Historical", [0.4, 0.5]), member("2070 hotter-drier", [0.3, 0.4])],
    { ...salmonCtx, compareBy: "climates" },
  )
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations occupy 45% of suitable spawning habitat under Historical and 35% under 2070 hotter-drier, on average.",
  )
})

test("salmon sentence enumerates every compared climate member", () => {
  const s = summarySentence(
    [
      member("Historical", [0.4, 0.5]),
      member("2070 mid-century", [0.36, 0.44]),
      member("2070 hotter-drier", [0.3, 0.4]),
    ],
    { ...salmonCtx, compareBy: "climates" },
  )
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations occupy 45% of suitable spawning habitat under Historical, 40% under 2070 mid-century, and 35% under 2070 hotter-drier, on average.",
  )
})

test("salmon sentence does not double the word climate for climate-named holds", () => {
  const s = summarySentence([member("Current Operations", [0.4, 0.5], true)], {
    ...salmonCtx,
    climateName: "Moderate-wet climate",
  })
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations under the Moderate-wet climate occupy 45% of suitable spawning habitat, on average.",
  )
})

test("non-salmon variables keep the generic median-based sentence", () => {
  const s = summarySentence(
    [member("Current Operations", [10, 20, 30], true)],
    {
      ...salmonCtx,
      variableId: "res_apr",
      variableName: "April reservoir storage",
      unit: "TAF",
      locationName: "Shasta",
    },
  )
  expect(s).toContain("median")
  expect(s).not.toContain("spawning")
})

test("formatValue renders proportion values with enough precision", () => {
  // The generic 2-decimal rule below 10 would render small proportions as
  // 0.00 in tooltips and axis ticks; the proportion unit gets 3 decimals
  // below 0.1 so live salmon medians stay legible.
  expect(formatValue(0.045, "proportion")).toBe("0.045")
  expect(formatValue(0.0049, "proportion")).toBe("0.005")
  expect(formatValue(0.091, "proportion")).toBe("0.091")
  expect(formatValue(0.129, "proportion")).toBe("0.13")
  expect(formatValue(1.29, "proportion")).toBe("1.29")
})
