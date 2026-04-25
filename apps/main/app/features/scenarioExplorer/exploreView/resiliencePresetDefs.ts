/**
 * Single source of truth for resilience heatmap preset buttons in
 * `ResilienceControls` (single Presets row. `salient` filters that row).
 */

import type { ResilienceControlsState } from "./ResiliencePanel"

export type ResiliencePresetPatchFn = (
  state: ResilienceControlsState,
) => Partial<ResilienceControlsState>

export interface ResiliencePresetDefinition {
  id: string
  group: "Start" | "Browse" | "Analyze"
  label: string
  description: string
  /**
   * When true, the preset is shown as a quick button in
   * `ResilienceControls` under the sentence.
   */
  salient: boolean
  getPatch: ResiliencePresetPatchFn
}

/**
 * All named presets, in group order. `getPatch` must stay consistent with
 * how the sentence controls interpret state (view, encoding, baselines).
 */
export const RESILIENCE_PRESET_DEFINITIONS: readonly ResiliencePresetDefinition[] =
  [
    {
      id: "overview-mean-tiers",
      group: "Start",
      label: "Overview",
      description: "Averaged across all scenarios, colored by mean tier.",
      salient: true,
      getPatch: () => ({
        view: "aggregate",
        cellEncoding: "tier",
        deltaMode: "none",
        aggregateScope: "all",
        showCellNumbers: true,
      }),
    },
    {
      id: "browse-all-scenarios",
      group: "Browse",
      label: "All scenarios",
      description: "Scenarios as small multiples · pin a few tiles to compare.",
      salient: true,
      getPatch: () => ({
        view: "scenario",
        cellEncoding: "tier",
        deltaMode: "none",
        showAllScenarios: true,
      }),
    },
    {
      id: "browse-all-outcomes",
      group: "Browse",
      label: "All outcomes",
      description: "Outcomes as small multiples · one chart per outcome.",
      salient: true,
      getPatch: () => ({
        view: "outcome",
        cellEncoding: "tier",
        deltaMode: "none",
      }),
    },
    {
      id: "browse-all-hydroclimates",
      group: "Browse",
      label: "All hydroclimates",
      description:
        "Hydroclimates as small multiples · one chart per hydroclimate.",
      salient: true,
      getPatch: () => ({
        view: "hydroclimate",
        cellEncoding: "tier",
        deltaMode: "none",
      }),
    },
    {
      id: "analyze-aggregate-over-outcomes",
      group: "Analyze",
      label: "Averaged across outcomes",
      description:
        "Single chart with outcomes meaned away. Read scenarios directly.",
      salient: true,
      getPatch: () => ({
        view: "aggregate",
        aggregateOver: "outcomes",
        cellEncoding: "tier",
        deltaMode: "none",
      }),
    },
    {
      id: "analyze-aggregate-over-hydroclimates",
      group: "Analyze",
      label: "Averaged across hydroclimates",
      description:
        "Single chart with hydroclimates meaned away. Climate-agnostic profile.",
      salient: true,
      getPatch: () => ({
        view: "aggregate",
        aggregateOver: "hydroclimates",
        cellEncoding: "tier",
        deltaMode: "none",
      }),
    },
  ]

export const RESILIENCE_SALIENT_PRESETS: readonly ResiliencePresetDefinition[] =
  RESILIENCE_PRESET_DEFINITIONS.filter((d) => d.salient)
