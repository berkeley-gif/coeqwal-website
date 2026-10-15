/**
 * scenarioPrompt - when a sidebar tool shows the "select a scenario" prompt
 * instead of its chart. Pure module, no React.
 *
 * With nothing selected, a tool draws nothing and asks for a selection,
 * rather than silently falling back to current operations or to the whole
 * scenario library. This holds for every tool, Data in depth included.
 * Exceptions:
 *   - "Show all scenarios" (radar) or the all-scenarios heatmap view: the
 *     user asked for every scenario, so there is something to draw.
 *   - A running tour of that tool: tour steps anchor on chart elements, so
 *     the chart stays up until the tour ends. Radar, Heatmap and
 *     Distribution keep their old fallback for it; Bar and Data in depth,
 *     which never had one, draw current operations for the tour only.
 *
 * Exports: needsScenarioPrompt, getIsTourExample, TOUR_EXAMPLE_NOTE,
 * SCENARIO_PROMPT_TEXT, ScenarioPromptInput, PromptTool.
 */

import type { ExploreMode } from "../../store/types"

export interface ScenarioPromptInput {
  mode: ExploreMode
  /** Length of the shared multi-select (`selectedScenarios`) */
  selectedScenarioCount: number
  /** Radar "show all scenarios", or the heatmap all-scenarios view */
  showAll: boolean
  /** Distribution's single-select focus (`equityFocusScenario`) */
  equityFocusScenario: string | null
  /** True while this tool's own tour is running (`tour.tool === mode`) */
  tourActive: boolean
}

/** Whether the tool shows the prompt in place of its chart. Pure. */
export function needsScenarioPrompt(input: ScenarioPromptInput): boolean {
  switch (input.mode) {
    case "bar":
    case "data":
      if (input.tourActive) return false
      return input.selectedScenarioCount === 0
    case "radar":
    case "resilience":
      if (input.tourActive) return false
      return input.selectedScenarioCount === 0 && !input.showAll
    case "equity":
      if (input.tourActive) return false
      return input.equityFocusScenario === null
    default:
      return false
  }
}

/**
 * Whether the tool is drawing a chart only because its own tour is running:
 * outside the tour it would show the prompt. The tour card then says so,
 * because the chart goes away when the tour ends. Pure.
 */
export function getIsTourExample(input: ScenarioPromptInput): boolean {
  return (
    input.tourActive && needsScenarioPrompt({ ...input, tourActive: false })
  )
}

/**
 * The tour card note shown while `getIsTourExample` holds. It does not say
 * nothing is selected: Distribution needs its own focus scenario, so the
 * note can show while the sidebar has a selection.
 */
export const TOUR_EXAMPLE_NOTE =
  "The tour shows example results. They go away when the tour ends. Select a scenario in the sidebar to see your own."

export type PromptTool = "bar" | "radar" | "equity" | "resilience" | "data"

/** The prompt sentence per tool. Bar keeps its existing wording. */
export const SCENARIO_PROMPT_TEXT: Record<PromptTool, string> = {
  bar: "Select scenarios in the sidebar to compare their bar charts here.",
  radar: "Select scenarios in the sidebar to compare them on the radar chart.",
  equity:
    "Select a scenario in the sidebar to see how its outcomes are distributed across locations.",
  resilience:
    "Select scenarios in the sidebar to see how they perform across hydroclimates.",
  data: "Select scenarios in the sidebar to explore their model results here.",
}
