import { test, expect } from "@playwright/test"
import {
  didDomainForVariable,
  didPeriodForVariable,
  toDidSubject,
  unitTokenForView,
  includeForView,
  seriesFromValues,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/didMapping"

// Pure request-mapping for the data-in-depth live endpoints. Node-side spec
// (no browser), runs in the e2e-core CI job. Subject codes are pinned to the
// live API/DB (verified 2026-07-20): reservoirs and rivers have curated remaps
// and only X2 is served for delta.

test("didDomainForVariable maps live variables and returns null for mock ones", () => {
  expect(didDomainForVariable("res_apr")).toBe("reservoir")
  expect(didDomainForVariable("res_sep")).toBe("reservoir")
  expect(didDomainForVariable("riv_flow")).toBe("river")
  expect(didDomainForVariable("x2_apr")).toBe("delta")
  expect(didDomainForVariable("x2_sep")).toBe("delta")
  // Not served live -> mock:
  expect(didDomainForVariable("riv_uif")).toBeNull() // % of unimpaired not served
  expect(didDomainForVariable("gw_vol")).toBeNull()
  expect(didDomainForVariable("station_ec")).toBeNull()
  expect(didDomainForVariable("nonsense")).toBeNull()
})

test("didPeriodForVariable pins one period per live variable", () => {
  expect(didPeriodForVariable("res_apr")).toBe("april")
  expect(didPeriodForVariable("res_sep")).toBe("sept")
  expect(didPeriodForVariable("riv_flow")).toBe("annual")
  expect(didPeriodForVariable("x2_apr")).toBe("april")
  expect(didPeriodForVariable("x2_sep")).toBe("sept")
  expect(didPeriodForVariable("gw_vol")).toBeNull()
})

test("toDidSubject maps reservoir location ids to API subject codes", () => {
  // exact matches pass through
  expect(toDidSubject("reservoir", "SHSTA")).toBe("SHSTA")
  expect(toDidSubject("reservoir", "FOLSM")).toBe("FOLSM")
  // curated remaps
  expect(toDidSubject("reservoir", "SLCVP")).toBe("SLUIS_CVP")
  expect(toDidSubject("reservoir", "SLSWP")).toBe("SLUIS_SWP")
  expect(toDidSubject("reservoir", "AGG_NOD")).toBe("NOD_Reservoirs")
  expect(toDidSubject("reservoir", "AGG_SOD")).toBe("SOD_Reservoirs")
  // unknown -> null (mock fallback, never fetch a subject the API lacks)
  expect(toDidSubject("reservoir", "MADE_UP")).toBeNull()
})

test("toDidSubject maps river location ids, remapping the four that differ", () => {
  expect(toDidSubject("river", "AMR004")).toBe("AMR004")
  expect(toDidSubject("river", "SAC049")).toBe("SAC049")
  expect(toDidSubject("river", "SJR070")).toBe("SJR070")
  // registry ids that differ from API codes
  expect(toDidSubject("river", "YRS")).toBe("YUB002")
  expect(toDidSubject("river", "TLG")).toBe("TUO003")
  expect(toDidSubject("river", "MRC")).toBe("MCD005")
  expect(toDidSubject("river", "MKM")).toBe("MOK028")
  expect(toDidSubject("river", "MADE_UP")).toBeNull()
})

test("toDidSubject returns X2 for delta regardless of location", () => {
  expect(toDidSubject("delta", "X2")).toBe("X2")
  expect(toDidSubject("delta", "DELTA")).toBe("X2")
})

test("unitTokenForView picks the request unit per domain and view", () => {
  expect(unitTokenForView("reservoir", "dist")).toBe("volume")
  expect(unitTokenForView("reservoir", "pct")).toBe("pct_capacity")
  expect(unitTokenForView("reservoir", "cv")).toBe("volume")
  expect(unitTokenForView("river", "dist")).toBe("volume")
  expect(unitTokenForView("delta", "dist")).toBe("km")
  expect(unitTokenForView("delta", "pct")).toBe("km") // delta ignores pct
})

test("includeForView requests only values (FE derives the rest)", () => {
  expect(includeForView("dist")).toEqual(["values"])
  expect(includeForView("cv")).toEqual(["values"])
})

test("seriesFromValues extracts numbers and drops nulls", () => {
  expect(
    seriesFromValues([
      { value: 10 },
      { value: null },
      { value: 0 },
      { value: 4552.1 },
    ]),
  ).toEqual([10, 0, 4552.1])
  expect(seriesFromValues([])).toEqual([])
  expect(seriesFromValues(undefined)).toEqual([])
})
