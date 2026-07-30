/**
 * Data store slice - Data-in-Depth "Explorer" mode session state.
 *
 * Drives the by-variable explorer (sector rail -> variable -> view, compared
 * along a single axis). The legacy "By category" accordion does not read this
 * slice. Tool settings here survive a page reload within the same tab
 * (see `exploreSessionPersist.ts`).
 *
 * What lives here vs. elsewhere
 * -----------------------------
 * - The scenario compare-set is NOT stored here: in "compare by scenarios"
 *   mode the members are the workspace selection (`selectedScenarios`),
 *   resolved and capped at read time with Current Operations locked first.
 * - `pinnedScenario` / `pinnedClimate` / `pinnedLocationByGroup` hold the
 *   single held-constant value used by the other two compare axes.
 * - `selectedClimates` / `selectedLocationsByGroup` hold the multi-member set
 *   for "compare by climates" / "compare by locations". Empty means "seed a
 *   default from the resolved list in the controls".
 *
 * Climate values are opaque hydroclimate keys; this slice never resolves them
 * to API ids. Resolution happens in the data hook via the resolver hooks.
 */

import type { VariableView } from "../tools/panels/dataInDepth/config/variableRegistry"
import {
  DEFAULT_VARIABLE_ID,
  defaultLocationSelection,
} from "../tools/panels/dataInDepth/config/variableRegistry"
import { toggleWytClass } from "../tools/panels/dataInDepth/config/wytFilter"

/** How the annual-distribution view is drawn. */
export type DataDistKind = "exceedance" | "box"

/** The single axis the explorer compares members along. */
export type DataCompareBy = "scenarios" | "climates" | "locations"

export interface DataState {
  /** Registry id of the variable on screen */
  selectedVariableId: string
  /** Which view of the variable is shown */
  view: VariableView
  /** Chart style for the annual-distribution view */
  distKind: DataDistKind
  /** Which axis holds multiple members; the other two are held constant */
  compareBy: DataCompareBy
  /** Water-year-type filter (Sacramento index classes 1-5); empty = all years */
  selectedWaterYearTypes: number[]
  /** Held-constant scenario for climate/location compare (null -> reference) */
  pinnedScenario: string | null
  /** Held-constant hydroclimate for scenario/location compare (null -> default) */
  pinnedClimate: string | null
  /** Held-constant location per location group */
  pinnedLocationByGroup: Record<string, string>
  /** Multi-member set for "compare by climates" (empty -> seed default) */
  selectedClimates: string[]
  /** Multi-member set per group for "compare by locations" (empty -> seed) */
  selectedLocationsByGroup: Record<string, string[]>
  /** Variables rail collapsed to a slim strip */
  variableRailCollapsed: boolean
}

export interface DataActions {
  setSelectedVariableId: (id: string) => void
  setView: (view: VariableView) => void
  setDistKind: (kind: DataDistKind) => void
  setCompareBy: (by: DataCompareBy) => void
  setPinnedScenario: (scenarioId: string | null) => void
  setPinnedClimate: (climate: string | null) => void
  setPinnedLocation: (groupId: string, locationId: string) => void
  setSelectedClimates: (climates: string[]) => void
  setSelectedLocations: (groupId: string, locationIds: string[]) => void
  setVariableRailCollapsed: (collapsed: boolean) => void
  toggleWaterYearType: (wyt: number) => void
  clearWaterYearTypes: () => void
}

export type DataSlice = DataState & DataActions

export const dataInitialState: DataState = {
  selectedVariableId: DEFAULT_VARIABLE_ID,
  view: "dist",
  distKind: "exceedance",
  compareBy: "scenarios",
  selectedWaterYearTypes: [],
  pinnedScenario: null,
  pinnedClimate: null,
  pinnedLocationByGroup: defaultLocationSelection(),
  selectedClimates: [],
  selectedLocationsByGroup: {},
  variableRailCollapsed: false,
}

type ImmerSet = (fn: (state: DataSlice) => void) => void

export function createDataSlice(
  set: ImmerSet,
  initial: DataState = dataInitialState,
): DataSlice {
  return {
    ...initial,

    setSelectedVariableId: (id) =>
      set((state) => {
        state.selectedVariableId = id
      }),

    setView: (view) =>
      set((state) => {
        state.view = view
      }),

    setDistKind: (kind) =>
      set((state) => {
        state.distKind = kind
      }),

    setCompareBy: (by) =>
      set((state) => {
        state.compareBy = by
      }),

    setPinnedScenario: (scenarioId) =>
      set((state) => {
        state.pinnedScenario = scenarioId
      }),

    setPinnedClimate: (climate) =>
      set((state) => {
        state.pinnedClimate = climate
      }),

    setPinnedLocation: (groupId, locationId) =>
      set((state) => {
        state.pinnedLocationByGroup[groupId] = locationId
      }),

    setSelectedClimates: (climates) =>
      set((state) => {
        state.selectedClimates = climates
      }),

    setSelectedLocations: (groupId, locationIds) =>
      set((state) => {
        state.selectedLocationsByGroup[groupId] = locationIds
      }),

    setVariableRailCollapsed: (collapsed) =>
      set((state) => {
        state.variableRailCollapsed = collapsed
      }),
    toggleWaterYearType: (wyt) =>
      set((state) => {
        state.selectedWaterYearTypes = toggleWytClass(
          state.selectedWaterYearTypes,
          wyt,
        )
      }),
    clearWaterYearTypes: () =>
      set((state) => {
        state.selectedWaterYearTypes = []
      }),
  }
}
