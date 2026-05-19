/**
 * Radar store slice - Radar tool session state.
 *
 * Tool settings here survive a page reload within the same tab
 * (see `exploreSessionPersist.ts`), except `showAxisSelector` (open popover).
 */

import { OUTCOME_CODE_ORDER } from "../../../../content/outcomes"

export interface RadarState {
  showRadarRange: boolean
  showDotsOnly: boolean
  radarShowAll: boolean
  showAxisSelector: boolean
  radarVisibleAxes: string[]
}

export interface RadarActions {
  setShowRadarRange: (show: boolean) => void
  setShowDotsOnly: (show: boolean) => void
  setRadarShowAll: (show: boolean) => void
  setShowAxisSelector: (show: boolean) => void
  toggleRadarAxis: (code: string) => void
  setRadarVisibleAxes: (codes: string[]) => void
}

export type RadarSlice = RadarState & RadarActions

export const radarInitialState: RadarState = {
  showRadarRange: false,
  showDotsOnly: false,
  radarShowAll: false,
  showAxisSelector: false,
  radarVisibleAxes: [...OUTCOME_CODE_ORDER],
}

type ImmerSet = (fn: (state: RadarSlice) => void) => void

export function createRadarSlice(
  set: ImmerSet,
  initial: RadarState = radarInitialState,
): RadarSlice {
  return {
    ...initial,

    setShowRadarRange: (show) =>
      set((state) => {
        state.showRadarRange = show
      }),

    setShowDotsOnly: (show) =>
      set((state) => {
        state.showDotsOnly = show
      }),

    setRadarShowAll: (show) =>
      set((state) => {
        state.radarShowAll = show
      }),

    setShowAxisSelector: (show) =>
      set((state) => {
        state.showAxisSelector = show
      }),

    toggleRadarAxis: (code) =>
      set((state) => {
        const idx = state.radarVisibleAxes.indexOf(code)
        if (idx >= 0) {
          state.radarVisibleAxes.splice(idx, 1)
        } else {
          state.radarVisibleAxes.push(code)
        }
      }),

    setRadarVisibleAxes: (codes) =>
      set((state) => {
        state.radarVisibleAxes = codes
      }),
  }
}
