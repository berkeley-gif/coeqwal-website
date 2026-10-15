import { test, expect } from "@playwright/test"
import {
  getIsTourExample,
  needsScenarioPrompt,
  SCENARIO_PROMPT_TEXT,
  type ScenarioPromptInput,
} from "../app/features/scenarioExplorer/explorer/tools/components/scenarioPrompt"
import {
  getCompareScenarioIds,
  getDataScenarioSelection,
  getHeldScenarioId,
  MAX_DATA_IN_DEPTH_SCENARIOS,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/scenarioLimit"

// Pure rule behind the "select a scenario" prompt the sidebar tools show
// instead of a chart. Node-side spec (no browser).

const base: ScenarioPromptInput = {
  mode: "radar",
  selectedScenarioCount: 0,
  showAll: false,
  equityFocusScenario: null,
  tourActive: false,
}

test("radar, heatmap and bar prompt when nothing is selected", () => {
  expect(needsScenarioPrompt({ ...base, mode: "radar" })).toBe(true)
  expect(needsScenarioPrompt({ ...base, mode: "resilience" })).toBe(true)
  expect(needsScenarioPrompt({ ...base, mode: "bar" })).toBe(true)
})

test("a selection hides the prompt", () => {
  for (const mode of ["radar", "resilience", "bar"] as const) {
    expect(
      needsScenarioPrompt({ ...base, mode, selectedScenarioCount: 1 }),
    ).toBe(false)
  }
})

test("radar showAll draws the library instead of the prompt", () => {
  expect(needsScenarioPrompt({ ...base, mode: "radar", showAll: true })).toBe(
    false,
  )
  expect(
    needsScenarioPrompt({ ...base, mode: "resilience", showAll: true }),
  ).toBe(false)
})

test("distribution prompts until a focus scenario is picked", () => {
  expect(needsScenarioPrompt({ ...base, mode: "equity" })).toBe(true)
  expect(
    needsScenarioPrompt({
      ...base,
      mode: "equity",
      equityFocusScenario: "s0020",
    }),
  ).toBe(false)
  // Distribution ignores the multi-select count on purpose.
  expect(
    needsScenarioPrompt({ ...base, mode: "equity", selectedScenarioCount: 3 }),
  ).toBe(true)
})

test("a running tour keeps the chart visible", () => {
  // Bar included: its tour anchors on a card's glyphs, pin and share
  // controls, which only exist while a card is drawn.
  for (const mode of ["radar", "resilience", "equity", "bar"] as const) {
    expect(needsScenarioPrompt({ ...base, mode, tourActive: true })).toBe(false)
  }
})

test("another tool's tour does not lift the prompt", () => {
  // tourActive is per tool (tour.tool === mode); a Radar tour running while
  // Bar is somehow rendered must not count for Bar.
  expect(needsScenarioPrompt({ ...base, mode: "bar", tourActive: false })).toBe(
    true,
  )
})

test("list never prompts", () => {
  expect(needsScenarioPrompt({ ...base, mode: "list" })).toBe(false)
})

test("data in depth prompts like the other tools, except during its tour", () => {
  expect(needsScenarioPrompt({ ...base, mode: "data" })).toBe(true)
  expect(
    needsScenarioPrompt({ ...base, mode: "data", selectedScenarioCount: 1 }),
  ).toBe(false)
  expect(needsScenarioPrompt({ ...base, mode: "data", tourActive: true })).toBe(
    false,
  )
})

test("the tour card notes example results only when the tour lifts the prompt", () => {
  // Every prompt tool draws something during its tour with nothing selected.
  for (const mode of [
    "radar",
    "resilience",
    "equity",
    "bar",
    "data",
  ] as const) {
    expect(getIsTourExample({ ...base, mode, tourActive: true })).toBe(true)
  }
  // Not when the user's own choice is drawn, and never outside the tour.
  expect(
    getIsTourExample({
      ...base,
      mode: "data",
      selectedScenarioCount: 1,
      tourActive: true,
    }),
  ).toBe(false)
  expect(
    getIsTourExample({
      ...base,
      mode: "radar",
      showAll: true,
      tourActive: true,
    }),
  ).toBe(false)
  expect(
    getIsTourExample({
      ...base,
      mode: "resilience",
      showAll: true,
      tourActive: true,
    }),
  ).toBe(false)
  expect(
    getIsTourExample({
      ...base,
      mode: "equity",
      equityFocusScenario: "s0020",
      tourActive: true,
    }),
  ).toBe(false)
  expect(getIsTourExample({ ...base, mode: "data" })).toBe(false)
  expect(getIsTourExample({ ...base, mode: "list", tourActive: true })).toBe(
    false,
  )
})

test("data in depth compares exactly the selection", () => {
  // Nothing selected: nothing compared (the prompt shows), unless the
  // tool's own tour runs, which draws current operations.
  expect(getDataScenarioSelection([], false, "s0020")).toEqual([])
  expect(getDataScenarioSelection([], true, "s0020")).toEqual(["s0020"])
  expect(getDataScenarioSelection(["s0011"], true, "s0020")).toEqual(["s0011"])
  // Current operations is never added; it leads when selected.
  expect(getCompareScenarioIds(["s0011", "s0012"], "s0020")).toEqual([
    "s0011",
    "s0012",
  ])
  expect(getCompareScenarioIds(["s0011", "s0020"], "s0020")).toEqual([
    "s0020",
    "s0011",
  ])
  const many = Array.from({ length: 9 }, (_, i) => `s00${30 + i}`)
  expect(getCompareScenarioIds(many, "s0020")).toHaveLength(
    MAX_DATA_IN_DEPTH_SCENARIOS,
  )
  // The held scenario is the pin while it is compared, else the first.
  expect(getHeldScenarioId("s0012", ["s0011", "s0012"], "s0020")).toBe("s0012")
  expect(getHeldScenarioId("s0020", ["s0011"], "s0020")).toBe("s0011")
  expect(getHeldScenarioId(null, [], "s0020")).toBe("s0020")
})

test("every prompt tool has one sentence of text", () => {
  for (const text of Object.values(SCENARIO_PROMPT_TEXT)) {
    expect(text).toMatch(/^Select .+\.$/)
    expect(text).not.toContain("\u2014")
  }
})
