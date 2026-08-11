import { test, expect } from "@playwright/test"
import {
  SECTORS,
  VARIABLES,
  LOCATION_GROUPS,
  getVariable,
  getLocation,
  DEFAULT_VARIABLE_ID,
  type VariableView,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/variableRegistry"
import { mergeDataInitialState } from "../app/features/scenarioExplorer/explorer/store/exploreSessionPersist"
import { gwLevelFromStorage } from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/mockDataEngine"

// Registry contract for the Data in Depth content edits (2026-07-30 review):
// station salinity retired, the year-to-year variability view withdrawn in
// favor of the Stats view, reservoir distribution labeled by quantity, and
// session restore healing ids/views that no longer exist so a stale persisted
// session cannot render a ghost view. Node-side spec, runs in e2e-core.

test("station salinity (EC) is retired from the registry", () => {
  expect(VARIABLES.station_ec).toBeUndefined()
  const salin = SECTORS.find((s) => s.id === "salin")
  expect(salin?.variables).toEqual(["x2_apr", "x2_sep"])
  expect("stations" in LOCATION_GROUPS).toBe(false)
})

test("no variable offers the year-to-year variability view", () => {
  for (const v of Object.values(VARIABLES)) {
    expect(v.views).not.toContain("cv")
  }
})

test("reservoir storage labels its annual distribution as Volume (TAF)", () => {
  expect(getVariable("res_apr")?.viewLabels?.dist).toBe("Volume (TAF)")
  expect(getVariable("res_sep")?.viewLabels?.dist).toBe("Volume (TAF)")
})

test("groundwater storage is a single variable with volume and level views", () => {
  const gw = SECTORS.find((s) => s.id === "gw")
  expect(gw?.variables).toEqual(["gw_stor"])
  expect(VARIABLES.gw_vol).toBeUndefined()
  expect(VARIABLES.gw_trend).toBeUndefined()
  const v = getVariable("gw_stor")
  expect(v?.name).toBe("Groundwater storage")
  expect(v?.views).toEqual(["dist", "level"])
  expect(v?.viewLabels?.dist).toBe("Volume (TAF)")
  expect(v?.viewLabels?.level).toBe("Level (ft)")
  expect(v?.viewUnits?.level).toEqual({ unit: "ft", unitLabel: "feet" })
})

test("gwLevelFromStorage derives a declining feet-scale sample series", () => {
  const location = getLocation("basins", "COL")
  expect(location?.mockBase).toBeTruthy()
  const storage = Array.from({ length: 100 }, () => location!.mockBase!)
  const level = gwLevelFromStorage(storage, location!)
  expect(level).toHaveLength(100)
  // Feet scale (hundreds), not the TAF scale of the storage series.
  expect(Math.max(...level)).toBeLessThan(1000)
  expect(Math.min(...level)).toBeGreaterThan(0)
  // Constant storage still declines slowly (long-run aquifer drawdown), so
  // the Stats view's trend has signal even in sample data.
  expect(level[99]!).toBeLessThan(level[0]!)
})

test("mergeDataInitialState heals retired variable ids and views", () => {
  const healedVar = mergeDataInitialState({ selectedVariableId: "station_ec" })
  expect(healedVar.selectedVariableId).toBe(DEFAULT_VARIABLE_ID)
  expect(healedVar.view).toBe("dist")

  const healedView = mergeDataInitialState({
    selectedVariableId: "res_apr",
    view: "cv" as VariableView,
  })
  expect(healedView.view).toBe("dist")

  const kept = mergeDataInitialState({
    selectedVariableId: "res_apr",
    view: "pct" as VariableView,
  })
  expect(kept.selectedVariableId).toBe("res_apr")
  expect(kept.view).toBe("pct")
})

test("mergeDataInitialState heals legacy multi-class WYT selections", () => {
  // The filter is single-select; a persisted multi-class selection from an
  // older session resets to all years rather than silently picking one.
  const healed = mergeDataInitialState({ selectedWaterYearTypes: [1, 4] })
  expect(healed.selectedWaterYearTypes).toEqual([])
  const single = mergeDataInitialState({ selectedWaterYearTypes: [5] })
  expect(single.selectedWaterYearTypes).toEqual([5])
})
