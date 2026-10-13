/**
 * mapFigureSpec - the figure-template spec for what the Explore map shows:
 * which outcome(s), under which strategy and hydroclimate. The map caption
 * renders it. Pure module.
 *
 * Exports: MapFigureInput, mapFigureSpec, MAP_TOOL_LABELS.
 */

import type { ExploreMode } from "../../../store/types"
import type { FigureTemplateSpec } from "../../../share/figureTemplate"
import { titleCaseLabel } from "../../../share/figureTitle"

export const MAP_TOOL_LABELS: Partial<Record<ExploreMode, string>> = {
  bar: "Bar tool",
  radar: "Radar tool",
  equity: "Distribution tool",
  resilience: "Heatmap tool",
}

export interface MapFigureInput {
  mode: ExploreMode
  /** Display names of the outcomes painted on the map */
  outcomeNames: string[]
  /** Scenario short label, or null when unknown */
  scenarioLabel: string | null
  /** Hydroclimate short label, e.g. "Historical" */
  hydroclimateLabel: string | null
  /** Distribution comparison mode: markers compare with current operations */
  comparedWithBaseline: boolean
}

/** Template spec for the map, or null when nothing is mapped. Pure. */
export function mapFigureSpec(
  input: MapFigureInput,
): FigureTemplateSpec | null {
  if (input.outcomeNames.length === 0) return null
  const strategy = input.scenarioLabel
    ? `${titleCaseLabel(input.scenarioLabel)}${
        input.comparedWithBaseline ? ", Compared with Current Operations" : ""
      }`
    : undefined
  return {
    toolLabel: "Map",
    chartKindLabel: MAP_TOOL_LABELS[input.mode] ?? "Map",
    values: {
      outcome: input.outcomeNames.join(", "),
      strategy,
      hydroclimate: input.hydroclimateLabel ?? undefined,
    },
    legendHeading: "Tier",
  }
}
