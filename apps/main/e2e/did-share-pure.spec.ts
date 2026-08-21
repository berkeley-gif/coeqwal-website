import { test, expect } from "@playwright/test"
import {
  toBars,
  toBoxes,
  toSeries,
  type MarkMember,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/explorer/chartMarks"
import {
  dataInDepthToCSV,
  type DataChartDataShape,
} from "../app/features/scenarioExplorer/explorer/share/export/csv/dataCsv"

// Pure logic behind the data-in-depth share variant: the chart-mark builders
// shared by ChartCard and the off-screen capture, and the CSV body builder.
// Node-side spec (no browser), runs in the e2e-core CI job.

const member = (over: Partial<MarkMember> = {}): MarkMember => ({
  id: "SHSTA",
  label: "Shasta",
  series: [10, 30, 20],
  stats: {
    min: 10,
    p10: 12,
    p25: 15,
    p50: 20,
    p75: 25,
    p90: 28,
    max: 30,
    mean: 20,
    cv: 0.5,
  },
  value: 0.5,
  ...over,
})

test("toBars maps members to categorical bars with aligned colors", () => {
  const bars = toBars(
    [member(), member({ id: "OROVL", label: "Oroville", value: 0.7 })],
    ["#111111", "#222222"],
  )
  expect(bars).toEqual([
    { id: "SHSTA", label: "Shasta", value: 0.5, color: "#111111" },
    { id: "OROVL", label: "Oroville", value: 0.7, color: "#222222" },
  ])
})

test("toBoxes maps stats onto BoxPlot datum shape", () => {
  const boxes = toBoxes([member()], ["#111111"])
  expect(boxes).toEqual([
    {
      id: "SHSTA",
      label: "Shasta",
      color: "#111111",
      stats: {
        min: 10,
        q1: 15,
        median: 20,
        q3: 25,
        max: 30,
        mean: 20,
        p10: 12,
        p90: 28,
      },
    },
  ])
})

test("toSeries builds descending exceedance points", () => {
  const series = toSeries([member()], ["#111111"])
  expect(series).toHaveLength(1)
  const s = series[0]!
  expect(s.id).toBe("SHSTA")
  expect(s.color).toBe("#111111")
  expect(s.points.map((p) => p.value)).toEqual([30, 20, 10])
  expect(s.points[0]!.probability).toBeCloseTo(0.5 / 3)
})

const csvData = (
  over: Partial<DataChartDataShape> = {},
): DataChartDataShape => ({
  kind: "data",
  variableName: "Reservoir storage (April)",
  viewLabel: "Annual distribution",
  compareByLabel: "Scenarios",
  unitLabel: "TAF",
  source: "live",
  members: [
    {
      label: "Current Operations",
      series: [4200, 3100],
      waterYears: [1921, 1922],
      isLive: true,
      stats: {
        min: 3100,
        p10: 3210,
        p25: 3375,
        p50: 3650,
        p75: 3925,
        p90: 4090,
        max: 4200,
        // Mean deliberately differs from the median so a Mean/Median column
        // swap in the builder cannot pass this suite.
        mean: 3660,
        cv: 0.15,
      },
      value: 0.15,
    },
  ],
  ...over,
})

test("dataInDepthToCSV emits header, stats block, and year-labeled series", () => {
  const csv = dataInDepthToCSV(csvData(), {
    variantTitle: "Data in depth",
    hydroclimate: "historical",
  })
  expect(csv).not.toBeNull()
  const lines = csv!.split("\n")
  expect(lines[0]).toBe("Coeqwal export,Data in depth")
  expect(csv).toContain("Variable,Reservoir storage (April)")
  expect(csv).toContain("Data source,Live data")
  expect(csv).toContain("Member,Mean,CV,Min,P10,P25,Median,P75,P90,Max,Source")
  expect(csv).toContain(
    "Current Operations,3660,0.15,3100,3210,3375,3650,3925,4090,4200,Live",
  )
  expect(csv).toContain("Water year,Current Operations")
  expect(csv).toContain("1921,4200")
  expect(csv).toContain("1922,3100")
})

test("dataInDepthToCSV records an active water-year-type filter in the header", () => {
  const filtered = dataInDepthToCSV(
    csvData({ waterYearTypesLabel: "Dry; Critical" }),
    { variantTitle: "Data in depth" },
  )
  expect(filtered).toContain("Water year types,Dry; Critical")
  const unfiltered = dataInDepthToCSV(csvData(), {
    variantTitle: "Data in depth",
  })
  expect(unfiltered).not.toContain("Water year types")
})

test("dataInDepthToCSV pivots divergent live year sets onto a year union with blanks", () => {
  // Two live members whose surviving year sets differ (the wyt filter
  // classifies per scenario, so this happens on real data). Rows must be
  // labeled by the union of years with blanks where a member lacks a year,
  // never by raw array index against the first member's years.
  const stats = csvData().members[0]!.stats
  const csv = dataInDepthToCSV(
    csvData({
      members: [
        {
          label: "A",
          series: [10, 20, 30],
          waterYears: [1921, 1922, 1923],
          isLive: true,
          stats,
          value: 0.1,
        },
        {
          label: "B",
          series: [22, 33, 44],
          waterYears: [1922, 1923, 1924],
          isLive: true,
          stats,
          value: 0.2,
        },
      ],
    }),
    { variantTitle: "Data in depth" },
  )
  expect(csv).toContain("Water year,A,B")
  expect(csv).toContain("1921,10,")
  expect(csv).toContain("1922,20,22")
  expect(csv).toContain("1923,30,33")
  expect(csv).toContain("1924,,44")
})

test("dataInDepthToCSV labels per-member provenance in the stats table", () => {
  const stats = csvData().members[0]!.stats
  const csv = dataInDepthToCSV(
    csvData({
      members: [
        {
          label: "Live one",
          series: [1],
          waterYears: [1921],
          isLive: true,
          stats,
          value: 0.1,
        },
        { label: "Mock one", series: [2], stats, value: 0.2 },
      ],
    }),
    { variantTitle: "Data in depth" },
  )
  expect(csv).toContain(
    "Live one,3660,0.15,3100,3210,3375,3650,3925,4090,4200,Live",
  )
  expect(csv).toContain(
    "Mock one,3660,0.15,3100,3210,3375,3650,3925,4090,4200,Sample",
  )
  // Mixed year coverage: fall back to index labels, never member 0's years.
  expect(csv).toContain("Year index,Live one,Mock one")
})

test("dataInDepthToCSV falls back to year index labels without waterYears", () => {
  const csv = dataInDepthToCSV(
    csvData({
      source: "mock",
      members: [
        {
          label: "A, with comma",
          series: [1, 2],
          stats: {
            min: 1,
            p10: 1,
            p25: 1,
            p50: 1.5,
            p75: 2,
            p90: 2,
            max: 2,
            mean: 1.5,
            cv: 0.3,
          },
          value: 0.3,
        },
      ],
    }),
    { variantTitle: "Data in depth" },
  )
  expect(csv).toContain("Data source,Sample data")
  expect(csv).toContain('Year index,"A, with comma"')
  expect(csv).toContain("1,1")
  expect(csv).toContain("2,2")
})

test("dataInDepthToCSV returns null with no members", () => {
  expect(
    dataInDepthToCSV(csvData({ members: [] }), {
      variantTitle: "Data in depth",
    }),
  ).toBeNull()
})

test("a mixed-provenance export labels the figure Mixed and blanks the no-data row", () => {
  // A figure whose series do not share one provenance must not claim one, and
  // the member the model has no results for must export as a labeled, EMPTY
  // row. The sample engine always produces a series, so writing its numbers
  // here would hand the reader fabricated values under a live-looking export.
  const csv = dataInDepthToCSV(
    csvData({
      source: "mixed",
      members: [
        ...csvData().members,
        {
          label: "DWR 2025 DCP",
          series: [],
          waterYears: [],
          isLive: false,
          liveDataMissing: true,
          stats: {
            min: 0,
            p10: 0,
            p25: 0,
            p50: 0.55,
            p75: 0,
            p90: 0,
            max: 0,
            mean: 0.55,
            cv: 0,
          },
          value: 0.55,
        },
      ],
    }),
    { variantTitle: "Data in depth" },
  )
  expect(csv).toContain("Data source,Mixed (see the Source column)")
  expect(csv).toContain("DWR 2025 DCP,,,,,,,,,,No data")
  // The sample engine's stand-in values appear nowhere in the export.
  expect(csv).not.toContain("0.55")
  // The served member keeps its year-labeled rows: the empty member carries
  // an empty year array rather than an absent one, so the export does not
  // fall back to an index axis for everyone.
  expect(csv).toContain("Water year,Current Operations,DWR 2025 DCP")
  expect(csv).toContain("1921,4200,")
})
