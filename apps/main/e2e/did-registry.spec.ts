import { test, expect } from "@playwright/test"
import {
  SECTORS,
  VARIABLES,
  LOCATION_GROUPS,
  getVariable,
  DEFAULT_VARIABLE_ID,
  type VariableView,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/variableRegistry"
import { mergeDataInitialState } from "../app/features/scenarioExplorer/explorer/store/exploreSessionPersist"

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
