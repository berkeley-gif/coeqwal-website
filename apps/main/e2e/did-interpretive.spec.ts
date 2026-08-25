import { test, expect } from "@playwright/test"
import {
  formatValue,
  howToReadText,
  summarySentence,
  type SummaryContext,
  type SummaryMember,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/hooks/interpretiveText"

// Interpretive-sentence contract for the winter-run salmon variable: the
// wording is "Winter-run Chinook salmon for <scenario> under the
// <hydroclimate> occupy <XX%> of suitable spawning habitat, at the median",
// built from the MEDIAN of the displayed proportion series converted to
// percent for prose. The median is what the chart plots; the sentence
// reported the arithmetic mean until the 2026-08-20 science-team correction,
// so the number in the header did not match the chart under it. Other
// variables keep the generic median-based sentences. The fixtures below use
// two-element series where mean and median coincide, which is why their
// VALUES are unchanged by that switch and only the wording moved. Node-side
// spec, runs in e2e-core.

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
    "Winter-run Chinook salmon for Current Operations under the Historical hydroclimate occupy 45% of suitable spawning habitat, at the median.",
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
    "Winter-run Chinook salmon for Current Operations under the Historical hydroclimate occupy 45% of suitable spawning habitat, at the median; for comparison: Salmon flows 60%.",
  )
})

test("salmon sentence ranges across compared climate futures", () => {
  const s = summarySentence(
    [member("Historical", [0.4, 0.5]), member("2070 hotter-drier", [0.3, 0.4])],
    { ...salmonCtx, compareBy: "climates" },
  )
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations occupy 45% of suitable spawning habitat under Historical and 35% under 2070 hotter-drier, at the median.",
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
    "Winter-run Chinook salmon for Current Operations occupy 45% of suitable spawning habitat under Historical, 40% under 2070 mid-century, and 35% under 2070 hotter-drier, at the median.",
  )
})

test("salmon sentence does not double the word climate for climate-named holds", () => {
  const s = summarySentence([member("Current Operations", [0.4, 0.5], true)], {
    ...salmonCtx,
    climateName: "Moderate-wet climate",
  })
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations under the Moderate-wet climate occupy 45% of suitable spawning habitat, at the median.",
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

// 2026-08-20 science-team correction: the header quoted the ARITHMETIC MEAN
// while the plot shows the median, and its comparison clause quoted the
// sample engine's stand-in values for scenarios the model has no results for
// as though they were real. Both are fixed below.

test("salmon sentence reports the plotted median, not the mean", () => {
  // A series whose mean and median diverge sharply: mean 3.25%, median 1%.
  // The chart plots the median, so the sentence must say the median.
  const s = summarySentence(
    [member("Current Operations", [0.01, 0.01, 0.01, 0.1], true)],
    salmonCtx,
  )
  expect(s).toContain("1.0% of suitable spawning habitat")
  expect(s).toContain("at the median")
  expect(s).not.toContain("3.25%")
  expect(s).not.toContain("on average")
})

test("salmon sentence never quotes a value for a scenario with no data", () => {
  // The Delta Conveyance Project scenarios have no salmon results at all.
  // The member still carries a sample series (the engine always produces
  // one), and quoting its number was the bug: it read as a real result.
  const dcp: SummaryMember = {
    id: "DWR 2025 DCP",
    label: "DWR 2025 DCP",
    series: [0.52, 0.52],
    liveDataMissing: true,
  }
  const s = summarySentence(
    [member("Current Operations", [0.4, 0.5], true), dcp],
    salmonCtx,
  )
  expect(s).not.toContain("52%")
  expect(s).toContain("no data available for DWR 2025 DCP")
  // The member that DOES have data still reports normally.
  expect(s).toContain("45% of suitable spawning habitat")
})

test("salmon sentence marks a sample-backed comparison member as sample", () => {
  const s = summarySentence(
    [
      { ...member("Current Operations", [0.4, 0.5], true), isLive: true },
      { ...member("Salmon flows", [0.54, 0.66]), isLive: false },
    ],
    salmonCtx,
  )
  expect(s).toContain("Salmon flows 60% (sample)")
})

// Ted's n128: the box plot draws a dashed tick at the mean inside each box
// and the "How do I read this chart?" text did not say so.
test("the box-plot explainer names the dashed mean marker", () => {
  const sentence = "The short dashed line inside each box marks the mean."
  expect(howToReadText("dist", "box")).toContain(sentence)
  expect(howToReadText("dist", "exceedance")).not.toContain(sentence)
  expect(howToReadText("dist", "stats")).not.toContain(sentence)
})
