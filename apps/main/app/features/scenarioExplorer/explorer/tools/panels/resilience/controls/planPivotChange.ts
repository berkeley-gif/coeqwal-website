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

import type {
  AggregateOver,
  ResilienceControlsState,
  ResilienceView,
} from "../../../../store"

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

const AGGREGATE_OVER_TO_PIVOT_DIM: Record<AggregateOver, PivotDim> = {
  scenarios: "scenario",
  outcomes: "outcome",
  hydroclimates: "hydroclimate",
}

const PIVOT_DIM_TO_AGGREGATE_OVER: Record<PivotDim, AggregateOver> = {
  scenario: "scenarios",
  outcome: "outcomes",
  hydroclimate: "hydroclimates",
}

/** Stored (view, aggregateOver) → which dimension is the sentence "pivot" (Z) */
export function derivePivotFromStore(
  view: ResilienceView,
  aggregateOver: AggregateOver,
): { pivotDim: PivotDim; pivotMode: PivotMode } {
  if (view === "aggregate") {
    return {
      pivotDim: AGGREGATE_OVER_TO_PIVOT_DIM[aggregateOver],
      pivotMode: "aggregate",
    }
  }
  return { pivotDim: view as PivotDim, pivotMode: "facet" }
}

/** Pivot (Z) choice → partial store patch for view / aggregateOver */
function pivotDimToStorePatch(
  pivotDim: PivotDim,
  pivotMode: PivotMode,
): Partial<ResilienceControlsState> {
  if (pivotMode === "aggregate") {
    return {
      view: "aggregate",
      aggregateOver: PIVOT_DIM_TO_AGGREGATE_OVER[pivotDim],
    }
  }
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
  pivotMode: PivotMode,
  current: ResilienceControlsState,
  extra: Partial<ResilienceControlsState> = {},
): Partial<ResilienceControlsState> {
  const patch: Partial<ResilienceControlsState> = {
    ...pivotDimToStorePatch(pivotDim, pivotMode),
    ...extra,
  }
  const nextView = patch.view ?? current.view
  const nextAgg = patch.aggregateOver ?? current.aggregateOver
  const enc = current.cellEncoding

  if (nextView !== "aggregate" && (enc === "glyph" || enc === "leverage")) {
    patch.cellEncoding = "tier"
  }
  if (nextAgg === "outcomes" && enc === "leverage") {
    patch.cellEncoding = "tier"
  }
  if (nextAgg === "hydroclimates" && current.deltaMode !== "none") {
    patch.deltaMode = "none"
  }
  return patch
}
