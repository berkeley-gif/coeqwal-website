import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export type OutcomeName =
  | "Community deliveries"
  | "Agricultural deliveries"
  | "Environmental deliveries"
  | "Reservoir storage"
  | "Groundwater storage"
  | "Delta salinity"
  | "Salmon abundance"
  | "Distributional equity"

export interface OutcomeRange {
  min: number
  max: number
}

interface ScenarioFilterState {
  outcomeRanges: Record<OutcomeName, OutcomeRange>
  setOutcomeRange: (outcome: OutcomeName, range: OutcomeRange) => void
  clearFilters: () => void
}

const INITIAL_RANGE: OutcomeRange = { min: -1, max: 1 }

export const useScenarioFilterStore = create<ScenarioFilterState>()(
  immer<ScenarioFilterState>((set) => ({
    outcomeRanges: {
      "Community deliveries": { ...INITIAL_RANGE },
      "Agricultural deliveries": { ...INITIAL_RANGE },
      "Environmental deliveries": { ...INITIAL_RANGE },
      "Reservoir storage": { ...INITIAL_RANGE },
      "Groundwater storage": { ...INITIAL_RANGE },
      "Delta salinity": { ...INITIAL_RANGE },
      "Salmon abundance": { ...INITIAL_RANGE },
      "Distributional equity": { ...INITIAL_RANGE },
    },

    setOutcomeRange: (outcome, range) =>
      set((state) => {
        state.outcomeRanges[outcome] = range
      }),

    clearFilters: () =>
      set((state) => {
        Object.keys(state.outcomeRanges).forEach((key) => {
          state.outcomeRanges[key as OutcomeName] = { ...INITIAL_RANGE }
        })
      }),
  })),
)
