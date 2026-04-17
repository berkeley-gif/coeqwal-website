/**
 * Scenario Explorer store - state management for multi-view scenario exploration
 *
 * This store manages state that is shared across multiple components in the
 * Scenario Explorer feature. Local UI state (like modal open/close, hover states)
 * should remain in individual components.
 */

import { create, immer } from "@repo/state/zustand"
import type { ScenarioTheme } from "../../content/scenarios"
import { OUTCOME_CODE_ORDER } from "../../content/outcomes"

// ============================================================================
// Types
// ============================================================================

/**
 * The current tool within the explorer view.
 */
export type ExploreMode =
  | "list"
  | "radar"
  | "equity"
  | "comparison"
  | "resilience"
  | "data"

/**
 * The main view within the Explore section.
 * - explorer: "Choose scenarios" view with tool modes (list/map/comparison)
 * - data: "Explore data in depth" view
 */
export type MainView = "get-started" | "explorer" | "data"

/**
 * A single item staged for the Share tab composition grid.
 * The union discriminant `type` determines which rendering path is used.
 */
export type ShareItem =
  | {
      id: string
      type: "barChart"
      scenarioId: string
      viewMode: "summary" | "distribution"
      hydroclimate: string
      cachedImageDataUrl?: string
      cachedChartData?: Record<string, unknown>
    }
  | {
      id: string
      type: "radar"
      scenarioIds: string[]
      scenarioColors?: string[]
      axes: string[]
      showRange: boolean
      highlightBaseline: boolean
      showDotsOnly: boolean
      hydroclimate: string
      cachedImageDataUrl?: string
      cachedChartData?: Record<string, unknown>
    }

// ============================================================================
// Manual localStorage persistence for shareItems + storyItemIds
// ============================================================================

const SHARE_STORAGE_KEY = "coeqwal-share-v1"

function loadShareState(): {
  shareItems: ShareItem[]
  storyItemIds: string[]
} {
  try {
    if (typeof window === "undefined") {
      return { shareItems: [], storyItemIds: [] }
    }
    const raw = localStorage.getItem(SHARE_STORAGE_KEY)
    if (!raw) return { shareItems: [], storyItemIds: [] }
    const parsed = JSON.parse(raw)
    return {
      shareItems: Array.isArray(parsed.shareItems) ? parsed.shareItems : [],
      storyItemIds: Array.isArray(parsed.storyItemIds)
        ? parsed.storyItemIds
        : [],
    }
  } catch {
    return { shareItems: [], storyItemIds: [] }
  }
}

