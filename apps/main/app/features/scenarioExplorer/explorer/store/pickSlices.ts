/**
 * Picks out store slice views from the composed explorer store.
 *
 * What is a store slice?
 * --------------------
 * `useExplorerStore` is one Zustand object. A store slice is a named group of
 * fields on that object, organized in files like `radarStoreSlice.ts`. Slices
 * are organizational only. There is still a single store at runtime.
 *
 * Example:
 *   state = {
 *     selectedScenarios: ["s1", "s2"],   // workspaceStoreSlice
 *     searchQuery: "delta",              // listStoreSlice
 *     showRadarRange: true,              // radarStoreSlice
 *     setShowRadarRange: fn,
 *     ...
 *   }
 *   pickRadarSlice(state) =>
 *     { showRadarRange: true, setShowRadarRange: fn, showDotsOnly: false, ... }
 *
 * Persist key index
 * -----------------
 * Keys in `*_PERSIST_KEYS` are written to sessionStorage. For the full
 * persistence story (load/save flow, what survives reload, localStorage share
 * tray), see `exploreSessionPersist.ts`.
 *
 * Used by:
 *   - Slice facade hooks (`useRadarSlice`, `useWorkspaceSlice`, etc.) in `useToolSlices.ts`
 *   - sessionStorage persistence in `exploreSessionPersist.ts`
 */

import type { WorkspaceSlice, WorkspaceState } from "./workspaceStoreSlice"
import type { ListSlice, ListState } from "./listStoreSlice"
import type { RadarSlice, RadarState } from "./radarStoreSlice"
import type { EquitySlice, EquityState } from "./equityStoreSlice"
import type { ResilienceSlice, ResilienceState } from "./resilienceStoreSlice"

type ExplorerStore = WorkspaceSlice &
  ListSlice &
  RadarSlice &
  EquitySlice &
  ResilienceSlice

export type ShellMainView = "get-started" | "explorer"

export interface ShellPersistedState {
  mainView: ShellMainView
}

/** Shell routing restored after reload */
export const SHELL_PERSIST_KEYS = [
  "mainView",
] as const satisfies readonly (keyof ShellPersistedState)[]

/** Scenario selection and active tool tab */
export const WORKSPACE_SELECTION_PERSIST_KEYS = [
  "selectedScenarios",
  "equityFocusScenario",
  "exploreMode",
  "hydroclimate",
] as const satisfies readonly (keyof WorkspaceState)[]

/** Toolbar chips and map toggle */
export const WORKSPACE_TOOLBAR_PERSIST_KEYS = [
  "showMap",
  "showDefinitions",
  "showKeyOperations",
  "showAlternativeBaselines",
  "outcomeDisplayMode",
] as const satisfies readonly (keyof WorkspaceState)[]

/** Shared chart overlay toggles */
export const WORKSPACE_CHART_COSMETICS_PERSIST_KEYS = [
  "relativeToBaseline",
  "highlightBaseline",
  "overlayTiers",
  "defineOutcome",
  "showTierZones",
] as const satisfies readonly (keyof WorkspaceState)[]

/** Hover highlight, share drawer, in-progress tool tour */
export const WORKSPACE_UI_PERSIST_KEYS = [
  "highlightedScenario",
  "showShareDrawer",
  "tour",
] as const satisfies readonly (keyof WorkspaceState)[]

/** All workspace fields written to sessionStorage */
export const WORKSPACE_PERSIST_KEYS = [
  ...WORKSPACE_SELECTION_PERSIST_KEYS,
  ...WORKSPACE_TOOLBAR_PERSIST_KEYS,
  ...WORKSPACE_CHART_COSMETICS_PERSIST_KEYS,
  ...WORKSPACE_UI_PERSIST_KEYS,
] as const satisfies readonly (keyof WorkspaceState)[]

/** List tool settings restored after reload */
export const LIST_PERSIST_KEYS = [
  "pinnedScenarioIds",
  "maxPinnedScenarios",
  "searchQuery",
  "showOnlyChosen",
  "selectedTheme",
  "showOnlyTheme",
  "showThemeBadges",
  "selectedIconId",
  "groupByTheme",
  "sortBy",
  "sortDirection",
] as const satisfies readonly (keyof ListState)[]

/** Radar tool settings restored after reload */
export const RADAR_PERSIST_KEYS = [
  "showRadarRange",
  "showDotsOnly",
  "radarShowAll",
  "radarVisibleAxes",
] as const satisfies readonly (keyof RadarState)[]

