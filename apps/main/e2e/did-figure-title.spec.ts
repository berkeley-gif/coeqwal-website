import { test, expect } from "@playwright/test"
import { buildFigureTitle } from "../app/features/scenarioExplorer/explorer/share/figureTitle"
import {
  getLocationTitle,
  getVariable,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/variableRegistry"
import { dataFigureTitle } from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/hooks/interpretiveText"

// Standardized figure titles: every generated figure carries a descriptive
// title of the form "<Variable> (<Location>), <Scenario context>,
// <Hydroclimate>, <Water years>". The builder is pure and tool-agnostic so
// other explorer tools can adopt the same format for their exports.

test("buildFigureTitle matches the standardized format", () => {
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
      memberSummary: "2 hydroclimates",
      waterYearTypeLabels: ["Wet", "Above normal", "Dry"],
    }),
  ).toBe(
    "Delta Outflow Volume, 2 Hydroclimates, Wet, Above Normal and Dry Water Years",
  )
})

test("getLocationTitle appends the group's title suffix", () => {
  expect(getLocationTitle("reservoirs", "SHSTA")).toBe("Shasta Reservoir")
  // Basins set no suffix: the descriptive "CODE - description" names read
  // as full titles, and "Basin" would dangle after the place names.
  expect(getLocationTitle("basins", "WBA10")).toBe("WBA10 - Chico; Durham")
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

// Ted's n71: the X2 figure title drops the "(Delta (NDO Node))" parenthetical
// and reads "April X2 position (in km), <#> Scenarios, <Hydroclimate>, <Water
// Year selection>". The registry carries the head verbatim; every other
// variable keeps the standard "<Variable> (<Location>)" head.

test("dataFigureTitle uses the registry head for X2 and omits the location", () => {
  expect(
    dataFigureTitle({
      variableName: "April X2 position",
      figureTitleHead: getVariable("x2_apr")?.figureTitleHead,
      compareBy: "scenarios",
      memberCount: 2,
      firstMemberLabel: "Current operations",
      locationTitleName: getLocationTitle("delta", "DELTA"),
      climateName: "Historical",
      scenarioName: "Current operations",
      waterYearTypeLabels: [],
    }),
  ).toBe(
    "April X2 Position (in km), 2 Scenarios, Historical Hydroclimate, All Water Years",
  )
})

test("dataFigureTitle keeps the standard head for other variables", () => {
  expect(
    dataFigureTitle({
      variableName: "April reservoir storage",
      figureTitleHead: getVariable("res_apr")?.figureTitleHead,
      compareBy: "scenarios",
      memberCount: 1,
      firstMemberLabel: "Current operations",
      locationTitleName: getLocationTitle("reservoirs", "SHSTA"),
      climateName: "Historical",
      scenarioName: "Current operations",
      waterYearTypeLabels: [],
    }),
  ).toBe(
    "April Reservoir Storage (Shasta Reservoir), Current Operations, Historical Hydroclimate, All Water Years",
  )
  expect(
    dataFigureTitle({
      variableName: "Total Delta exports",
      figureTitleHead: getVariable("tot_exp")?.figureTitleHead,
      compareBy: "scenarios",
      memberCount: 2,
      firstMemberLabel: "Current operations",
      locationTitleName: getLocationTitle("delta", "DELTA"),
      climateName: "Historical",
      scenarioName: "Current operations",
      waterYearTypeLabels: [],
    }),
  ).toBe(
    "Total Delta Exports (Delta (NDO Node)), 2 Scenarios, Historical Hydroclimate, All Water Years",
  )
})
