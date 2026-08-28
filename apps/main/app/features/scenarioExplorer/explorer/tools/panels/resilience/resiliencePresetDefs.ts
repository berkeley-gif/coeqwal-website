/**
 * Single source of truth for resilience heatmap preset buttons in
 * `ResilienceControls` (single Presets row. `salient` filters that row).
 *
 * UPDATE: AUG 2026. This feature has been removed pre-launch as it's
 * not working as intended. Will be revisiting this functionality in the future
 * Keeping the code for now.
 */

import type { ResilienceControlsState } from "../../../store"

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
  ]

export const RESILIENCE_SALIENT_PRESETS: readonly ResiliencePresetDefinition[] =
  RESILIENCE_PRESET_DEFINITIONS.filter((d) => d.salient)