function saveShareState(shareItems: ShareItem[], storyItemIds: string[]) {
  try {
    if (typeof window === "undefined") return
    const stripped = shareItems.map((item) => {
      if (item.type === "barChart") {
        const { cachedImageDataUrl, cachedChartData, ...rest } = item
        return rest
      }
      const { cachedChartData, ...rest } = item
      return rest
    })
    localStorage.setItem(
      SHARE_STORAGE_KEY,
      JSON.stringify({ shareItems: stripped, storyItemIds }),
    )
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// ============================================================================
// State Interface
// ============================================================================

interface ScenarioExplorerState {
  // Navigation
  mainView: MainView
  exploreMode: ExploreMode

  // Scenario selection (shared across all views)
  selectedScenarios: string[]
  highlightedScenario: string | null
  pinnedScenarioIds: string[]
  maxPinnedScenarios: number
  pinCapReached: boolean
  /** Pins stashed when map view reduces the cap (null = nothing stashed) */
  stashedPinnedScenarioIds: string[] | null
  /** True when pins were auto-trimmed for map view (drives distinct snackbar message) */
  pinsTrimmedForMap: boolean

  // Filtering
  searchQuery: string
  showOnlyChosen: boolean

  // Theme filtering
  selectedTheme: ScenarioTheme | null
  showOnlyTheme: boolean
  showThemeBadges: boolean

  // Icon filtering
  selectedIconId: string | null

  // Display options
  showAlternativeBaselines: boolean
  showDefinitions: boolean
  showKeyOperations: boolean
  outcomeDisplayMode: "summary" | "distribution"
  showMap: boolean
  showLocationPicker: boolean

  // Share staging
  shareItems: ShareItem[]
  storyItemIds: string[]
  showShareDrawer: boolean

  // Chart toggles (shared across chart panels)
  relativeToBaseline: boolean
  highlightBaseline: boolean
  overlayTiers: boolean
  defineOutcome: boolean
  showTierZones: boolean
  dimUnpinned: boolean
  showRadarRange: boolean
  showDotsOnly: boolean
  radarShowAll: boolean
  showAxisSelector: boolean

  // Radar axis visibility
  radarVisibleAxes: string[]

  // Hydroclimate selection (shared across all views)
  hydroclimate: string

  // Theme grouping
  groupByTheme: boolean

  // Sort state (shared so both sidebar and list view use the same order)
  sortBy: string | null
  sortDirection: "asc" | "desc"
  isSortActive: boolean

  // Tier selection (for map visualization)
  selectedTier: { strategy: string; outcome: string } | null
}

// ============================================================================
// Actions Interface
// ============================================================================

interface ScenarioExplorerActions {
  // Navigation
  setMainView: (view: MainView) => void
  setExploreMode: (mode: ExploreMode) => void

  // Scenario selection
  toggleScenario: (scenarioId: string) => void
  selectScenarios: (scenarioIds: string[]) => void
  clearScenarios: () => void
  setHighlightedScenario: (scenarioId: string | null) => void
  togglePinnedScenario: (scenarioId: string) => void
  clearPinnedScenarios: () => void
  setMaxPinnedScenarios: (max: number) => void
  dismissPinCapReached: () => void
  stashAndTrimPins: (keepCount: number) => void
  restoreStashedPins: () => void
  dismissPinsTrimmedForMap: () => void

  // Filtering
  setSearchQuery: (query: string) => void
  setShowOnlyChosen: (show: boolean) => void

  // Theme filtering
  setSelectedTheme: (theme: ScenarioTheme | null) => void
  setShowOnlyTheme: (show: boolean) => void
  setShowThemeBadges: (show: boolean) => void

  // Icon filtering
  setSelectedIconId: (iconId: string | null) => void

  // Display options
  setShowAlternativeBaselines: (show: boolean) => void
  setShowDefinitions: (show: boolean) => void
  setShowKeyOperations: (show: boolean) => void
  setOutcomeDisplayMode: (mode: "summary" | "distribution") => void
  setShowMap: (show: boolean) => void
  setShowLocationPicker: (show: boolean) => void

  // Share staging
  addShareItem: (item: ShareItem) => void
  removeShareItem: (id: string) => void
  reorderShareItems: (orderedIds: string[]) => void
  clearShareItems: () => void
  setShareItems: (items: ShareItem[]) => void
  updateShareItem: (id: string, patch: Partial<ShareItem>) => void
  setShowShareDrawer: (open: boolean) => void

  // Story arrangement
  addToStory: (id: string) => void
  removeFromStory: (id: string) => void
  reorderStory: (orderedIds: string[]) => void
  clearStory: () => void

  // Chart toggles
  setRelativeToBaseline: (show: boolean) => void
  setHighlightBaseline: (show: boolean) => void
  setOverlayTiers: (show: boolean) => void
  setDefineOutcome: (show: boolean) => void
  setShowTierZones: (show: boolean) => void
  setDimUnpinned: (show: boolean) => void
  setShowRadarRange: (show: boolean) => void
  setShowDotsOnly: (show: boolean) => void
  setRadarShowAll: (show: boolean) => void
  setShowAxisSelector: (show: boolean) => void

  // Radar axis visibility
  toggleRadarAxis: (code: string) => void
  setRadarVisibleAxes: (codes: string[]) => void

  // Hydroclimate
  setHydroclimate: (value: string) => void

  // Theme grouping
  setGroupByTheme: (group: boolean) => void

  // Sort state
  setSortBy: (outcome: string | null) => void
  setSortDirection: (direction: "asc" | "desc") => void
  setIsSortActive: (active: boolean) => void

  // Tier selection
  setSelectedTier: (tier: { strategy: string; outcome: string } | null) => void

  // Reset functions
  resetFilters: () => void
  resetSelections: () => void
  resetAll: () => void
}

type ScenarioExplorerStore = ScenarioExplorerState & ScenarioExplorerActions

// ============================================================================
// Initial State
// ============================================================================

const persisted = loadShareState()

const initialState: ScenarioExplorerState = {
  mainView: "get-started",
  exploreMode: "list",
  selectedScenarios: [],
  highlightedScenario: null,
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
  showAlternativeBaselines: false,
  showDefinitions: true,
  showKeyOperations: false,
  outcomeDisplayMode: "summary",
  showMap: false,
  showLocationPicker: false,
  shareItems: persisted.shareItems,
  storyItemIds: persisted.storyItemIds,
  showShareDrawer: false,
  relativeToBaseline: true,
  highlightBaseline: false,
  overlayTiers: false,
  defineOutcome: false,
  showTierZones: true,
  dimUnpinned: false,
  showRadarRange: false,
  showDotsOnly: false,
  radarShowAll: false,
  showAxisSelector: false,
  radarVisibleAxes: [...OUTCOME_CODE_ORDER],
  hydroclimate: "historical",
  groupByTheme: true,
  sortBy: null,
  sortDirection: "asc",
  isSortActive: false,
  selectedTier: null,
}

// ============================================================================
// Store
// ============================================================================

export const useScenarioExplorerStore = create<ScenarioExplorerStore>()(
  immer<ScenarioExplorerStore>((set) => ({
    ...initialState,

    // Navigation
    setMainView: (view) =>
      set((state) => {
        state.mainView = view
      }),

    setExploreMode: (mode) =>
      set((state) => {
        state.exploreMode = mode
      }),

    // Scenario selection
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

    setHighlightedScenario: (scenarioId) =>
      set((state) => {
        state.highlightedScenario = scenarioId
      }),

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

    clearPinnedScenarios: () =>
      set((state) => {
        state.pinnedScenarioIds = []
        state.pinCapReached = false
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

    // Filtering
    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query
      }),

    setShowOnlyChosen: (show) =>
      set((state) => {
        state.showOnlyChosen = show
      }),

    // Theme filtering
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

    // Icon filtering
    setSelectedIconId: (iconId) =>
      set((state) => {
        state.selectedIconId = iconId
      }),

    // Display options
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

    setShowLocationPicker: (show) =>
      set((state) => {
        state.showLocationPicker = show
      }),

    // Share staging
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

    reorderShareItems: (orderedIds) =>
      set((state) => {
        const byId = new Map(state.shareItems.map((s) => [s.id, s]))
        state.shareItems = orderedIds
          .map((id) => byId.get(id))
          .filter(Boolean) as ShareItem[]
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

    // Story arrangement
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

    clearStory: () =>
      set((state) => {
        state.storyItemIds = []
      }),

    // Chart toggles
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

    setDimUnpinned: (show) =>
      set((state) => {
        state.dimUnpinned = show
      }),

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

    // Hydroclimate
    setHydroclimate: (value) =>
      set((state) => {
        state.hydroclimate = value
      }),

    // Theme grouping
    setGroupByTheme: (group) =>
      set((state) => {
        state.groupByTheme = group
        if (group && state.sortBy !== null) {
          state.sortBy = null
          state.isSortActive = false
        }
      }),

    // Sort state
    setSortBy: (outcome) =>
      set((state) => {
        state.sortBy = outcome
        state.isSortActive = outcome !== null
        if (outcome !== null) {
          state.groupByTheme = false
        }
      }),

    setSortDirection: (direction) =>
      set((state) => {
        state.sortDirection = direction
      }),

    setIsSortActive: (active) =>
      set((state) => {
        state.isSortActive = active
      }),

    // Tier selection
    setSelectedTier: (tier) =>
      set((state) => {
        state.selectedTier = tier
      }),

    // Reset functions
    resetFilters: () =>
      set((state) => {
        state.searchQuery = ""
        state.selectedTheme = null
        state.showOnlyTheme = false
        state.selectedIconId = null
      }),

    resetSelections: () =>
      set((state) => {
        state.selectedScenarios = []
        state.highlightedScenario = null
        state.pinnedScenarioIds = []
        state.pinCapReached = false
        state.stashedPinnedScenarioIds = null
        state.pinsTrimmedForMap = false
        state.selectedTier = null
      }),

    resetAll: () =>
      set((state) => {
        Object.assign(state, initialState)
      }),
  })),
)

// Auto-save shareItems + storyItemIds to localStorage on every change
let prevShareRef: ShareItem[] = persisted.shareItems
let prevStoryRef: string[] = persisted.storyItemIds
useScenarioExplorerStore.subscribe((state) => {
  if (
    state.shareItems !== prevShareRef ||
    state.storyItemIds !== prevStoryRef
  ) {
    prevShareRef = state.shareItems
    prevStoryRef = state.storyItemIds
    saveShareState(state.shareItems, state.storyItemIds)
  }
})
