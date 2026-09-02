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
      member("Winter-run refuge flows", [0.54, 0.66]),
    ],
    salmonCtx,
  )
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations under the Historical hydroclimate occupy 45% of suitable spawning habitat, at the median; for comparison: Winter-run refuge flows 60%.",
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
    climateName: "Moderate climate",
  })
  expect(s).toBe(
    "Winter-run Chinook salmon for Current Operations under the Moderate climate occupy 45% of suitable spawning habitat, at the median.",
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
    id: "Delta Conveyance Project",
    label: "Delta Conveyance Project",
    series: [0.52, 0.52],
    liveDataMissing: true,
  }
  const s = summarySentence(
    [member("Current Operations", [0.4, 0.5], true), dcp],
    salmonCtx,
  )
  expect(s).not.toContain("52%")
  expect(s).toContain("no data available for Delta Conveyance Project")
  // The member that DOES have data still reports normally.
  expect(s).toContain("45% of suitable spawning habitat")
})

test("salmon sentence marks a sample-backed comparison member as sample", () => {
  const s = summarySentence(
    [
      { ...member("Current Operations", [0.4, 0.5], true), isLive: true },
      { ...member("Winter-run refuge flows", [0.54, 0.66]), isLive: false },
    ],
    salmonCtx,
  )
  expect(s).toContain("Winter-run refuge flows 60% (sample)")
})

// Ted's n128: the box plot draws a dashed tick at the mean inside each box
// and the "How do I read this chart?" text did not say so.
test("the box-plot explainer names the dashed mean marker", () => {
  const sentence = "The dashed line is the mean value (average)."
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
      member("Winter-run refuge flows", [2, 2, 20]),
    ],
    statsCtx,
  )
  expect(s).toBe(
    "Mean M&I deliveries of the State Water Project for Current Operations under the Historical hydroclimate is 4.00 TAF. Mean M&I deliveries of the State Water Project for the Winter-run refuge flows scenario is 8.00 TAF: a difference of +100%. The annual variation in M&I deliveries of the State Water Project for Current Operations under the Historical hydroclimate is 1.06 (CV). The annual variation in M&I deliveries of the State Water Project for the Winter-run refuge flows scenario is 1.06 (CV): a difference of +0%.",
  )
  expect(s).not.toMatch(/median/i)
  // CV is a ratio: no unit token follows a CV value.
  expect(s).not.toMatch(/\d TAF \(CV\)/)
})

test("stats sentence uses the X2 wording for the Delta salinity variables", () => {
  const s = summarySentence(
    [
      member("Current Operations", [1, 1, 10], true),
      member("Winter-run refuge flows", [2, 2, 20]),
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
    "The mean X2 location in April for Current Operations under the Historical hydroclimate is 4.0 km. The mean April X2 location for the Winter-run refuge flows scenario is 8.0 km: a difference of +100%. The annual variation in X2 location in April for Current Operations under the Historical hydroclimate is 1.06 (CV). The annual variation in April X2 location for the Winter-run refuge flows scenario is 1.06 (CV): a difference of +0%.",
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
      {
        ...member("Delta Conveyance Project", [5, 5, 5]),
        liveDataMissing: true,
      },
    ],
    statsCtx,
  )
  expect(s).not.toContain("5.00")
  expect(s).toContain("no data available for Delta Conveyance Project")
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
      {
        ...member("Delta Conveyance Project", [99, 99, 99]),
        liveDataMissing: true,
      },
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
  expect(s).toContain("no data available for Delta Conveyance Project")
})

// Money: the $M unit prints with decimals that follow the magnitude, because
// every community water system's median welfare loss is under 50,000 USD
// (0.05 $M) while the North of Delta total is millions. In prose, money
// reads "$2.55 M", never "2.55 $M".
test("formatValue prints millions of dollars with magnitude-adaptive decimals", () => {
  expect(formatValue(4142, "$M")).toBe("4,142")
  expect(formatValue(2.551, "$M")).toBe("2.55")
  expect(formatValue(0.9, "$M")).toBe("0.90")
  expect(formatValue(0.028, "$M")).toBe("0.028")
  expect(formatValue(0, "$M")).toBe("0.000")
})

