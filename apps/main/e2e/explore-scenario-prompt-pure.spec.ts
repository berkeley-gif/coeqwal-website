import { test, expect } from "@playwright/test"
import {
  needsScenarioPrompt,
  SCENARIO_PROMPT_TEXT,
  type ScenarioPromptInput,
} from "../app/features/scenarioExplorer/explorer/tools/components/scenarioPrompt"

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
  for (const mode of ["radar", "resilience", "equity"] as const) {
    expect(needsScenarioPrompt({ ...base, mode, tourActive: true })).toBe(false)
  }
})

test("bar keeps its pre-existing rule and ignores tours", () => {
  // Bar already showed this prompt before; its tour behavior is unchanged.
  expect(needsScenarioPrompt({ ...base, mode: "bar", tourActive: true })).toBe(
    true,
  )
})

test("list and data in depth never prompt", () => {
  expect(needsScenarioPrompt({ ...base, mode: "list" })).toBe(false)
  expect(needsScenarioPrompt({ ...base, mode: "data" })).toBe(false)
})

test("every prompt tool has one sentence of text", () => {
  for (const text of Object.values(SCENARIO_PROMPT_TEXT)) {
    expect(text).toMatch(/^Select .+\.$/)
    expect(text).not.toContain("\u2014")
  }
})
