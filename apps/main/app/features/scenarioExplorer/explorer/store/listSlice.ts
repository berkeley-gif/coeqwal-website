/**
 * List slice - List tool session state (pins, filters, sort). Persists when switching away from List and back.
 *
 * Overlap with ScenarioSelectionSidebar is by design, not duplicate storage:
 *   - `searchQuery`, `showOnlyChosen`, theme/icon filters, and sort fields here
 *     are also read by the sidebar through `useOrderedScenarios`, so row order
 *     and filtering stay consistent across List and radar/equity/resilience/data.
 *   - `pinnedScenarioIds` is List-only. The sidebar never reads pins.
 *   - Multi-select checkboxes use `selectedScenarios` from workspaceSlice, not here.
 */

import type { ScenarioTheme } from "../../../../content/scenarios"

export interface ListState {
  // List-only sticky comparison rows (StrategyGrid, not sidebar)
  pinnedScenarioIds: string[]
  maxPinnedScenarios: number
  pinCapReached: boolean
  stashedPinnedScenarioIds: string[] | null
  pinsTrimmedForMap: boolean

  // Shared with ScenarioSelectionSidebar via useOrderedScenarios
  searchQuery: string
  showOnlyChosen: boolean
  selectedTheme: ScenarioTheme | null
  showOnlyTheme: boolean
  showThemeBadges: boolean
  selectedIconId: string | null
  groupByTheme: boolean
  sortBy: string | null
  sortDirection: "asc" | "desc"
}

export interface ListActions {
  togglePinnedScenario: (scenarioId: string) => void
  setMaxPinnedScenarios: (max: number) => void
  dismissPinCapReached: () => void
  stashAndTrimPins: (keepCount: number) => void
  restoreStashedPins: () => void
  dismissPinsTrimmedForMap: () => void

  setSearchQuery: (query: string) => void
  setShowOnlyChosen: (show: boolean) => void
  setSelectedTheme: (theme: ScenarioTheme | null) => void
  setShowOnlyTheme: (show: boolean) => void
  setShowThemeBadges: (show: boolean) => void
  setSelectedIconId: (iconId: string | null) => void
  setGroupByTheme: (group: boolean) => void
  setSortBy: (outcome: string | null) => void
  setSortDirection: (direction: "asc" | "desc") => void
}

export type ListSlice = ListState & ListActions

export const listInitialState: ListState = {
  pinnedScenarioIds: [],
  maxPinnedScenarios: 5,
  pinCapReached: false,
  stashedPinnedScenarioIds: null,
  pinsTrimmedForMap: false,
  searchQuery: "",
  showOnlyChosen: false,
  selectedTheme: null,
  showOnlyTheme: false,
  showThemeBadges: false,
  selectedIconId: null,
  groupByTheme: true,
  sortBy: null,
  sortDirection: "asc",
}

type ImmerSet = (fn: (state: ListSlice) => void) => void

export function createListSlice(set: ImmerSet): ListSlice {
  return {
    ...listInitialState,

    togglePinnedScenario: (scenarioId) =>
      set((state) => {
        const idx = state.pinnedScenarioIds.indexOf(scenarioId)
        if (idx >= 0) {
          state.pinnedScenarioIds.splice(idx, 1)
          state.pinCapReached = false
        } else if (state.pinnedScenarioIds.length >= state.maxPinnedScenarios) {
          state.pinCapReached = true
        } else {
          state.pinnedScenarioIds.push(scenarioId)
        }
      }),

    setMaxPinnedScenarios: (max) =>
      set((state) => {
        state.maxPinnedScenarios = max
      }),

    dismissPinCapReached: () =>
      set((state) => {
        state.pinCapReached = false
      }),

    stashAndTrimPins: (keepCount) =>
      set((state) => {
        state.stashedPinnedScenarioIds = [...state.pinnedScenarioIds]
        state.pinnedScenarioIds = state.pinnedScenarioIds.slice(-keepCount)
        state.pinCapReached = false
        state.pinsTrimmedForMap = true
      }),

    restoreStashedPins: () =>
      set((state) => {
        if (state.stashedPinnedScenarioIds !== null) {
          state.pinnedScenarioIds = state.stashedPinnedScenarioIds
          state.stashedPinnedScenarioIds = null
        }
        state.pinsTrimmedForMap = false
      }),

    dismissPinsTrimmedForMap: () =>
      set((state) => {
        state.pinsTrimmedForMap = false
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query
      }),

    setShowOnlyChosen: (show) =>
      set((state) => {
        state.showOnlyChosen = show
      }),

    setSelectedTheme: (theme) =>
      set((state) => {
        state.selectedTheme = theme
        if (theme === null) {
          state.showOnlyTheme = false
        }
      }),

    setShowOnlyTheme: (show) =>
      set((state) => {
        state.showOnlyTheme = show
      }),

    setShowThemeBadges: (show) =>
      set((state) => {
        state.showThemeBadges = show
      }),

    setSelectedIconId: (iconId) =>
      set((state) => {
        state.selectedIconId = iconId
      }),

    setGroupByTheme: (group) =>
      set((state) => {
        state.groupByTheme = group
        if (group) {
          state.sortBy = null
        }
      }),

    setSortBy: (outcome) =>
      set((state) => {
        state.sortBy = outcome
        if (outcome !== null) {
          state.groupByTheme = false
        }
      }),

    setSortDirection: (direction) =>
      set((state) => {
        state.sortDirection = direction
      }),
  }
}
