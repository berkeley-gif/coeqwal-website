/**
 * ResilienceControls
 *
 * Used only by ResilienceControls.tsx and useResilienceControlsWriter.ts.
 * ResiliencePanel reads flat store fields directly and does not import from here.
 *
 *   readSnapshot.ts      READ   flat store fields → ResilienceControlsState
 *   planPivotChange.ts   PLAN   sentence pivot UI → Partial patch (no store write)
 *   writeChange.ts       WRITE  Partial patch → flat store (atomic)
 *
 * Example preset click:
 *   const current = readControlsSnapshot(flatFields)
 *   const planned = preset.getPatch(current)
 *   writeControlsChange(planned)
 *
 * Example pivot click:
 *   writeControlsChange(planPivotPatch(pivotDim, pivotMode, current))
 */

export { readControlsSnapshot } from "./readSnapshot"
export {
  ALL_PIVOT_DIMS,
  CANONICAL_X_FOR_PIVOT,
  derivePivotFromStore,
  deriveSentenceAxes,
  planPivotPatch,
  PIVOT_DIM_LABEL_PLURAL,
  PIVOT_DIM_LABEL_SINGULAR,
  type PivotDim,
  type PivotMode,
} from "./planPivotChange"
export { writeControlsChange } from "./writeChange"
