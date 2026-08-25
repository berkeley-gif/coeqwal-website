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
  distKind: "exceedance",
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

// Stats view (2026-08-24 board and call): the sentence under the mean and CV
// bars must report the mean and the CV the bars draw, never the median. The
// fixtures below have a mean of 4 and a median of 1 ([1, 1, 10]), so a median
// leaking into a Stats sentence fails on the number, not only the wording.
// CV of [1, 1, 10] is sd/mean = 4.243/4 = 1.06; [2, 2, 20] doubles the mean
// and keeps the CV.

const statsCtx: SummaryContext = {
  view: "dist",
  distKind: "stats",
  compareBy: "scenarios",
  variableName: "SWP M&I deliveries",
  variableId: "swp_mi",
  proseName: "M&I deliveries of the State Water Project",
  unit: "TAF",
  locationName: "All South of Delta",
  locationTitleName: "All South of Delta",
  climateName: "Historical",
  scenarioName: "Current Operations",
}

test("stats sentence on the scenarios axis reports mean then CV per compared scenario", () => {
  const s = summarySentence(
    [
      member("Current Operations", [1, 1, 10], true),
      member("Salmon flows", [2, 2, 20]),
    ],
    statsCtx,
  )
  expect(s).toBe(
    "Mean M&I deliveries of the State Water Project for Current Operations under the Historical hydroclimate is 4.00 TAF. Mean M&I deliveries of the State Water Project for the Salmon flows scenario is 8.00 TAF: a difference of +100%. The annual variation in M&I deliveries of the State Water Project for Current Operations under the Historical hydroclimate is 1.06 (CV). The annual variation in M&I deliveries of the State Water Project for the Salmon flows scenario is 1.06 (CV): a difference of +0%.",
  )
  expect(s).not.toMatch(/median/i)
  // CV is a ratio: no unit token follows a CV value.
  expect(s).not.toMatch(/\d TAF \(CV\)/)
})

test("stats sentence uses the X2 wording for the Delta salinity variables", () => {
  const s = summarySentence(
    [
      member("Current Operations", [1, 1, 10], true),
      member("Salmon flows", [2, 2, 20]),
    ],
    {
      ...statsCtx,
      variableId: "x2_apr",
      variableName: "April X2 position",
      proseName: "April X2 position",
      unit: "km",
      locationName: "Delta (NDO node)",
      locationTitleName: "Delta (NDO node)",
    },
  )
  expect(s).toBe(
    "The mean X2 location in April for Current Operations under the Historical hydroclimate is 4.0 km. The mean April X2 location for the Salmon flows scenario is 8.0 km: a difference of +100%. The annual variation in X2 location in April for Current Operations under the Historical hydroclimate is 1.06 (CV). The annual variation in April X2 location for the Salmon flows scenario is 1.06 (CV): a difference of +0%.",
  )
})

test("stats sentence on the climates axis ranges the mean and the CV across the compared futures", () => {
  const s = summarySentence(
    [member("Historical", [1, 1, 10]), member("Extreme stress", [2, 2, 20])],
    {
      ...statsCtx,
      compareBy: "climates",
      variableId: "res_apr",
      variableName: "April reservoir storage",
      proseName: "April reservoir storage",
      locationName: "Shasta",
      locationTitleName: "Shasta Reservoir",
    },
  )
  expect(s).toBe(
    "At Shasta Reservoir under Current Operations, mean April reservoir storage ranges from 4.00 TAF (Historical) to 8.00 TAF (Extreme stress): a change of +100%. At Shasta Reservoir under Current Operations, the coefficient of variation (CV) of annual April reservoir storage is 1.06 (Historical) to 1.06 (Extreme stress): a change of +0%.",
  )
})

test("stats sentence on the locations axis names the lowest and highest mean and their CVs", () => {
  const s = summarySentence(
    [member("Yuba River", [1, 1, 10]), member("Feather River", [2, 2, 20])],
    {
      ...statsCtx,
      compareBy: "locations",
      variableId: "riv_flow",
      variableName: "River flows",
      proseName: "river flows",
    },
  )
  expect(s).toBe(
    "Under Current Operations (Historical), mean river flows ranges from 4.00 TAF at Yuba River to 8.00 TAF at Feather River. The coefficient of variation (CV) of annual river flows is 1.06 at Yuba River and 1.06 at Feather River.",
  )
})

test("stats sentence skips a member with no model results and names it", () => {
  const s = summarySentence(
    [
      member("Current Operations", [1, 1, 10], true),
      { ...member("DWR 2025 DCP", [5, 5, 5]), liveDataMissing: true },
    ],
    statsCtx,
  )
  expect(s).not.toContain("5.00")
  expect(s).toContain("no data available for DWR 2025 DCP")
})

test("stats sentence renders a dash, not a division, when the reference mean is zero", () => {
  const s = summarySentence(
    [
      member("Current Operations", [0, 0, 0], true),
      member("Other", [2, 2, 20]),
    ],
    statsCtx,
  )
  expect(s).toContain("a difference of -")
  expect(s).not.toContain("Infinity")
  expect(s).not.toContain("NaN")
})

test("stats sentence on the level view adds the linear trend", () => {
  const declining = Array.from({ length: 10 }, (_, i) => 100 - 0.5 * i)
  const stable = Array.from({ length: 10 }, () => 100)
  const s = summarySentence(
    [member("Current Operations", declining, true), member("Other", stable)],
    {
      ...statsCtx,
      view: "level",
      variableId: "gw_stor",
      variableName: "Groundwater storage",
      proseName: "groundwater level",
      unit: "ft",
    },
  )
  expect(s).toContain(
    "The linear trend in groundwater level is -0.50 ft/yr for Current Operations and 0.00 ft/yr for Other.",
  )
})

test("salmon keeps its own template on the Stats view", () => {
  const s = summarySentence([member("Current Operations", [0.4, 0.5], true)], {
    ...salmonCtx,
    distKind: "stats",
  })
  expect(s).toContain("spawning habitat, at the median")
})

test("generic median sentences also skip and name a member with no model results", () => {
  const s = summarySentence(
    [
      member("Current Operations", [10, 20, 30], true),
      { ...member("DWR 2025 DCP", [99, 99, 99]), liveDataMissing: true },
    ],
    {
      ...salmonCtx,
      variableId: "res_apr",
      variableName: "April reservoir storage",
      proseName: "April reservoir storage",
      unit: "TAF",
      locationName: "Shasta",
    },
  )
  expect(s).not.toContain("99")
  expect(s).toContain("no data available for DWR 2025 DCP")
})
