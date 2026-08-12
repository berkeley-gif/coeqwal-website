import { test, expect } from "@playwright/test"
import {
  comparedClimateKeys,
  climateFanoutIds,
  liveAxisEligible,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/climateAxis"
import { HYDROCLIMATES } from "../app/content/scenarios"

// Pure mapping for the "compare by climates" live fan-out. Node-side spec
// (no browser), runs in the e2e-core CI job alongside did-mapping.spec.ts.

test("comparedClimateKeys defaults to every configured hydroclimate when nothing is selected", () => {
  expect(comparedClimateKeys([])).toEqual([...HYDROCLIMATES])
})

test("comparedClimateKeys keeps selection order and drops unknown keys", () => {
  expect(comparedClimateKeys(["cc95", "bogus", "historical"])).toEqual([
    "cc95",
    "historical",
  ])
})

test("comparedClimateKeys with an all-invalid selection compares nothing (matches the member-spec behavior)", () => {
  expect(comparedClimateKeys(["bogus", "nope"])).toEqual([])
})

test("climateFanoutIds resolves the held scenario per climate, index-aligned with the keys", () => {
  const byClimate = {
    historical: { s0020: "s0020", s0025: "s0025" },
    cc95: { s0020: "s0056", s0025: "s0061" },
    tai: { s0020: "s0108" },
  }
  expect(
    climateFanoutIds(byClimate, ["historical", "cc95", "tai"], "s0020"),
  ).toEqual(["s0020", "s0056", "s0108"])
  expect(climateFanoutIds(byClimate, ["cc95", "historical"], "s0025")).toEqual([
    "s0061",
    "s0025",
  ])
})

test("liveAxisEligible: scenarios axis needs the workspace climate; climates axis is always eligible; locations stays mock", () => {
  // scenarios axis: live only when the held climate is the one the workspace
  // resolver used (the pre-existing rule, unchanged)
  expect(liveAxisEligible("scenarios", "historical", "historical")).toBe(true)
  expect(liveAxisEligible("scenarios", "cc95", "historical")).toBe(false)
  // climates axis: each member resolves its own climate, so eligibility does
  // not depend on the workspace climate
  expect(liveAxisEligible("climates", "historical", "historical")).toBe(true)
  expect(liveAxisEligible("climates", "cc95", "historical")).toBe(true)
  // locations axis: not wired for live yet
  expect(liveAxisEligible("locations", "historical", "historical")).toBe(false)
})

test("climateFanoutIds yields null for a missing variant or unknown climate, never a crash", () => {
  const byClimate = {
    historical: { s0020: "s0020" },
    cc95: { s0020: null },
  }
  expect(
    climateFanoutIds(byClimate, ["historical", "cc95", "tai"], "s0020"),
  ).toEqual(["s0020", null, null])
  expect(climateFanoutIds({}, ["historical"], "s0020")).toEqual([null])
})
