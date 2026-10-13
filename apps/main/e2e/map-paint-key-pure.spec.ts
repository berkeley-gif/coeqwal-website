import { test, expect } from "@playwright/test"
import { mapPaintKey } from "../app/features/map/config/mapPaintKey"

test("tier-layer tools key on outcome and resolved scenario", () => {
  expect(
    mapPaintKey({ mode: "bar", outcomeCode: "ENV_FLOWS", scenarioId: "s0120" }),
  ).toBe("tiers|ENV_FLOWS|s0120")
  // Radar and Heatmap share the same layer, so the same key.
  expect(
    mapPaintKey({
      mode: "radar",
      outcomeCode: "ENV_FLOWS",
      scenarioId: "s0120",
    }),
  ).toBe("tiers|ENV_FLOWS|s0120")
})

test("distribution keys on painted locations, focus and comparison", () => {
  const a = mapPaintKey({
    mode: "equity",
    mappedLocationKeys: ["CWS_DEL:A1", "ENV_FLOWS:B2"],
    focusScenario: "s0020",
    hydroclimate: "historical",
    compared: false,
  })
  expect(a).toBe("equity|CWS_DEL:A1~ENV_FLOWS:B2|s0020|historical|0")
  // Order does not matter; comparison does.
  expect(
    mapPaintKey({
      mode: "equity",
      mappedLocationKeys: ["ENV_FLOWS:B2", "CWS_DEL:A1"],
      focusScenario: "s0020",
      hydroclimate: "historical",
      compared: true,
    }),
  ).toBe("equity|CWS_DEL:A1~ENV_FLOWS:B2|s0020|historical|1")
  // Swapping one location for another of the same outcome changes the key.
  expect(
    mapPaintKey({
      mode: "equity",
      mappedLocationKeys: ["CWS_DEL:A9", "ENV_FLOWS:B2"],
      focusScenario: "s0020",
      hydroclimate: "historical",
      compared: false,
    }),
  ).not.toBe(a)
  // The same markers under another hydroclimate carry other tiers.
  expect(
    mapPaintKey({
      mode: "equity",
      mappedLocationKeys: ["CWS_DEL:A1", "ENV_FLOWS:B2"],
      focusScenario: "s0020",
      hydroclimate: "cc95",
      compared: false,
    }),
  ).not.toBe(a)
})

test("nothing selected gives an empty key", () => {
  expect(mapPaintKey({ mode: "bar", outcomeCode: null })).toBe("")
  expect(mapPaintKey({ mode: "equity", mappedLocationKeys: [] })).toBe("")
})
