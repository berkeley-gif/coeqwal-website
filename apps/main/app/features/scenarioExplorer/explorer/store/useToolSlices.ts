"use client"

/**
 * Store slice facade hooks.
 *
 * ## When to use slice hooks vs `useExplorerStore`
 *
 * **React subscription** (use a slice hook): a component or hook calls
 * `useWorkspaceSlice()`, `useRadarSlice()`, etc. Zustand re-renders that
 * caller when the selected slice fields change. Default for UI that displays
 * or reacts to store state.
 *
 * **Imperative path** (use `useExplorerStore.getState()` or `.setState()`):
 * one-off reads or writes outside the render cycle. Common in `useEffect`
 * bodies, handlers that need a snapshot without subscribing, URL
 * rehydration, share capture at click time, and batch writers like
 * `writeControlsChange`. No subscription is registered, so these do not
 * trigger re-renders on their own.
 *
 * That is the intended split: slice hooks for React subscriptions,
 * `useExplorerStore.getState()` / `setState` for imperative paths.
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
