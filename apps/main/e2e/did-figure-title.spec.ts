import { test, expect } from "@playwright/test"
import { buildFigureTitle } from "../app/features/scenarioExplorer/explorer/share/figureTitle"
import { getLocationTitle } from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/variableRegistry"

// Standardized figure titles: every generated figure carries a descriptive
// title of the form "<Variable> (<Location>), <Scenario context>,
// <Hydroclimate>, <Water years>". The builder is pure and tool-agnostic so
// other explorer tools can adopt the same format for their exports.

test("buildFigureTitle matches the standardized format", () => {
  expect(
    buildFigureTitle({
      variableName: "April reservoir storage",
      locationName: "Shasta Reservoir",
      memberSummary: "Current ops",
      hydroclimateName: "Historical hydroclimate",
      waterYearTypeLabels: [],
    }),
  ).toBe(
    "April Reservoir Storage (Shasta Reservoir), Current Ops, Historical Hydroclimate, All Water Years",
  )
})

test("buildFigureTitle keeps minor words lowercase and lists WYT classes", () => {
  expect(
    buildFigureTitle({
      variableName: "Outflow as % of unimpaired flow",
      memberSummary: "3 scenarios",
      hydroclimateName: "Historical hydroclimate",
      waterYearTypeLabels: ["Dry", "Critical"],
    }),
  ).toBe(
    "Outflow as % of Unimpaired Flow, 3 Scenarios, Historical Hydroclimate, Dry and Critical Water Years",
  )
})

test("buildFigureTitle omits absent parts without dangling separators", () => {
  expect(
    buildFigureTitle({
      variableName: "Delta outflow volume",
      memberSummary: "2 climate futures",
      waterYearTypeLabels: ["Wet", "Above normal", "Dry"],
    }),
  ).toBe(
    "Delta Outflow Volume, 2 Climate Futures, Wet, Above Normal and Dry Water Years",
  )
})

test("getLocationTitle appends the group's title suffix", () => {
  expect(getLocationTitle("reservoirs", "SHSTA")).toBe("Shasta Reservoir")
  expect(getLocationTitle("basins", "WBA10")).toBe("WBA10 Basin")
  // Groups whose names already read as full titles get no suffix.
  expect(getLocationTitle("rivers", "YRS")).toBe("Yuba River")
  // Aggregate rollups already read as full titles too: "All North of Delta
  // Basin" would be wrong, and the NOD total is now the default groundwater
  // location, so this is the default figure title.
  expect(getLocationTitle("basins", "AGG_GW_NOD")).toBe("All North of Delta")
  expect(getLocationTitle("reservoirs", "AGG_NOD")).toBe("All North-of-Delta")
})

test("null water-year labels omit the clause entirely (WYT-excluded variables)", () => {
  expect(
    buildFigureTitle({
      variableName: "winter-run abundance",
      memberSummary: "3 scenarios",
      hydroclimateName: "Historical hydroclimate",
      waterYearTypeLabels: null,
    }),
  ).toBe("Winter-run Abundance, 3 Scenarios, Historical Hydroclimate")
})
