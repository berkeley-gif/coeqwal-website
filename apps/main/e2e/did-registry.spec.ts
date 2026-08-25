import { test, expect } from "@playwright/test"
import {
  SECTORS,
  VARIABLES,
  LOCATION_GROUPS,
  getVariable,
  getLocation,
  DEFAULT_VARIABLE_ID,
  resolveFoldedVariable,
  keyOutcomeChipText,
  carryLocationSelection,
  RETIRED_VARIABLE_IDS,
  type VariableView,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/variableRegistry"
import { mergeDataInitialState } from "../app/features/scenarioExplorer/explorer/store/exploreSessionPersist"
import {
  gwLevelFromStorage,
  mockAnnualSeries,
  shortagePctOfDemand,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/mockDataEngine"
import {
  didDomainForVariable,
  toDidSubject,
  GW_BASIN_SUBJECTS,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/didMapping"
import {
  AG_ENTITY_LOCATIONS,
  CWS_DELIVERY_ENTITY_LOCATIONS,
  CWS_SHORTAGE_ENTITY_LOCATIONS,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/entityLocations.generated"

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

// Groundwater location list (2026-08 confirmation): the two NOD/SOD summary
// totals lead, then all 42 served basins (41 WBA technical codes plus the
// Delta-Eastside Water entity). Each WBA labels as "CODE - description"
// using the CalSim3 hydrology-report descriptions the endpoint serves; the
// Delta-Eastside entity keeps its more specific local name (the endpoint
// labels it just "Delta"). The old eight regional-looking sample
// placeholders are retired.

test("groundwater basins list the served 42 after the NOD/SOD totals", () => {
  const items = LOCATION_GROUPS.basins.items
  expect(items[0]?.id).toBe("AGG_GW_NOD")
  expect(items[1]?.id).toBe("AGG_GW_SOD")
  expect(items[2]?.id).toBe("DETAW")
  expect(items).toHaveLength(44)
  // Codes sort naturally (WBA2 before WBA10), N before S within a number.
  expect(items[3]?.id).toBe("WBA2")
  expect(items[items.length - 1]?.id).toBe("WBA90")
  // Every WBA label leads with its technical code (keeps the dropdown in
  // code order and the code findable across the other explore tools) and
  // carries a served description after it.
  for (const item of items) {
    if (item.id.startsWith("WBA")) {
      expect(item.name.startsWith(`${item.id} - `)).toBe(true)
      expect(item.name.length).toBeGreaterThan(item.id.length + 3)
    }
  }
  expect(getLocation("basins", "WBA8S")?.name).toBe(
    "WBA8S - Williams; South Glenn-Colusa",
  )
  expect(getLocation("basins", "WBA73")?.name).toBe(
    "WBA73 - Lower Delta-Mendota Canal; Joint Reach of the California Aqueduct",
  )
  expect(getLocation("basins", "DETAW")?.name).toBe("Delta-Eastside Water")
  // With descriptive names the "Basin" title suffix is redundant (chart
  // titles read "... (WBA10 - Chico; Durham)"), so the group sets none.
  expect(LOCATION_GROUPS.basins.titleSuffix).toBeUndefined()
  // Every retired sample placeholder is gone.
  for (const retired of [
    "COL",
    "SUT",
    "YOL",
    "AMR",
    "ESJ",
    "MOD",
    "TUR",
    "MER",
  ]) {
    expect(getLocation("basins", retired)).toBeUndefined()
  }
})

test("mergeDataInitialState heals location pins the registry no longer offers", () => {
  // Location lists can change between deploys (the groundwater basins moved
  // from sample placeholders to served codes), and both location fields are
  // persisted, so stale ids must heal at hydration: a returning session must
  // not keep a pin that now renders sample data under a blank location.
  const healed = mergeDataInitialState({
    pinnedLocationByGroup: { basins: "COL", reservoirs: "SHSTA" },
    selectedLocationsByGroup: { basins: ["COL", "WBA10"], rivers: ["SAC049"] },
  })
  // A stale pin resets to the group's first location; valid pins survive.
  expect(healed.pinnedLocationByGroup.basins).toBe("AGG_GW_NOD")
  expect(healed.pinnedLocationByGroup.reservoirs).toBe("SHSTA")
  // Stale multi-select ids are pruned; valid ones survive.
  expect(healed.selectedLocationsByGroup.basins).toEqual(["WBA10"])
  expect(healed.selectedLocationsByGroup.rivers).toEqual(["SAC049"])
  // Groups the registry no longer offers are dropped entirely.
  const unknownGroup = mergeDataInitialState({
    pinnedLocationByGroup: { stations: "S1" },
  })
  expect("stations" in unknownGroup.pinnedLocationByGroup).toBe(false)
  // Location healing applies even when the variable id also needs healing.
  const both = mergeDataInitialState({
    selectedVariableId: "riv_uif",
    pinnedLocationByGroup: { basins: "COL" },
  })
  expect(both.selectedVariableId).toBe(DEFAULT_VARIABLE_ID)
  expect(both.pinnedLocationByGroup.basins).toBe("AGG_GW_NOD")
})

test("mergeDataInitialState survives malformed persisted location shapes", () => {
  // The persisted envelope validates the data SECTION as a record but not
  // its fields, so corrupted sessionStorage can deliver anything here;
  // hydration must fall back to defaults instead of throwing at startup.
  const nulled = mergeDataInitialState({
    pinnedLocationByGroup: null as never,
    selectedLocationsByGroup: "corrupt" as never,
  })
  expect(nulled.pinnedLocationByGroup.reservoirs).toBe("SHSTA")
  expect(nulled.selectedLocationsByGroup).toEqual({})
  // A non-array selection value for one group is dropped, not iterated.
  const scalar = mergeDataInitialState({
    selectedLocationsByGroup: { basins: "WBA10" as never },
  })
  expect(scalar.selectedLocationsByGroup.basins).toEqual([])
})

test("every basins location resolves through the gw mapping exactly once", () => {
  // The registry list and the mapping's served-subject allowlist are written
  // separately; this parity guard fails if either drifts (a basin added to
  // one list but not the other, a typo'd code, or a duplicate id).
  const items = LOCATION_GROUPS.basins.items
  const ids = items.map((l) => l.id)
  expect(new Set(ids).size).toBe(ids.length)
  for (const item of items) {
    const subject = toDidSubject("gw", item.id)
    expect
      .soft(subject, `basins location ${item.id} must resolve to a subject`)
      .not.toBeNull()
    if (!item.aggregate) {
      // Non-aggregate basins pass through by their own code.
      expect.soft(subject, `basin ${item.id} passes through`).toBe(item.id)
    }
  }
  // Bidirectional: the mapping's served set and the registry's non-aggregate
  // basins are the same SET, so an extra entry on either side fails too.
  const basinIds = items.filter((l) => !l.aggregate).map((l) => l.id)
  expect([...GW_BASIN_SUBJECTS].sort()).toEqual([...basinIds].sort())
})

test("gwLevelFromStorage derives a declining feet-scale sample series", () => {
  const location = getLocation("basins", "WBA10")
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

// Content decisions from the 2026-08 review round: Environmental Flows keeps
// a single variable, and winter-run abundance displays as the percent of
// suitable spawning habitat occupied rather than a raw model ratio.

test("flows as % of unimpaired is retired from the registry", () => {
  expect(VARIABLES.riv_uif).toBeUndefined()
  const eflows = SECTORS.find((s) => s.id === "eflows")
  expect(eflows?.variables).toEqual(["riv_flow"])
})

test("mergeDataInitialState heals a persisted riv_uif selection", () => {
  const healed = mergeDataInitialState({ selectedVariableId: "riv_uif" })
  expect(healed.selectedVariableId).toBe(DEFAULT_VARIABLE_ID)
  expect(healed.view).toBe("dist")
})

test("salmon abundance displays as proportion of spawning habitat occupied", () => {
  const v = getVariable("salmon_abund")
  expect(v?.name).toBe("Winter-run abundance")
  expect(v?.unit).toBe("proportion")
  expect(v?.unitLabel).toBe("proportion of spawning habitat occupied")
  expect(v?.axisLabel).toBe("Proportion of spawning habitat occupied")
  // The detailed reading of the metric lives in the card footer.
  expect(v?.footnote).toContain("averaged over three years")
  expect(v?.footnote).toContain("lower 20th percentile")
  // The above-1.0 sentence was removed at the science team's request; assert
  // it stays gone so a future caption edit cannot restore it silently.
  expect(v?.footnote).not.toContain("above 1.0")
  // The reintroduction (-R) scenarios are not served yet, so the chip
  // stays; a population average does not decompose by water-year type.
  expect(v?.provisional).toBe(true)
  expect(v?.wytApplicable).toBe(false)
})

test("salmon sample series generate in proportion display units", () => {
  // Sample series never scale, so a base left in percent units would plot
  // sample curves 100x above adopted live curves on the same axis.
  const s = mockAnnualSeries("salmon_abund", "s9999", "historical", "WRLCM")
  expect(s.length).toBeGreaterThan(0)
  expect(Math.max(...s)).toBeLessThan(3)
  expect(Math.max(...s)).toBeGreaterThan(0.05)
})

// Sector-specific system-delivery variables (2026-08 confirmation that they
// belong in the tool): CVP and SWP by use sector, per-project Delta exports,
// and the Southern San Joaquin routes.

test("system deliveries lists the sector-specific variables in display order", () => {
  const sysdel = SECTORS.find((s) => s.id === "sysdel")
  expect(sysdel?.variables).toEqual([
    "cvp_del",
    "cvp_ag",
    "cvp_mi",
    "cvp_refuges",
    "swp_del",
    "swp_ag",
    "swp_mi",
    "tot_exp",
    "cvp_exp",
    "swp_exp",
    "ssjv_exp",
  ])
})

test("single-total and multi-route variables use honest location groups", () => {
  // Refuges are served as a system total only: a dedicated single-location
  // group, not the regional group with sample-data fallbacks.
  expect(getVariable("cvp_refuges")?.locationGroup).toBe("syswide")
  expect(LOCATION_GROUPS.syswide.items.map((l) => l.id)).toEqual(["SYS"])
  // Per-project exports live at the single Delta location like tot_exp.
  expect(getVariable("cvp_exp")?.locationGroup).toBe("delta")
  expect(getVariable("swp_exp")?.locationGroup).toBe("delta")
  // Southern SJV exports: the client-side total leads, then the three
  // served routes (presentation confirmed; the chip retirement and the
  // total's fail-closed sum are covered in their own test below).
  expect(getVariable("ssjv_exp")?.locationGroup).toBe("ssjv")
  expect(LOCATION_GROUPS.ssjv.items.map((l) => l.id)).toEqual([
    "ALL_ROUTES",
    "CVC",
    "FRIANT",
    "KERN",
  ])
})

test("registry data flags agree with the live request mapping", () => {
  // One source of truth for what is live: a variable has a data: "live" flag
  // exactly when the mapping can build requests for it. Catches flags left
  // stale in either direction when a variable is wired or retired.
  for (const v of Object.values(VARIABLES)) {
    expect
      .soft(v.data === "live", `${v.id}: data flag vs live mapping`)
      .toBe(didDomainForVariable(v.id) != null)
  }
})

// Community water systems (2026-08-19): both CWS variables wire live on the
// served NOD_CWS/SOD_CWS aggregate subjects; the four illustrative sample
// groups are retired (their persisted ids heal), and Delivery shortages
// gains a served percent-of-demand view alongside the TAF volume view.

/** Shape every entity-bearing group must have: the two aggregates first,
 *  then entities that are regioned, uniquely identified, and named with
 *  their served code as the prefix. */
function expectEntityGroupShape(
  groupId: "agregions" | "cws" | "cwsShortage",
  aggregateIds: string[],
  entityCount: number,
) {
  const items = LOCATION_GROUPS[groupId].items
  expect(items.slice(0, aggregateIds.length).map((l) => l.id)).toEqual(
    aggregateIds,
  )
  expect(items.slice(0, aggregateIds.length).every((l) => l.aggregate)).toBe(
    true,
  )
  const entities = items.slice(aggregateIds.length)
  expect(entities).toHaveLength(entityCount)
  expect(new Set(items.map((l) => l.id)).size).toBe(items.length)
  for (const l of entities) {
    expect(l.aggregate, l.id).toBeFalsy()
    expect(["NOD", "SOD"], l.id).toContain(l.region)
    expect(l.name.startsWith(l.id), `${l.id} name ${l.name}`).toBe(true)
    expect(typeof l.apiLabel, l.id).toBe("string")
    expect(l.mockBase, l.id).toBeGreaterThan(0)
  }
  // North of Delta block precedes the South of Delta block.
  const regions = entities.map((l) => l.region)
  expect(regions.lastIndexOf("NOD")).toBeLessThan(regions.indexOf("SOD"))
}

test("community water systems list every served delivery system after the aggregates", () => {
  expectEntityGroupShape("cws", ["AGG_CWS_NOD", "AGG_CWS_SOD"], 74)
  expect(getLocation("cws", "AGG_CWS_NOD")?.name).toBe("All North of Delta")
  expect(getLocation("cws", "AGG_CWS_SOD")?.name).toBe("All South of Delta")
  expect(getLocation("cws", "MWD")?.name).toBe(
    "MWD - Metropolitan Water District of Southern California",
  )
  // A shortage-only system is not offered where only deliveries are served.
  expect(getLocation("cws", "02_NU")).toBeUndefined()
  for (const retired of ["CWS_SACU", "CWS_BAY", "CWS_CVS", "CWS_SOC"]) {
    expect(getLocation("cws", retired)).toBeUndefined()
  }
  const del = getVariable("cws_del")
  expect(del?.data).toBe("live")
  expect(del?.locationGroup).toBe("cws")
  expect(del?.views).toEqual(["dist"])
})

test("delivery shortages use the shortage-modeled system list, a separate group", () => {
  // Brian's ruling: the delivery set (74) and the shortage/welfare set (63)
  // overlap but are separate, so each variable binds to its own group and
  // the site never requests a subject the endpoint lacks for that measure.
  expectEntityGroupShape("cwsShortage", ["AGG_CWS_NOD", "AGG_CWS_SOD"], 63)
  expect(getLocation("cwsShortage", "02_NU")?.name).toBe(
    "02_NU - Anderson City of Anderson",
  )
  expect(getLocation("cwsShortage", "MWD")).toBeUndefined()
  // A system in both sets appears in both groups under the same id.
  expect(getLocation("cws", "26N_NU1")).toBeDefined()
  expect(getLocation("cwsShortage", "26N_NU1")).toBeDefined()
  const short = getVariable("cws_short")
  expect(short?.locationGroup).toBe("cwsShortage")
  expect(short?.data).toBe("live")
  expect(short?.views).toEqual(["dist", "pct_demand"])
  expect(short?.viewLabels?.dist).toBe("Shortage (TAF)")
  expect(short?.viewLabels?.pct_demand).toBe("% of demand")
  expect(short?.viewUnits?.pct_demand).toEqual({
    unit: "%",
    unitLabel: "percent of demand",
  })
  expect(short?.provisional).toBeUndefined()
})

test("CWS variables opt out of water-year-type filtering (calendar-year aggregation)", () => {
  expect(getVariable("cws_del")?.wytApplicable).toBe(false)
  expect(getVariable("cws_short")?.wytApplicable).toBe(false)
})

test("mergeDataInitialState heals retired CWS sample-group pins", () => {
  const healed = mergeDataInitialState({
    pinnedLocationByGroup: { cws: "CWS_SACU" },
    selectedLocationsByGroup: { cws: ["CWS_BAY", "AGG_CWS_SOD"] },
  })
  expect(healed.pinnedLocationByGroup.cws).toBe("AGG_CWS_NOD")
  expect(healed.selectedLocationsByGroup.cws).toEqual(["AGG_CWS_SOD"])
})

test("mergeDataInitialState heals a delivery-only system pinned in the shortage group", () => {
  const healed = mergeDataInitialState({
    pinnedLocationByGroup: { cwsShortage: "MWD" },
    selectedLocationsByGroup: { cwsShortage: ["MWD", "02_NU"] },
  })
  expect(healed.pinnedLocationByGroup.cwsShortage).toBe("AGG_CWS_NOD")
  expect(healed.selectedLocationsByGroup.cwsShortage).toEqual(["02_NU"])
})

test("shortage percent series derive from shortage over demand", () => {
  // pct = short / (short + delivered) x 100 per year, clamped to [0, 100];
  // a no-demand year (both series 0) renders 0, never NaN.
  expect(shortagePctOfDemand([10, 0, 5], [90, 100, 0])).toEqual([10, 0, 100])
  expect(shortagePctOfDemand([0], [0])).toEqual([0])
  // Mismatched lengths trim to the shorter series so years stay aligned.
  expect(shortagePctOfDemand([10, 10], [90])).toEqual([10])
  // The ag percent-of-demand view uses the same transform with net diversion
  // as the delivered term, for LIVE members as well as sample ones: the ag
  // endpoint serves no percent measure, so there is nothing to adopt.
  expect(shortagePctOfDemand([5], [0])).toEqual([100])
  expect(shortagePctOfDemand([25], [75])).toEqual([25])
})

// SSJV all-routes total (2026-08-19 team decision): the presentation is
// confirmed (chip retired) and a client-side total location leads the route
// list, summed fail-closed from the three served route series.

test("ssjv gains a leading all-routes total and sheds the provisional chip", () => {
  const items = LOCATION_GROUPS.ssjv.items
  expect(items.map((l) => l.id)).toEqual([
    "ALL_ROUTES",
    "CVC",
    "FRIANT",
    "KERN",
  ])
  const total = getLocation("ssjv", "ALL_ROUTES")
  expect(total?.name).toBe("All routes (total)")
  expect(total?.aggregate).toBe(true)
  // Sample magnitude matches the sum of the route sample magnitudes so
  // sample members stay internally consistent.
  expect(total?.mockBase).toBe(
    (getLocation("ssjv", "CVC")?.mockBase ?? 0) +
      (getLocation("ssjv", "FRIANT")?.mockBase ?? 0) +
      (getLocation("ssjv", "KERN")?.mockBase ?? 0),
  )
  expect(getVariable("ssjv_exp")?.provisional).toBeUndefined()
})

// Agriculture (2026-08-21): ag surface deliveries and groundwater pumping
// wire live on the served NOD_Agriculture/SOD_Agriculture aggregate subjects;
// the four illustrative demand-unit groups are retired and their persisted
// ids heal. Revenue stays sample: it is an external-model output, not a
// CalSim3 result, and is out of scope for this pass.

test("agriculture lists every served demand unit after the aggregates", () => {
  expectEntityGroupShape("agregions", ["AGG_AG_NOD", "AGG_AG_SOD"], 132)
  expect(getLocation("agregions", "08N_SA2")?.name).toBe(
    "08N_SA2 - Glenn-Colusa ID (55% of total)",
  )
  // Duplicate served labels ("Non-district" x22) stay distinguishable
  // because the code leads the name.
  expect(getLocation("agregions", "02_NA")?.name).toBe("02_NA - Non-district")
  expect(getLocation("agregions", "03_NA")?.name).toBe("03_NA - Non-district")
  expect(getLocation("agregions", "AGG_AG_NOD")?.name).toBe(
    "All North of Delta",
  )
  expect(getLocation("agregions", "AGG_AG_SOD")?.name).toBe(
    "All South of Delta",
  )
  for (const retired of ["AG_SAC", "AG_SJV", "AG_TUL", "AG_ALL"]) {
    expect(getLocation("agregions", retired)).toBeUndefined()
  }
  expect(getVariable("ag_del")?.data).toBe("live")
  expect(getVariable("ag_pump")?.data).toBe("live")
  // Revenue is an external-model output; it stays sample and provisional.
  expect(getVariable("ag_rev")?.data).toBe("mock")
})

test("ag shortage is one variable with a volume view and a percent view", () => {
  // The separate "Shortage as % of demand" variable is folded into a view of
  // the shortage variable, matching how community water systems present the
  // same pair. Two entries in one sector for one quantity read as two
  // metrics; they are one metric in two units.
  expect(getVariable("ag_shortpct")).toBeUndefined()
  const sector = SECTORS.find((s) => s.id === "ag")
  expect(sector?.variables).toEqual(["ag_del", "ag_pump", "ag_short", "ag_rev"])
  const short = getVariable("ag_short")
  expect(short?.data).toBe("live")
  expect(short?.views).toEqual(["dist", "pct_demand"])
  expect(short?.viewLabels?.dist).toBe("Shortage (TAF)")
  expect(short?.viewLabels?.pct_demand).toBe("% of demand")
  expect(short?.viewUnits?.pct_demand).toEqual({
    unit: "%",
    unitLabel: "percent of demand",
  })
  // Scope is settled now that the series is served, so the chip drops.
  expect(short?.provisional).toBeUndefined()
})

test("a share link for a folded variable id resolves to its replacement view", () => {
  // Share URLs carry a variable id AND a view, so folding one variable into a
  // view of another would strand every link minted before the fold. Generic
  // healing (fall back to the default variable) is right when content is
  // gone; a fold means the content still exists at a different address, and
  // the link should follow it. The share decode path applies this
  // unconditionally, so ids that were never folded must pass through.
  expect(resolveFoldedVariable("ag_shortpct", "dist")).toEqual({
    id: "ag_short",
    view: "pct_demand",
  })
  expect(resolveFoldedVariable("ag_short", "dist")).toEqual({
    id: "ag_short",
    view: "dist",
  })
  expect(resolveFoldedVariable("res_apr", "pct")).toEqual({
    id: "res_apr",
    view: "pct",
  })
})

test("mergeDataInitialState heals a persisted ag_shortpct selection", () => {
  // The retired variable id is generic-healed (no migration table), so a
  // session persisted before this change lands on the default variable
  // rather than a blank panel.
  const healed = mergeDataInitialState({ selectedVariableId: "ag_shortpct" })
  expect(healed.selectedVariableId).toBe(DEFAULT_VARIABLE_ID)
  expect(healed.view).toBe("dist")
})

test("mergeDataInitialState heals retired ag demand-unit-group pins", () => {
  const healed = mergeDataInitialState({
    pinnedLocationByGroup: { agregions: "AG_SAC" },
    selectedLocationsByGroup: { agregions: ["AG_TUL", "AGG_AG_SOD"] },
  })
  expect(healed.pinnedLocationByGroup.agregions).toBe("AGG_AG_NOD")
  expect(healed.selectedLocationsByGroup.agregions).toEqual(["AGG_AG_SOD"])
})

// Ted's Aug 23 board review (Data in Depth column), confirmed on the Aug 24
// call: the provisional "Outflow as % of unimpaired flow" variable is dropped
// outright (its unimpaired series exists only as a spreadsheet, never in the
// API), and the key-outcome chips are reworded. A retired id must heal
// deterministically wherever it can still arrive: a persisted session and a
// share-URL token both go through resolveFoldedVariable.

test("outflow as percent of unimpaired flow is retired from the registry", () => {
  expect(VARIABLES.ndo_uif).toBeUndefined()
  const outflow = SECTORS.find((s) => s.id === "outflow")
  expect(outflow?.variables).toEqual(["ndo"])
  expect(RETIRED_VARIABLE_IDS.has("ndo_uif")).toBe(true)
  for (const sector of SECTORS) {
    for (const id of sector.variables) {
      expect(getVariable(id), `sector ${sector.id} lists ${id}`).toBeDefined()
    }
  }
})

test("a retired variable id resolves to the default variable", () => {
  expect(resolveFoldedVariable("ndo_uif", "dist")).toEqual({
    id: DEFAULT_VARIABLE_ID,
    view: "dist",
  })
  // Unknown ids keep the existing behaviour: passed through unchanged, so
  // the caller's own fallback applies.
  expect(resolveFoldedVariable("no_such_variable", "dist")).toEqual({
    id: "no_such_variable",
    view: "dist",
  })
  const healed = mergeDataInitialState({
    selectedVariableId: "ndo_uif",
    view: "dist",
  })
  expect(healed.selectedVariableId).toBe(DEFAULT_VARIABLE_ID)
})

test("key-outcome chips read used or not used per Ted's board", () => {
  // April X2 keeps its tier metadata but reads "not used" (n64); September
  // X2 gets the same treatment; SWP M&I had no chip and gains a "not used"
  // one (n84).
  expect(getVariable("x2_apr")?.tierOutcome).toBe("FW_DELTA_USES")
  expect(getVariable("x2_apr")?.keyOutcomeChip).toBe("not-used")
  expect(getVariable("x2_sep")?.keyOutcomeChip).toBe("not-used")
  expect(getVariable("swp_mi")?.keyOutcomeChip).toBe("not-used")
  expect(keyOutcomeChipText(getVariable("x2_apr")!)).toBe(
    "not used in calculation of key outcome",
  )
  expect(keyOutcomeChipText(getVariable("swp_mi")!)).toBe(
    "not used in calculation of key outcome",
  )
  // Every other chip carries the same prefix (n54, n56, n58, n63 and the
  // consistency extension to the remaining chipped variables).
  expect(keyOutcomeChipText(getVariable("res_apr")!)).toBe(
    "used in calculation of key outcome: Reservoir storage",
  )
  expect(keyOutcomeChipText(getVariable("gw_stor")!)).toBe(
    "used in calculation of key outcome: Groundwater storage",
  )
  expect(keyOutcomeChipText(getVariable("ndo")!)).toBe(
    "used in calculation of key outcome: Delta estuary ecology",
  )
  expect(keyOutcomeChipText(getVariable("riv_flow")!)).toBe(
    "used in calculation of key outcome: Environmental flows",
  )
  // Variables with neither a tier outcome nor an explicit chip stay bare.
  expect(keyOutcomeChipText(getVariable("cvp_ag")!)).toBeNull()
  expect(keyOutcomeChipText(getVariable("salmon_abund")!)).toBeNull()
})

test("X2 carries the axis label and figure-title head Ted asked for", () => {
  expect(getVariable("x2_apr")?.axisLabel).toBe(
    "distance of X2 from Golden Gate (km)",
  )
  expect(getVariable("x2_sep")?.axisLabel).toBe(
    "distance of X2 from Golden Gate (km)",
  )
  expect(getVariable("x2_apr")?.figureTitleHead).toBe(
    "April X2 Position (in km)",
  )
  expect(getVariable("x2_sep")?.figureTitleHead).toBe(
    "September X2 Position (in km)",
  )
  // Only the X2 titles change; the outflow and export titles keep their
  // location parenthetical until Ted says otherwise.
  expect(getVariable("ndo")?.figureTitleHead).toBeUndefined()
  expect(getVariable("tot_exp")?.figureTitleHead).toBeUndefined()
})

// The entity lists are generated from the live API (scripts/did-entity-
// locations); the registry composes them after the hand-authored aggregates.
// These pins catch a regeneration that silently changed shape.
test("the generated entity lists carry the served counts and never collide with an aggregate id", () => {
  expect(AG_ENTITY_LOCATIONS).toHaveLength(132)
  expect(CWS_DELIVERY_ENTITY_LOCATIONS).toHaveLength(74)
  expect(CWS_SHORTAGE_ENTITY_LOCATIONS).toHaveLength(63)
  const aggregateIds = new Set(
    Object.values(LOCATION_GROUPS)
      .flatMap((g) => g.items)
      .filter((l) => l.aggregate)
      .map((l) => l.id),
  )
  for (const l of [
    ...AG_ENTITY_LOCATIONS,
    ...CWS_DELIVERY_ENTITY_LOCATIONS,
    ...CWS_SHORTAGE_ENTITY_LOCATIONS,
  ]) {
    expect(aggregateIds.has(l.id), l.id).toBe(false)
  }
})

test("sample fallbacks for an entity sit at the generated magnitude", () => {
  // Only reached when the API fails; the magnitude must still be plausible
  // (and labeled as sample), not a hard-coded aggregate-scale number.
  for (const [variableId, locationId, groupId] of [
    ["ag_del", "08N_SA2", "agregions"],
    ["ag_pump", "90_PA1", "agregions"],
    ["cws_del", "MWD", "cws"],
    ["cws_short", "26N_NU1", "cwsShortage"],
  ] as const) {
    const base = getLocation(groupId, locationId)?.mockBase ?? 0
    const series = mockAnnualSeries(
      variableId,
      "s0020",
      "historical",
      locationId,
    )
    expect(series).toHaveLength(100)
    const sorted = [...series].sort((a, b) => a - b)
    const median = sorted[50] ?? 0
    expect(median, `${variableId} ${locationId}`).toBeGreaterThan(base * 0.3)
    expect(median, `${variableId} ${locationId}`).toBeLessThan(base * 3)
  }
})

// Switching between variables that bind different location groups (the CWS
// delivery set vs the shortage set) must not lose a pin the user just chose
// when the same system exists in both, and must never carry one that does
// not exist there. Pure helper, wired into the variable-select action.
test("carryLocationSelection carries a pin across groups only when the next group has it", () => {
  const carried = carryLocationSelection(
    "cws",
    "cwsShortage",
    { cws: "26N_NU1" },
    { cws: ["26N_NU1", "MWD"] },
  )
  expect(carried.pinnedLocationByGroup).toEqual({
    cws: "26N_NU1",
    cwsShortage: "26N_NU1",
  })
  expect(carried.selectedLocationsByGroup).toEqual({
    cws: ["26N_NU1", "MWD"],
    cwsShortage: ["26N_NU1"],
  })
  // A delivery-only system does not exist in the shortage group: nothing is
  // written for the next group, so its own default applies.
  const notCarried = carryLocationSelection(
    "cws",
    "cwsShortage",
    { cws: "MWD" },
    { cws: ["MWD"] },
  )
  expect(notCarried.pinnedLocationByGroup).toEqual({ cws: "MWD" })
  expect(notCarried.selectedLocationsByGroup).toEqual({ cws: ["MWD"] })
  // The location picked last follows the user: an older pin in the next
  // group gives way (the store seeds every group with a default pin, so
  // "no pin yet" cannot be told apart from "the default").
  const latest = carryLocationSelection(
    "cws",
    "cwsShortage",
    { cws: "26N_NU1", cwsShortage: "02_NU" },
    {},
  )
  expect(latest.pinnedLocationByGroup.cwsShortage).toBe("26N_NU1")
  // Same group, or groups with nothing in common, pass through untouched.
  const same = carryLocationSelection("cws", "cws", { cws: "MWD" }, {})
  expect(same.pinnedLocationByGroup).toEqual({ cws: "MWD" })
  const unrelated = carryLocationSelection(
    "reservoirs",
    "cwsShortage",
    { reservoirs: "SHSTA" },
    {},
  )
  expect(unrelated.pinnedLocationByGroup).toEqual({ reservoirs: "SHSTA" })
})

// Calendar-year basis for the CWS delivery family: the served series runs
// 1921 to 2021 on calendar years, with three-month and nine-month stubs at
// the ends, so the site keeps 1922 to 2020. The shortage and welfare family
// is 1922 to 2021 water years and needs no trim.
test("CWS deliveries declare a calendar-year basis and a served year range", () => {
  const del = getVariable("cws_del")
  expect(del?.yearBasis).toBe("calendar")
  expect(del?.servedYearRange).toEqual({ min: 1922, max: 2020 })
  expect(getVariable("cws_short")?.servedYearRange).toBeUndefined()
  expect(getVariable("cws_short")?.yearBasis).toBeUndefined()
  expect(getVariable("res_apr")?.yearBasis).toBeUndefined()
})

// Prose names feed the interpretive sentences ("Mean <prose name> for ...")
// so the text never lowercases a proper noun ("april x2 position") the way
// the old toLowerCase() did.
test("every variable carries a prose name that starts as the sentence needs it", () => {
  for (const v of Object.values(VARIABLES)) {
    expect(typeof v.proseName, v.id).toBe("string")
    expect(v.proseName.length, v.id).toBeGreaterThan(0)
  }
  expect(getVariable("x2_apr")?.proseName).toBe("April X2 position")
  expect(getVariable("swp_mi")?.proseName).toBe(
    "M&I deliveries of the State Water Project",
  )
  expect(getVariable("tot_exp")?.proseName).toBe("Delta exports")
  expect(getVariable("riv_flow")?.proseName).toBe("river flows")
})

// Welfare loss (the third community water systems variable, requested by the
// project lead on Aug 16): the served welfare_loss measure in USD, displayed
// in millions of dollars per year on the shortage-modeled system list.
test("welfare loss is a live community water systems variable in millions of dollars", () => {
  const sector = SECTORS.find((s) => s.id === "cwsS")
  expect(sector?.variables).toEqual(["cws_del", "cws_short", "cws_welfare"])
  const v = getVariable("cws_welfare")
  expect(v?.name).toBe("Welfare loss")
  expect(v?.proseName).toBe("welfare loss")
  expect(v?.locationGroup).toBe("cwsShortage")
  expect(v?.unit).toBe("$M")
  expect(v?.unitLabel).toBe("million dollars per year")
  expect(v?.views).toEqual(["dist"])
  expect(v?.data).toBe("live")
  expect(v?.wytApplicable).toBe(false)
  expect(v?.provisional).toBeUndefined()
  expect(v?.tierOutcomeName).toBeUndefined()
  expect(keyOutcomeChipText(v!)).toBeNull()
})
