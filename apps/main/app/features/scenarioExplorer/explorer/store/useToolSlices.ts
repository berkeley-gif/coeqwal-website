"use client"

/**
 * Store slice facade hooks.
 *
 * Each hook reads one slice's fields from the single `useExplorerStore` object
 * (or workspace fields from the same store via `useWorkspaceSlice`).
 *
 * Explore session state survives a page reload within the same tab via
 * sessionStorage. See `exploreSessionPersist.ts` for the full persistence story.
 */

import { useShallow } from "zustand/react/shallow"
import { useExplorerStore } from "./storeInstance"
import {
  pickEquitySlice,
  pickListSlice,
  pickRadarSlice,
  pickResilienceSlice,
  pickWorkspaceSlice,
} from "./pickSlices"
import type { ExplorerStore } from "./storeInstance"

function createSliceHook<TSlice>(pickSlice: (state: ExplorerStore) => TSlice): {
  (): TSlice
  <T>(selector: (slice: TSlice) => T): T
} {
  function useSlice(): TSlice
  function useSlice<T>(selector: (slice: TSlice) => T): T
  function useSlice<T>(selector?: (slice: TSlice) => T): TSlice | T {
    const pick = selector ?? ((slice: TSlice) => slice as unknown as T)
    return useExplorerStore(useShallow((state) => pick(pickSlice(state))))
  }
  return useSlice
}

export const useWorkspaceSlice = createSliceHook(pickWorkspaceSlice)
export const useListSlice = createSliceHook(pickListSlice)
export const useRadarSlice = createSliceHook(pickRadarSlice)
export const useEquitySlice = createSliceHook(pickEquitySlice)
export const useResilienceSlice = createSliceHook(pickResilienceSlice)