// Welfare loss is zero in most years, so a median says nothing; its
// distribution sentence names the share of years with no loss and the mean.
test("welfare loss sentence reports the no-loss year count and the mean, per scenario", () => {
  const ref = member("Current Operations", [0, 0, 0, 4], true) // mean 1
  const other = member("Winter-run refuge flows", [0, 0, 8, 8]) // mean 4
  const s = summarySentence([ref, other], {
    view: "dist",
    distKind: "exceedance",
    compareBy: "scenarios",
    variableName: "Welfare loss",
    variableId: "cws_welfare",
    proseName: "welfare loss",
    unit: "$M",
    locationName: "All North of Delta",
    climateName: "Historical",
    scenarioName: "Current Operations",
  })
  expect(s).toBe(
    "At All North of Delta under the Historical hydroclimate, Current Operations has no welfare loss in 3 of 4 years and a mean annual loss of $1.00 M; Winter-run refuge flows has no loss in 2 of 4 years and a mean annual loss of $4.00 M (+300%).",
  )
})

test("welfare loss sentence ranges across climates and locations", () => {
  const base = {
    view: "dist" as const,
    distKind: "exceedance" as const,
    variableName: "Welfare loss",
    variableId: "cws_welfare",
    proseName: "welfare loss",
    unit: "$M",
    locationName: "All North of Delta",
    climateName: "Historical",
    scenarioName: "Current Operations",
  }
  expect(
    summarySentence(
      [
        member("Historical", [0, 0, 0, 4]),
        member("Extreme stress", [0, 0, 8, 8]),
      ],
      { ...base, compareBy: "climates" },
    ),
  ).toBe(
    "Under Current Operations at All North of Delta, mean annual welfare loss goes from $1.00 M (Historical, no loss in 3 of 4 years) to $4.00 M (Extreme stress, no loss in 2 of 4 years): a change of +300%.",
  )
  expect(
    summarySentence(
      [
        member("02_NU - Anderson", [0, 0, 0, 4]),
        member("15N_NU - Marysville", [0, 0, 8, 8]),
      ],
      { ...base, compareBy: "locations" },
    ),
  ).toBe(
    "Under Current Operations (Historical), mean annual welfare loss ranges from $1.00 M at 02_NU - Anderson (no loss in 3 of 4 years) to $4.00 M at 15N_NU - Marysville (no loss in 2 of 4 years).",
  )
})

test("stats sentence prints money as dollars in prose", () => {
  const s = summarySentence([member("Current Operations", [1, 1, 10], true)], {
    ...statsCtx,
    variableId: "cws_welfare",
    variableName: "Welfare loss",
    proseName: "welfare loss",
    unit: "$M",
  })
  expect(s).toContain(
    "Mean welfare loss for Current Operations under the Historical hydroclimate is $4.00 M.",
  )
})

// The project lead's exact median-sentence templates for three variable
// families on the scenarios axis (Aug 23 board, n55 reservoir storage, n65
// X2, n150 total Delta exports). September variants use the April template
// with the month swapped. Every other variable keeps the generic sentence.

const templateCtx = (over: Partial<SummaryContext>): SummaryContext => ({
  view: "dist",
  distKind: "exceedance",
  compareBy: "scenarios",
  variableName: "",
  unit: "TAF",
  locationName: "Shasta",
  locationTitleName: "Shasta Reservoir",
  climateName: "Historical",
  scenarioName: "Current Operations",
  ...over,
})

test("reservoir storage sentence follows the n55 template with higher and lower", () => {
  const s = summarySentence(
    [
      member("Current Operations", [10, 20, 30], true),
      member("Winter-run refuge flows", [15, 25, 35]),
      member("More storage", [5, 10, 15]),
    ],
    templateCtx({
      variableId: "res_apr",
      variableName: "April reservoir storage",
      proseName: "April reservoir storage",
    }),
  )
  expect(s).toBe(
    "At Shasta Reservoir, median April reservoir storage for Current Operations under the Historical hydroclimate is 20.0 TAF. The Winter-run refuge flows scenario has 25% higher median April reservoir storage. The More storage scenario has 50% lower median April reservoir storage.",
  )
})