/** Distribution tool settings restored after reload */
export const EQUITY_PERSIST_KEYS = [
  "showEquityComparison",
  "equityVisibleOutcomes",
] as const satisfies readonly (keyof EquityState)[]

/**
 * Resilience tool settings restored after reload.
 * `resilienceSelectedHydroclimates` is a Set at runtime and is serialized as
 * a string array in `pickResiliencePersistedState`.
 */
export const RESILIENCE_PERSIST_KEYS = [
  "resilienceVisibleOutcomes",
  "resilienceDistributionMode",
  "resilienceView",
  "resilienceCellEncoding",
  "resilienceDeltaMode",
  "resilienceDeltaBaselineScenarioId",
  "resilienceAggregateScope",
  "resilienceReorderBySimilarity",
  "resilienceShowMarginals",
  "resilienceShowAllScenarios",
  "resilienceShowCellNumbers",
  "resiliencePrimaryOutcomeCode",
  "resilienceCompareOutcomeCodes",
  "resilienceExpandedRegionalOutcomes",
  "resilienceTransposed",
  "resilienceAggregateOver",
] as const satisfies readonly (keyof ResilienceState)[]

/** List fields kept in memory only (not written to sessionStorage) */
export const LIST_EPHEMERAL_STATE_KEYS = [
  "pinCapReached",
  "stashedPinnedScenarioIds",
  "pinsTrimmedForMap",
] as const satisfies readonly (keyof ListState)[]

/** Radar fields kept in memory only */
export const RADAR_EPHEMERAL_STATE_KEYS = [
  "showAxisSelector",
] as const satisfies readonly (keyof RadarState)[]

/** Resilience fields kept in memory only */
export const RESILIENCE_EPHEMERAL_STATE_KEYS = [
  "showResilienceOutcomeSelector",
] as const satisfies readonly (keyof ResilienceState)[]

/** Workspace fields never in sessionStorage (share uses localStorage) */
export const WORKSPACE_NON_PERSIST_STATE_KEYS = [
  "shareItems",
  "storyItemIds",
  "shareUrlVersionMismatch",
] as const satisfies readonly (keyof WorkspaceState)[]

const WORKSPACE_ACTION_KEYS = [
  "setExploreMode",
  "toggleScenario",
  "selectScenarios",
  "clearScenarios",
  "setEquityFocusScenario",
  "setHighlightedScenario",
  "setShowAlternativeBaselines",
  "setShowDefinitions",
  "setShowKeyOperations",
  "setOutcomeDisplayMode",
  "setShowMap",
  "addShareItem",
  "removeShareItem",
  "clearShareItems",
  "setShareItems",
  "updateShareItem",
  "setShowShareDrawer",
  "setShareUrlVersionMismatch",
  "dismissShareUrlVersionMismatch",
  "addToStory",
  "removeFromStory",
  "reorderStory",
  "setRelativeToBaseline",
  "setHighlightBaseline",
  "setOverlayTiers",
  "setDefineOutcome",
  "setShowTierZones",
  "setHydroclimate",
  "startToolTour",
  "endTour",
  "setTourStep",
] as const satisfies readonly (keyof WorkspaceSlice)[]

const LIST_ACTION_KEYS = [
  "togglePinnedScenario",
  "setMaxPinnedScenarios",
  "dismissPinCapReached",
  "stashAndTrimPins",
  "restoreStashedPins",
  "dismissPinsTrimmedForMap",
  "setSearchQuery",
  "setShowOnlyChosen",
  "setSelectedTheme",
  "setShowOnlyTheme",
  "setShowThemeBadges",
  "setSelectedIconId",
  "setGroupByTheme",
  "setSortBy",
  "setSortDirection",
] as const satisfies readonly (keyof ListSlice)[]

const RADAR_ACTION_KEYS = [
  "setShowRadarRange",
  "setShowDotsOnly",
  "setRadarShowAll",
  "setShowAxisSelector",
  "toggleRadarAxis",
  "setRadarVisibleAxes",
] as const satisfies readonly (keyof RadarSlice)[]

const EQUITY_ACTION_KEYS = [
  "setShowEquityComparison",
  "setEquityVisibleOutcomes",
] as const satisfies readonly (keyof EquitySlice)[]

