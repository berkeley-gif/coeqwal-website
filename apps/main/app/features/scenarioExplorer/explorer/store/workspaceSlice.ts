/**
 * Workspace slice - cross-tool "Explore tab" state
 *
 * Fields here are read or written by more than one tool, or by chrome that wraps
 * every tool (toolbar, share drawer, sub-nav, hydroclimate chooser).
 *
 * What belongs here vs a tool slice:
 *   - Workspace: active tool tab, sidebar multi-select, share tray, map toggle,
 *     hydroclimate, toolbar chips that appear in multiple modes
 *   - Tool slice (listSlice, radarSlice, …): state that only one panel cares about,
 *     but should persist when the user switches tools and comes back
 *   - Local useState: hover, layout mode, modal open, panel-only picks
 *
 * Sidebar vs List grid - intentional sharing, not duplicate keys:
 *   `selectedScenarios` lives here and is written by both the List row checkboxes
 *   and ScenarioSelectionSidebar (radar, equity, resilience, data). List-only
 *   sticky comparison rows use `pinnedScenarioIds` in listSlice instead.
 *
 *   Search, theme, icon, sort, and "chosen only" filters live in listSlice but
 *   are also consumed by ScenarioSelectionSidebar via `useOrderedScenarios`. That
 *   keeps one row order and filter set across List and sidebar tools when the user
 *   switches tabs. Those fields are not copied into a second slice.
 *
 * Distribution (equity) is a special case: `equityFocusScenario` is a single-select
 * focus kept separate from `selectedScenarios` until product merges them.
 */

import type { TourTool } from "../tools/tour/types"
import type { ShareItem, ShareItemPatch } from "../share/types"
import { loadShareState } from "../share/persist"
import type { ExploreMode, OutcomeDisplayMode } from "./types"

const persisted = loadShareState()

export interface WorkspaceState {
  // --- Navigation (ExploreSubNav, tool tours) ---
  exploreMode: ExploreMode
  tour: { tool: TourTool | null; step: number }

  // --- Scenario selection (List checkboxes + ScenarioSelectionSidebar) ---
  selectedScenarios: string[]
  highlightedScenario: string | null
  /** Distribution-only single focus, separate from multi-select */
  equityFocusScenario: string | null

  // --- Toolbar chrome (ToolToolbar, shared across list and sidebar layouts) ---
  showAlternativeBaselines: boolean
  showDefinitions: boolean
  showKeyOperations: boolean
  outcomeDisplayMode: OutcomeDisplayMode
  showMap: boolean

  // --- Share drawer (ShareDrawer, URL rehydration, useExploreShareCapture) ---
  shareItems: ShareItem[]
  storyItemIds: string[]
  showShareDrawer: boolean
  shareUrlVersionMismatch: boolean

  // --- Chart cosmetics (radar panel, tier overlays; some list/radar hooks) ---
  relativeToBaseline: boolean
  highlightBaseline: boolean
  overlayTiers: boolean
  defineOutcome: boolean
  showTierZones: boolean

  // --- Hydroclimate (ToolToolbar chooser, all tier/data hooks) ---
  hydroclimate: string
}

export interface WorkspaceActions {
  setExploreMode: (mode: ExploreMode) => void

  toggleScenario: (scenarioId: string) => void
  selectScenarios: (scenarioIds: string[]) => void
  clearScenarios: () => void
  setEquityFocusScenario: (scenarioId: string | null) => void
  setHighlightedScenario: (scenarioId: string | null) => void

  setShowAlternativeBaselines: (show: boolean) => void
  setShowDefinitions: (show: boolean) => void
  setShowKeyOperations: (show: boolean) => void
  setOutcomeDisplayMode: (mode: OutcomeDisplayMode) => void
  setShowMap: (show: boolean) => void

  addShareItem: (item: ShareItem) => void
  removeShareItem: (id: string) => void
  clearShareItems: () => void
  setShareItems: (items: ShareItem[]) => void
  updateShareItem: (id: string, patch: ShareItemPatch) => void
  setShowShareDrawer: (open: boolean) => void
  setShareUrlVersionMismatch: (mismatch: boolean) => void
  dismissShareUrlVersionMismatch: () => void
  addToStory: (id: string) => void
  removeFromStory: (id: string) => void
  reorderStory: (orderedIds: string[]) => void

  setRelativeToBaseline: (show: boolean) => void
  setHighlightBaseline: (show: boolean) => void
  setOverlayTiers: (show: boolean) => void
  setDefineOutcome: (show: boolean) => void
  setShowTierZones: (show: boolean) => void

  setHydroclimate: (value: string) => void

  startToolTour: (tool: TourTool) => void
  endTour: () => void
  setTourStep: (step: number) => void
}

export type WorkspaceSlice = WorkspaceState & WorkspaceActions

