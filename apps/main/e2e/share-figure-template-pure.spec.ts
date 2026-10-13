import { test, expect } from "@playwright/test"
import {
  buildFigureTemplate,
  FIGURE_ROW_LABELS,
} from "../app/features/scenarioExplorer/explorer/share/figureTemplate"
import {
  dataFigureSpec,
  dataChartKindLabel,
} from "../app/features/scenarioExplorer/explorer/share/dataFigureSpec"
import {
  buildFigureTitle,
  waterYearsPhrase,
} from "../app/features/scenarioExplorer/explorer/share/figureTitle"

// The standardized figure-export template: held dimensions in a table, the
// compared dimension heads the legend. Node-side spec.

test("rows follow the fixed order and skip the compared dimension", () => {
  const t = buildFigureTemplate({
    toolLabel: "Data in depth",
    chartKindLabel: "Box plot",
    values: {
      waterYears: "Dry Water Years",
      variable: "April Reservoir Storage (TAF)",
      hydroclimate: "Historical",
      strategy: "Current Operations",
      location: "Oroville Reservoir",
    },
    compared: "hydroclimate",
  })
  expect(t.rows.map((r) => r.label)).toEqual([
    "Variable",
    "Location",
    "Strategy",
    "Water years",
  ])
  expect(t.legendHeading).toBe("Hydroclimate")
})

test("blank values are dropped and an explicit legend heading wins", () => {
  const t = buildFigureTemplate({
    toolLabel: "Map",
    chartKindLabel: "Bar tool",
    values: { outcome: "Reservoir storage", strategy: "  ", hydroclimate: "" },
    legendHeading: "Tier",
  })
  expect(t.rows).toEqual([
    {
      key: "outcome",
      label: FIGURE_ROW_LABELS.outcome,
      value: "Reservoir storage",
    },
  ])
  expect(t.legendHeading).toBe("Tier")
})

test("no compared dimension and no heading means no legend heading", () => {
  const t = buildFigureTemplate({
    toolLabel: "X",
    chartKindLabel: "Y",
    values: { variable: "V" },
  })
  expect(t.legendHeading).toBeNull()
})

test("water-years phrase", () => {
  expect(waterYearsPhrase([])).toBe("All Water Years")
  expect(waterYearsPhrase(["Dry"])).toBe("Dry Water Years")
  expect(waterYearsPhrase(["Dry", "Critical"])).toBe(
    "Dry and Critical Water Years",
  )
  expect(waterYearsPhrase(["Below normal"])).toBe("Below Normal Water Years")
  expect(waterYearsPhrase(null)).toBeUndefined()
})

test("the refactor leaves standardized titles unchanged", () => {
  expect(
    buildFigureTitle({
      variableName: "April reservoir storage",
      locationName: "Shasta Reservoir",
      memberSummary: "Current operations",
      hydroclimateName: "Historical hydroclimate",
      waterYearTypeLabels: [],
    }),
  ).toBe(
    "April Reservoir Storage (Shasta Reservoir), Current Operations, Historical Hydroclimate, All Water Years",
  )
  expect(
    buildFigureTitle({
      variableName: "Salmon abundance",
      memberSummary: "3 scenarios",
      hydroclimateName: "Historical hydroclimate",
      waterYearTypeLabels: null,
    }),
  ).toBe("Salmon Abundance, 3 Scenarios, Historical Hydroclimate")
})

test("data in depth: compare by scenarios (exceedance mockup)", () => {
  const spec = dataFigureSpec({
    variableName: "September reservoir storage",
    unit: "TAF",
    compareBy: "scenarios",
    locationName: "Shasta Reservoir",
    scenarioName: "Current operations",
    climateName: "Historical",
    waterYearTypeLabels: [],
    chartKindLabel: "Exceedance plot",
  })
  const t = buildFigureTemplate(spec)
  expect(t.toolLabel).toBe("Data in depth")
  expect(t.chartKindLabel).toBe("Exceedance plot")
  expect(t.rows).toEqual([
    {
      key: "variable",
      label: "Variable",
      value: "September Reservoir Storage (TAF)",
    },
    { key: "location", label: "Location", value: "Shasta Reservoir" },
    { key: "hydroclimate", label: "Hydroclimate", value: "Historical" },
    { key: "waterYears", label: "Water years", value: "All Water Years" },
  ])
  expect(t.legendHeading).toBe("Strategy")
})

test("data in depth: compare by locations holds strategy and hydroclimate", () => {
  const t = buildFigureTemplate(
    dataFigureSpec({
      variableName: "April reservoir storage",
      unit: "TAF",
      compareBy: "locations",
      locationName: "",
      scenarioName: "Current operations",
      climateName: "Historical",
      waterYearTypeLabels: ["Dry"],
      chartKindLabel: "Box plot",
    }),
  )
  expect(t.rows.map((r) => r.value)).toEqual([
    "April Reservoir Storage (TAF)",
    "Current Operations",
    "Historical",
    "Dry Water Years",
  ])
  expect(t.legendHeading).toBe("Location")
})

test("data in depth: verbatim head, no unit, and non-applicable water years", () => {
  const t = buildFigureTemplate(
    dataFigureSpec({
      variableName: "April X2 position",
      figureTitleHead: "April X2 Position (in km)",
      unit: "km",
      compareBy: "scenarios",
      locationName: "",
      scenarioName: "Current operations",
      climateName: "Historical",
      waterYearTypeLabels: null,
      chartKindLabel: "Box plot",
    }),
  )
  expect(t.rows[0]?.value).toBe("April X2 Position (in km)")
  expect(t.rows.find((r) => r.key === "waterYears")).toBeUndefined()

  const plain = buildFigureTemplate(
    dataFigureSpec({
      variableName: "Salmon abundance",
      unit: "",
      compareBy: "scenarios",
      locationName: "",
      scenarioName: "Current operations",
      climateName: "Historical",
      waterYearTypeLabels: null,
      chartKindLabel: "Value",
    }),
  )
  expect(plain.rows[0]?.value).toBe("Salmon Abundance")
})

test("chart kind labels", () => {
  // The plain distribution view is named by its style alone; the other
  // distribution views keep their view label, which the variable row's
  // unit does not carry ("%" could be of capacity or of demand).
  expect(dataChartKindLabel("dist", "box", "Volume (TAF)")).toBe("Box plot")
  expect(dataChartKindLabel("pct", "exceedance", "% of capacity")).toBe(
    "Exceedance plot, % of capacity",
  )
  expect(dataChartKindLabel("pct_demand", "box", "% of demand")).toBe(
    "Box plot, % of demand",
  )
  expect(dataChartKindLabel("level", "stats", "Level (ft)")).toBe(
    "Stats plot, Level (ft)",
  )
  expect(dataChartKindLabel("monthly", "box", "Monthly")).toBe("Monthly")
  // An unknown style falls back to the view label rather than inventing one.
  expect(dataChartKindLabel("dist", "other", "Volume (TAF)")).toBe(
    "Volume (TAF)",
  )
})