test("September reservoir storage swaps the month in the n55 template", () => {
  const s = summarySentence(
    [member("Current Operations", [10, 20, 30], true)],
    templateCtx({
      variableId: "res_sep",
      variableName: "September reservoir storage",
      proseName: "September reservoir storage",
    }),
  )
  expect(s).toBe(
    "At Shasta Reservoir, median September reservoir storage for Current Operations under the Historical hydroclimate is 20.0 TAF.",
  )
})

test("X2 sentence follows the n65 template with no location clause", () => {
  const s = summarySentence(
    [
      member("Current Operations", [70, 74, 78], true),
      member("Winter-run refuge flows", [72, 76, 80]),
    ],
    templateCtx({
      variableId: "x2_apr",
      variableName: "April X2 position",
      proseName: "April X2 position",
      unit: "km",
      locationName: "Delta (NDO node)",
      locationTitleName: "Delta (NDO node)",
    }),
  )
  expect(s).toBe(
    "The median X2 location in April for Current Operations under the Historical hydroclimate is 74.0 km. The median April X2 location for the Winter-run refuge flows scenario is 76.0 km: a difference of +3%.",
  )
})

test("total Delta exports sentence follows the n150 template", () => {
  const s = summarySentence(
    [
      member("Current Operations", [4000, 4800, 5600], true),
      member("Winter-run refuge flows", [3000, 3600, 4200]),
    ],
    templateCtx({
      variableId: "tot_exp",
      variableName: "Total Delta exports",
      proseName: "Delta exports",
      locationName: "Delta (NDO node)",
      locationTitleName: "Delta (NDO node)",
    }),
  )
  expect(s).toBe(
    "For Current Operations under the Historical hydroclimate, median Delta exports is 4,800 TAF. For the Winter-run refuge flows scenario, median Delta exports is 3,600 TAF, a difference of -25%.",
  )
})

test("template sentences skip and name a member with no model results", () => {
  const s = summarySentence(
    [
      member("Current Operations", [10, 20, 30], true),
      {
        ...member("Delta Conveyance Project", [99, 99, 99]),
        liveDataMissing: true,
      },
    ],
    templateCtx({
      variableId: "res_apr",
      variableName: "April reservoir storage",
      proseName: "April reservoir storage",
    }),
  )
  expect(s).toBe(
    "At Shasta Reservoir, median April reservoir storage for Current Operations under the Historical hydroclimate is 20.0 TAF; no data available for Delta Conveyance Project.",
  )
})

test("other variables keep the generic sentence with the prose name", () => {
  const s = summarySentence(
    [
      member("Current Operations", [10, 20, 30], true),
      member("Other", [20, 40, 60]),
    ],
    templateCtx({
      variableId: "riv_flow",
      variableName: "River flows",
      proseName: "river flows",
      locationName: "Yuba River",
      locationTitleName: "Yuba River",
    }),
  )
  expect(s).toBe(
    "At Yuba River under the Historical hydroclimate, median river flows for Current Operations (the reference) is 20.0 TAF; relative to it: Other +100%.",
  )
})

// The surface water delivery shortage is zero in most years at the
// aggregates (percent of demand met is 100), so it reads by the same
// zero-aware sentence as welfare loss, with "shortage" as the noun and the
// percent unit.
test("surface water delivery shortage sentence reports the no-shortage year count and the mean", () => {
  const ref = member("Current Operations", [0, 0, 0, 4], true) // mean 1
  const other = member("Winter-run refuge flows", [0, 0, 8, 8]) // mean 4
  const s = summarySentence([ref, other], {
    view: "dist",
    distKind: "exceedance",
    compareBy: "scenarios",
    variableName: "Surface water delivery shortages",
    variableId: "cws_del_short",
    proseName: "surface water delivery shortage",
    unit: "%",
    locationName: "All North of Delta",
    climateName: "Historical",
    scenarioName: "Current Operations",
  })
  expect(s).toBe(
    "At All North of Delta under the Historical hydroclimate, Current Operations has no surface water delivery shortage in 3 of 4 years and a mean annual shortage of 1.0 %; Winter-run refuge flows has no shortage in 2 of 4 years and a mean annual shortage of 4.0 % (+300%).",
  )
})
