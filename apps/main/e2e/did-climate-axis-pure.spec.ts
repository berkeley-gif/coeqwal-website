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

test("liveAxisEligible: every offered axis is live regardless of the pinned climate", () => {
  // Each axis resolves its scenario ids through the pinned hydroclimate, so
  // eligibility no longer depends on the climate the workspace resolver ran
  // for. Pinning a different climate used to drop the scenarios and
  // locations axes to sample data (and draw a fabricated series for a
  // scenario the model does not cover).
  expect(liveAxisEligible("scenarios")).toBe(true)
  expect(liveAxisEligible("climates")).toBe(true)
  expect(liveAxisEligible("locations")).toBe(true)
  expect(liveAxisEligible("bogus")).toBe(false)
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
