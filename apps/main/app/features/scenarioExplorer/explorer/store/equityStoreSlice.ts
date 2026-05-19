/**
 * Equity store slice - Distribution (equity) tool session state.
 *
 * Tool settings here survive a page reload within the same tab
 * (see `exploreSessionPersist.ts`).
 */

import { OUTCOME_CODE_ORDER } from "../../../../content/outcomes"

export interface EquityState {
  showEquityComparison: boolean
  /** Outcome codes included in equity share snapshots */
  equityVisibleOutcomes: string[]
}

export interface EquityActions {
  setShowEquityComparison: (show: boolean) => void
  setEquityVisibleOutcomes: (codes: string[]) => void
}

export type EquitySlice = EquityState & EquityActions

export const equityInitialState: EquityState = {
  showEquityComparison: false,
  equityVisibleOutcomes: [...OUTCOME_CODE_ORDER],
}

type ImmerSet = (fn: (state: EquitySlice) => void) => void

export function createEquitySlice(
  set: ImmerSet,
  initial: EquityState = equityInitialState,
): EquitySlice {
  return {
    ...initial,

    setShowEquityComparison: (show) =>
      set((state) => {
        state.showEquityComparison = show
      }),

    setEquityVisibleOutcomes: (codes) =>
      set((state) => {
        state.equityVisibleOutcomes = codes
      }),
  }
}
