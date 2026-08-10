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
  yAxisMode: "discrete" | "continuous"
  /** Category display names hidden from the live TierGrid, so the visible ones get more room */
  equityHiddenCategories: string[]
}

export interface EquityActions {
  setShowEquityComparison: (show: boolean) => void
  setEquityVisibleOutcomes: (codes: string[]) => void
  setYAxisMode: (mode: "discrete" | "continuous") => void
  toggleEquityCategory: (category: string) => void
}

export type EquitySlice = EquityState & EquityActions

export const equityInitialState: EquityState = {
  showEquityComparison: false,
  equityVisibleOutcomes: [...OUTCOME_CODE_ORDER],
  yAxisMode: "discrete",
  equityHiddenCategories: [],
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

    setYAxisMode: (mode) =>
      set((state) => {
        state.yAxisMode = mode
      }),

    toggleEquityCategory: (category) =>
      set((state) => {
        const index = state.equityHiddenCategories.indexOf(category)
        if (index > -1) {
          state.equityHiddenCategories.splice(index, 1)
        } else {
          state.equityHiddenCategories.push(category)
        }
      }),
  }
}
