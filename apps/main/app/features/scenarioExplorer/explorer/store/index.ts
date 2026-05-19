/**
 * Explorer tools store - one Zustand instance composed from store slices
 *
 * Each `*StoreSlice.ts` file defines a named group of fields on this single
 * store. Slices are organizational only.
 *
 *   workspaceStoreSlice  - cross-tool: selection, share, toolbar, hydroclimate
 *   listStoreSlice       - filters, sort, pins (filters also feed sidebar ordering)
 *   radarStoreSlice      - radar axes and display toggles
 *   equityStoreSlice     - distribution comparison and share outcome codes
 *   resilienceStoreSlice - heatmap control fields
 *
 * Prefer slice hooks (`useWorkspaceSlice`, etc.) for React subscriptions.
 * Use `useExplorerStore.getState()` / `setState` for imperative paths.
 * See `useToolSlices.ts` for definitions and examples.
 */

export type { ExploreMode, OutcomeDisplayMode, TourTool } from "./types"
export type { ShareItem, ShareItemPatch } from "./types"
export {
  DEFAULT_RESILIENCE_CONTROLS,
  selectResilienceControls,
} from "./resilienceStoreSlice"
export type {
  ResilienceControlsState,
  ResilienceView,
  AggregateOver,
  CellEncoding,
  DeltaMode,
  AggregateScope,
} from "./resilienceStoreSlice"

export type { ExplorerStore } from "./storeInstance"
export { useExplorerStore } from "./storeInstance"

export {
  useWorkspaceSlice,
  useListSlice,
  useRadarSlice,
  useEquitySlice,
  useResilienceSlice,
} from "./useToolSlices"

export {
  EXPLORE_SESSION_STORAGE_KEY,
  loadExploreSessionState,
} from "./exploreSessionPersist"