const RESILIENCE_ACTION_KEYS = [
  "setShowResilienceOutcomeSelector",
  "toggleResilienceOutcome",
  "setResilienceVisibleOutcomes",
  "setResilienceDistributionMode",
  "setResilienceView",
  "setResilienceCellEncoding",
  "setResilienceDeltaMode",
  "setResilienceDeltaBaselineScenarioId",
  "setResilienceAggregateScope",
  "setResilienceReorderBySimilarity",
  "setResilienceShowMarginals",
  "setResilienceShowAllScenarios",
  "setResilienceSelectedHydroclimates",
  "setResilienceShowCellNumbers",
  "setResiliencePrimaryOutcomeCode",
  "setResilienceCompareOutcomeCodes",
  "setResilienceExpandedRegionalOutcomes",
  "setResilienceTransposed",
  "setResilienceAggregateOver",
] as const satisfies readonly (keyof ResilienceSlice)[]

function pickKeys<T extends object, K extends keyof T>(
  state: T,
  keys: readonly K[],
): Pick<T, K> {
  const picked = {} as Pick<T, K>
  for (const key of keys) {
    picked[key] = state[key]
  }
  return picked
}

export function pickShellPersistedState(state: {
  mainView: ShellMainView
}): ShellPersistedState {
  return pickKeys(state, SHELL_PERSIST_KEYS)
}

export function pickWorkspacePersistedState(
  state: WorkspaceState,
): Pick<WorkspaceState, (typeof WORKSPACE_PERSIST_KEYS)[number]> {
  return pickKeys(state, WORKSPACE_PERSIST_KEYS)
}

export function pickListPersistedState(state: ListState): Partial<ListState> {
  return pickKeys(state, LIST_PERSIST_KEYS)
}

export function pickRadarPersistedState(
  state: RadarState,
): Partial<RadarState> {
  return pickKeys(state, RADAR_PERSIST_KEYS)
}

export function pickEquityPersistedState(
  state: EquityState,
): Partial<EquityState> {
  return pickKeys(state, EQUITY_PERSIST_KEYS)
}

export function pickResiliencePersistedState(state: ResilienceState): Partial<
  Omit<ResilienceState, "resilienceSelectedHydroclimates">
> & {
  resilienceSelectedHydroclimates?: ResilienceHydroclimatePersisted
} {
  const picked = pickKeys(state, RESILIENCE_PERSIST_KEYS)
  return {
    ...picked,
    resilienceSelectedHydroclimates: [
      ...state.resilienceSelectedHydroclimates,
    ] as ResilienceHydroclimatePersisted,
  }
}

export type ResilienceHydroclimatePersisted = string[]

export function pickWorkspaceSlice(state: ExplorerStore): WorkspaceSlice {
  return {
    ...pickKeys(state, [
      ...WORKSPACE_PERSIST_KEYS,
      ...WORKSPACE_NON_PERSIST_STATE_KEYS,
    ] as const),
    ...pickKeys(state, WORKSPACE_ACTION_KEYS),
  }
}

export function pickListSlice(state: ExplorerStore): ListSlice {
  return {
    ...pickKeys(state, [...LIST_PERSIST_KEYS, ...LIST_EPHEMERAL_STATE_KEYS]),
    ...pickKeys(state, LIST_ACTION_KEYS),
  }
}

export function pickRadarSlice(state: ExplorerStore): RadarSlice {
  return {
    ...pickKeys(state, [...RADAR_PERSIST_KEYS, ...RADAR_EPHEMERAL_STATE_KEYS]),
    ...pickKeys(state, RADAR_ACTION_KEYS),
  }
}

export function pickEquitySlice(state: ExplorerStore): EquitySlice {
  return {
    ...pickKeys(state, EQUITY_PERSIST_KEYS),
    ...pickKeys(state, EQUITY_ACTION_KEYS),
  }
}

export function pickResilienceSlice(state: ExplorerStore): ResilienceSlice {
  return {
    ...pickKeys(state, [
      ...RESILIENCE_PERSIST_KEYS,
      ...RESILIENCE_EPHEMERAL_STATE_KEYS,
      "resilienceSelectedHydroclimates",
    ] as const),
    ...pickKeys(state, RESILIENCE_ACTION_KEYS),
  }
}

export function pickExplorerPersistedSession(state: ExplorerStore) {
  return {
    workspace: pickWorkspacePersistedState(state),
    list: pickListPersistedState(state),
    radar: pickRadarPersistedState(state),
    equity: pickEquityPersistedState(state),
    resilience: pickResiliencePersistedState(state),
  }
}