export const workspaceInitialState: WorkspaceState = {
  exploreMode: "list",
  tour: { tool: null, step: 0 },
  selectedScenarios: [],
  highlightedScenario: null,
  equityFocusScenario: null,
  showAlternativeBaselines: false,
  showDefinitions: true,
  showKeyOperations: false,
  outcomeDisplayMode: "bar",
  showMap: false,
  shareItems: persisted.shareItems,
  storyItemIds: persisted.storyItemIds,
  showShareDrawer: false,
  shareUrlVersionMismatch: false,
  relativeToBaseline: true,
  highlightBaseline: false,
  overlayTiers: false,
  defineOutcome: false,
  showTierZones: true,
  hydroclimate: "historical",
}

type ImmerSet = (fn: (state: WorkspaceSlice) => void) => void

export function createWorkspaceSlice(set: ImmerSet): WorkspaceSlice {
  return {
    ...workspaceInitialState,

    setExploreMode: (mode) =>
      set((state) => {
        if (state.exploreMode !== mode) {
          state.tour = { tool: null, step: 0 }
        }
        state.exploreMode = mode
      }),

    toggleScenario: (scenarioId) =>
      set((state) => {
        const index = state.selectedScenarios.indexOf(scenarioId)
        if (index > -1) {
          state.selectedScenarios.splice(index, 1)
        } else {
          state.selectedScenarios.push(scenarioId)
        }
      }),

    selectScenarios: (scenarioIds) =>
      set((state) => {
        state.selectedScenarios = scenarioIds
      }),

    clearScenarios: () =>
      set((state) => {
        state.selectedScenarios = []
      }),

    setEquityFocusScenario: (scenarioId) =>
      set((state) => {
        state.equityFocusScenario = scenarioId
      }),

    setHighlightedScenario: (scenarioId) =>
      set((state) => {
        state.highlightedScenario = scenarioId
      }),

    setShowAlternativeBaselines: (show) =>
      set((state) => {
        state.showAlternativeBaselines = show
      }),

    setShowDefinitions: (show) =>
      set((state) => {
        state.showDefinitions = show
      }),

    setShowKeyOperations: (show) =>
      set((state) => {
        state.showKeyOperations = show
      }),

    setOutcomeDisplayMode: (mode) =>
      set((state) => {
        state.outcomeDisplayMode = mode
      }),

    setShowMap: (show) =>
      set((state) => {
        state.showMap = show
      }),

    addShareItem: (item) =>
      set((state) => {
        if (item.type === "barChart") {
          const exists = state.shareItems.some(
            (s) =>
              s.type === "barChart" &&
              s.scenarioId === item.scenarioId &&
              s.viewMode === item.viewMode &&
              s.hydroclimate === item.hydroclimate,
          )
          if (exists) return
        }
        state.shareItems.push(item)
        state.showShareDrawer = true
      }),

    removeShareItem: (id) =>
      set((state) => {
        const idx = state.shareItems.findIndex((s) => s.id === id)
        if (idx > -1) state.shareItems.splice(idx, 1)
        const storyIdx = state.storyItemIds.indexOf(id)
        if (storyIdx > -1) state.storyItemIds.splice(storyIdx, 1)
      }),

    clearShareItems: () =>
      set((state) => {
        state.shareItems = []
        state.storyItemIds = []
      }),

    setShareItems: (items) =>
      set((state) => {
        state.shareItems = items
      }),

    updateShareItem: (id, patch) =>
      set((state) => {
        const item = state.shareItems.find((s) => s.id === id)
        if (item) Object.assign(item, patch)
      }),

    setShowShareDrawer: (open) =>
      set((state) => {
        state.showShareDrawer = open
      }),

    setShareUrlVersionMismatch: (mismatch) =>
      set((state) => {
        state.shareUrlVersionMismatch = mismatch
      }),

    dismissShareUrlVersionMismatch: () =>
      set((state) => {
        state.shareUrlVersionMismatch = false
      }),

    addToStory: (id) =>
      set((state) => {
        if (!state.storyItemIds.includes(id)) {
          state.storyItemIds.push(id)
        }
      }),

    removeFromStory: (id) =>
      set((state) => {
        const idx = state.storyItemIds.indexOf(id)
        if (idx > -1) state.storyItemIds.splice(idx, 1)
      }),

    reorderStory: (orderedIds) =>
      set((state) => {
        state.storyItemIds = orderedIds
      }),

    setRelativeToBaseline: (show) =>
      set((state) => {
        state.relativeToBaseline = show
      }),

    setHighlightBaseline: (show) =>
      set((state) => {
        state.highlightBaseline = show
      }),

    setOverlayTiers: (show) =>
      set((state) => {
        state.overlayTiers = show
      }),

    setDefineOutcome: (show) =>
      set((state) => {
        state.defineOutcome = show
      }),

    setShowTierZones: (show) =>
      set((state) => {
        state.showTierZones = show
      }),

    setHydroclimate: (value) =>
      set((state) => {
        state.hydroclimate = value
      }),

    startToolTour: (tool) =>
      set((state) => {
        state.tour = { tool, step: 0 }
        state.exploreMode = tool
      }),

    endTour: () =>
      set((state) => {
        state.tour = { tool: null, step: 0 }
      }),

    setTourStep: (step) =>
      set((state) => {
        state.tour.step = step
      }),
  }
}
