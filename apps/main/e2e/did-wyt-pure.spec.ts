import { test, expect } from "@playwright/test"
import {
  WYT_CLASSES,
  WYT_LABELS,
  filterSeriesByWyt,
  toggleWytClass,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/wytFilter"
import {
  mockWaterYearType,
  MOCK_YEARS,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/mockDataEngine"

// Pure logic behind the water-year-type filter. Node-side spec (no browser),
// runs in the e2e-core CI job. Class semantics follow the Sacramento Valley
// index as stored by the API: 1=Wet ... 5=Critical.

test("the vocabulary is classes 1..5, each labeled", () => {
  expect([...WYT_CLASSES]).toEqual([1, 2, 3, 4, 5])
  for (const c of WYT_CLASSES) {
    expect(typeof WYT_LABELS[c]).toBe("string")
    expect(WYT_LABELS[c]!.length).toBeGreaterThan(0)
  }
})

test("mockWaterYearType is deterministic, in range, and covers all classes", () => {
  const classes = new Set<number>()
  for (let i = 0; i < MOCK_YEARS; i++) {
    const c = mockWaterYearType(i)
    expect(c).toBe(mockWaterYearType(i))
    expect(c).toBeGreaterThanOrEqual(1)
    expect(c).toBeLessThanOrEqual(5)
    classes.add(c)
  }
  // Seeded, so this either always passes or always fails: if it fails,
  // adjust the thresholds in mockWaterYearType, never this test.
  expect(classes.size).toBe(5)
})

test("filterSeriesByWyt keeps selected classes, passes through when empty", () => {
  const cls = (i: number) => (i % 5) + 1
  const series = [10, 20, 30, 40, 50, 60]
  expect(filterSeriesByWyt(series, [], cls)).toEqual(series)
  expect(filterSeriesByWyt(series, [1], cls)).toEqual([10, 60])
  expect(filterSeriesByWyt(series, [2, 5], cls)).toEqual([20, 50])
})

test("toggleWytClass is single-select: pick replaces, re-pick clears", () => {
  expect(toggleWytClass([], 4)).toEqual([4])
  // Choosing another class replaces the selection (one type at a time).
  expect(toggleWytClass([4], 1)).toEqual([1])
  // Choosing the active class returns to all years.
  expect(toggleWytClass([4], 4)).toEqual([])
  // Legacy multi-class selections still resolve to the clicked class.
  expect(toggleWytClass([1, 4], 3)).toEqual([3])
  expect(toggleWytClass([1, 4], 4)).toEqual([])
})
