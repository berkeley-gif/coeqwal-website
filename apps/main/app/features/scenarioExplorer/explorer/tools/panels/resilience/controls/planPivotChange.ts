/**
 * PLAN layer: sentence UI framing → Partial ResilienceControlsState (no store write).
 *
 * ResilienceControls speaks in X / Y / Z axis roles (across, down, pivot).
 * The store speaks in (view, aggregateOver, transposed). This module translates
 * between those framings and returns planned changes for writeControlsChange.
 *
 * Typical flow:
 *   readControlsSnapshot(current) → planPivotPatch(...) → writeControlsChange(patch)
 */

import type { ResilienceControlsState, ResilienceView } from "../../../../store"

export type PivotDim = "scenario" | "outcome" | "hydroclimate"
export type PivotMode = "facet" | "aggregate"

export const ALL_PIVOT_DIMS: readonly PivotDim[] = [
  "scenario",
  "outcome",
  "hydroclimate",
]

export const PIVOT_DIM_LABEL_SINGULAR: Record<PivotDim, string> = {
  scenario: "scenario",
  outcome: "outcome",
  hydroclimate: "hydroclimate",
}

export const PIVOT_DIM_LABEL_PLURAL: Record<PivotDim, string> = {
  scenario: "scenarios",
  outcome: "outcomes",
  hydroclimate: "hydroclimates",
}
/** Stored view → which dimension is the sentence "pivot" (Z) */
export function derivePivotFromStore(view: ResilienceView): PivotDim {
  return view
}

/** Pivot (Z) choice → partial store patch for view / aggregateOver */
function pivotDimToStorePatch(
  pivotDim: PivotDim,
): Partial<ResilienceControlsState> {
  return { view: pivotDim }
}

/** Default X assignment for each pivot dim (before transpose flip) */
export const CANONICAL_X_FOR_PIVOT: Record<PivotDim, PivotDim> = {
  scenario: "hydroclimate",
  outcome: "hydroclimate",
  hydroclimate: "scenario",
}

const CANONICAL_Y_FOR_PIVOT: Record<PivotDim, PivotDim> = {
  scenario: "outcome",
  outcome: "scenario",
  hydroclimate: "outcome",
}

/** Pivot dim + transpose → which dims label the X and Y sentence pills */
export function deriveSentenceAxes(
  pivotDim: PivotDim,
  transposed: boolean,
): { xDim: PivotDim; yDim: PivotDim } {
  const cx = CANONICAL_X_FOR_PIVOT[pivotDim]
  const cy = CANONICAL_Y_FOR_PIVOT[pivotDim]
  return transposed ? { xDim: cy, yDim: cx } : { xDim: cx, yDim: cy }
}

/**
 * Plan a pivot change from the sentence UI.
 *
 * Returns a partial patch (not yet written). Applies cross-field guards:
 * demote aggregate-only encodings when leaving aggregate, clear leverage when
 * aggregating over outcomes, clear delta when aggregating over hydroclimates.
 */
export function planPivotPatch(
  pivotDim: PivotDim,
  current: ResilienceControlsState,
  extra: Partial<ResilienceControlsState> = {},
): Partial<ResilienceControlsState> {
  const patch: Partial<ResilienceControlsState> = {
    ...pivotDimToStorePatch(pivotDim),
    ...extra,
  }
  const enc = current.cellEncoding

  if (enc === "glyph" || enc === "leverage") {
    patch.cellEncoding = "tier"
  }
  if (pivotDim === "hydroclimate" && current.deltaMode !== "none") {
    patch.deltaMode = "none"
  }

  return patch
}
