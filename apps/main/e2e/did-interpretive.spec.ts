import { test, expect } from "@playwright/test"
import {
  summarySentence,
  type SummaryContext,
  type SummaryMember,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/hooks/interpretiveText"

// Interpretive-sentence contract for the winter-run salmon variable: the
// confirmed wording is "Winter-run Chinook salmon for <scenario> under the
// <hydroclimate> occupy <XX%> of suitable spawning habitat, on average",
// built from the MEAN of the displayed percent series (a 3-year population
// average reads as an average, not a median). Other variables keep the
// generic median-based sentences. Node-side spec, runs in e2e-core.

const salmonCtx: SummaryContext = {
  view: "dist",
  compareBy: "scenarios",
  variableName: "Winter-run abundance",
  variableId: "salmon_abund",
  unit: "%",
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
    [member("Current Operations", [40, 50], true)],
    salmonCtx,
  )
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations under the Historical hydroclimate occupy 45% of suitable spawning habitat, on average.",
  )
})

test("salmon sentence appends mean-based deltas for compared scenarios", () => {
  const s = summarySentence(
    [
      member("Current Operations", [40, 50], true),
      member("Salmon flows", [54, 66]),
    ],
    salmonCtx,
  )
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations under the Historical hydroclimate occupy 45% of suitable spawning habitat, on average; relative to it: Salmon flows +33%.",
  )
})

test("salmon sentence ranges across compared climate futures", () => {
  const s = summarySentence(
    [member("Historical", [40, 50]), member("2070 hotter-drier", [30, 40])],
    { ...salmonCtx, compareBy: "climates" },
  )
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations occupy 45% of suitable spawning habitat under Historical and 35% under 2070 hotter-drier, on average.",
  )
})

test("salmon sentence does not double the word climate for climate-named holds", () => {
  const s = summarySentence([member("Current Operations", [40, 50], true)], {
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
