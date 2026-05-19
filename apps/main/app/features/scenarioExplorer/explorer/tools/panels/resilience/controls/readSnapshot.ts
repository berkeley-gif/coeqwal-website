/**
 * READ layer: flat store fields → ResilienceControlsState view-model.
 *
 * The store keeps separate `resilience*` fields. Presets and pivot logic need
 * one object describing "controls as they are now". This module assembles that
 * object. It does not write to the store.
 *
 * Typical flow: readControlsSnapshot(flatFields) → pass to plan* or preset.getPatch
 */

import {
  selectResilienceControls,
  type ResilienceControlFields,
} from "../../../../store/resilienceStoreSlice"
import type { ResilienceControlsState } from "../../../../store/resilienceTypes"

/** Assemble flat resilience store fields into the controls view-model */
export function readControlsSnapshot(
  fields: ResilienceControlFields,
): ResilienceControlsState {
  return selectResilienceControls(fields)
}
