"use client"

/**
 * WRITE layer: Partial ResilienceControlsState → flat store fields (atomic).
 *
 * Single entry point for ResilienceControls to persist planned changes.
 * Presets and planPivotPatch output come here. Not part of the store public API.
 *
 * Typical flow: writeControlsChange(planPivotPatch(...)) or writeControlsChange(preset patch)
 */

import { useExplorerStore } from "../../../../store"
import { applyResilienceControlsPatch } from "../../../../store/resilienceStoreSlice"
import type { ResilienceControlsState } from "../../../../store/resilienceTypes"

/** Apply a planned controls change to the explorer store in one transaction */
export function writeControlsChange(
  patch: Partial<ResilienceControlsState>,
): void {
  useExplorerStore.setState((state) => {
    applyResilienceControlsPatch(state, patch)
  })
}
