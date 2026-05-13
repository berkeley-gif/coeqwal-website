/**
 * Scenario Explorer store: state management for multi-view scenario exploration
 *
 * This store manages state that is shared across multiple components in the
 * Scenario Explorer feature. Local UI state (like modal open/close, hover states)
 * should remain in individual components.
 */

import { create, immer } from "@repo/state/zustand"
import type { ScenarioTheme } from "../../content/scenarios"
import { OUTCOME_CODE_ORDER } from "../../content/outcomes"
import { BASELINE_SCENARIO_ID } from "./constants"
import type { TourTool } from "./tools/tour/types"
import type { ShareItem, ShareItemPatch } from "./share/types"
import { loadShareState, saveShareState } from "./share/persist"
export type { TourTool } from "./tools/tour/types"
export type { ShareItem, ShareItemPatch } from "./share/types"

// ============================================================================
// Types
// ============================================================================

/**
 * The current tool within the explorer view.
 */
export type ExploreMode = "list" | "radar" | "equity" | "resilience" | "data"

/**
 * The main view within the Explore section.
 * - explorer: "Choose scenarios" view with tool modes (list/map/comparison)
 * - data: "Explore data in depth" view
 */
export type MainView = "get-started" | "explorer" | "data"

export type OutcomeDisplayMode = "average" | "bar" | "distribution"

// ============================================================================
// Local-storage persistence for journey progress
// ============================================================================
// Share-state persistence lives in `share/persist.ts`. Journey state
// is the only persisted bag still defined here, because it has no
// other home and changes infrequently.

const JOURNEY_STORAGE_KEY = "coeqwal-journey-v1"

type JourneyPersist = {
  /** True once the welcome strip has been dismissed with "Don't show again". */
  welcomeDismissedPermanently: boolean
  /** True once the baseline has been auto-pinned on first visit. */
  baselinePrePinned: boolean
  /** True once the user has dismissed the baseline pre-pin hint on the list. */
  seenBaselinePinHint: boolean
}

function defaultJourney(): JourneyPersist {
  return {
    welcomeDismissedPermanently: false,
    baselinePrePinned: false,
    seenBaselinePinHint: false,
  }
}

function loadJourneyState(): JourneyPersist {
  try {
    if (typeof window === "undefined") return defaultJourney()
    const raw = localStorage.getItem(JOURNEY_STORAGE_KEY)
    if (!raw) return defaultJourney()
    const parsed = JSON.parse(raw) as Partial<JourneyPersist>
    return {
      welcomeDismissedPermanently: Boolean(parsed.welcomeDismissedPermanently),
      baselinePrePinned: Boolean(parsed.baselinePrePinned),
      seenBaselinePinHint: Boolean(parsed.seenBaselinePinHint),
    }
  } catch {
    return defaultJourney()
  }
}

function saveJourneyState(state: JourneyPersist) {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage full or unavailable - silently ignore
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
  /**
   * Single scenario focused by the Distribution (equity) tool. Kept
   * orthogonal to `selectedScenarios` so entering/leaving Distribution
   * does not stomp the shared multi-select used by List, Radar, and
   * Resilience. Null until the user explicitly picks a radio.
   * EquityPanel falls back to the baseline in that case.
   */
  equityFocusScenario: string | null
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
  outcomeDisplayMode: OutcomeDisplayMode
  showMap: boolean
  showLocationPicker: boolean

  // Share staging
  shareItems: ShareItem[]
  storyItemIds: string[]
  showShareDrawer: boolean
  /**
   * Set when a deep-link URL declared a SHARE_URL_VERSION that
   * does not match the build's current version. The Share tab
   * surfaces a notice (`ShareUrlVersionNotice`, P2.7) so users
   * understand why a shared link may render differently than the
   * sender saw. Reset by `dismissShareUrlVersionMismatch`.
   */
  shareUrlVersionMismatch: boolean

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

  // Resilience heatmap outcome-row visibility
  showResilienceOutcomeSelector: boolean
  resilienceVisibleOutcomes: string[]

  // Resilience heatmap distribution sub-mode (within the "distribution"
  // cell encoding). "scenario" = one square per scenario. "location" =
  // one square per LOI (mean tier across scope scenarios).
  resilienceDistributionMode: "scenario" | "location"

  // Hydroclimate selection (shared across all views)
  hydroclimate: string

  // Equity comparison mode
  showEquityComparison: boolean

  // Theme grouping
  groupByTheme: boolean

  // Sort state (shared so both sidebar and list view use the same order)
  sortBy: string | null
  sortDirection: "asc" | "desc"
  isSortActive: boolean

  // Tier selection (for map visualization)
  selectedTier: { strategy: string; outcome: string } | null

  // Beginner journey
  /** Whether the welcome strip has been permanently dismissed (persisted). */
  welcomeDismissedPermanently: boolean
  /** Whether the welcome strip was dismissed in this session only (not persisted). */
  welcomeDismissedThisSession: boolean
  /** Whether the baseline scenario has been pre-pinned once (persisted). */
  baselinePrePinned: boolean
  /** Whether the user has dismissed the baseline pre-pin hint on the list. */
  seenBaselinePinHint: boolean
  /** Which per-tool tour (if any) is active and which step is current.
   *  `tool` is null when no tour is running. Tours are always opt-in
   *  and session-scoped (not persisted). */
  tour: { tool: TourTool | null; step: number }
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
  setEquityFocusScenario: (scenarioId: string | null) => void
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
  setOutcomeDisplayMode: (mode: OutcomeDisplayMode) => void
  setShowMap: (show: boolean) => void
  setShowLocationPicker: (show: boolean) => void

  // Share staging
  addShareItem: (item: ShareItem) => void
  removeShareItem: (id: string) => void
  clearShareItems: () => void
  setShareItems: (items: ShareItem[]) => void
  /**
   * Patch a share item in place. Only the fields in `ShareItemPatch`
   * (note, cachedChartData) can be mutated through this action.
   * Other state is set once at capture time, or goes through
   * specific actions (`addShareItem`, `removeShareItem`,
   * `reorderShareItems`).
   */
  updateShareItem: (id: string, patch: ShareItemPatch) => void
  setShowShareDrawer: (open: boolean) => void
  /** Set the version-mismatch flag, typically from a URL hydrator. */
  setShareUrlVersionMismatch: (mismatch: boolean) => void
  /** Dismiss the version-mismatch notice. UI-only effect. */
  dismissShareUrlVersionMismatch: () => void

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

  // Resilience heatmap outcome-row visibility
  setShowResilienceOutcomeSelector: (show: boolean) => void
  toggleResilienceOutcome: (code: string) => void
  setResilienceVisibleOutcomes: (codes: string[]) => void

  // Resilience heatmap distribution sub-mode
  setResilienceDistributionMode: (mode: "scenario" | "location") => void

  // Hydroclimate
  setHydroclimate: (value: string) => void

  // Equity comparison mode
  setShowEquityComparison: (show: boolean) => void

  // Theme grouping
  setGroupByTheme: (group: boolean) => void

  // Sort state
  setSortBy: (outcome: string | null) => void
  setSortDirection: (direction: "asc" | "desc") => void
  setIsSortActive: (active: boolean) => void

  // Tier selection
  setSelectedTier: (tier: { strategy: string; outcome: string } | null) => void

  // Beginner journey
  dismissWelcome: (permanent: boolean) => void
  /** Clears session and persisted dismissal flags for the beginner welcome flow. */
  reopenWelcome: () => void
  /** Idempotently pre-pin the baseline scenario on first visit. */
  ensureBaselinePrePin: () => void
  setSeenBaselinePinHint: (seen: boolean) => void
  /** Start the tour for a specific tool and auto-switch `exploreMode`
   *  to that tool so anchors are mounted when the runner looks them
   *  up. */
  startToolTour: (tool: TourTool) => void
  endTour: () => void
  setTourStep: (step: number) => void

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
const persistedJourney = loadJourneyState()

const initialState: ScenarioExplorerState = {
  mainView: "get-started",
  exploreMode: "list",
  selectedScenarios: [],
  highlightedScenario: null,
  equityFocusScenario: null,
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
  outcomeDisplayMode: "bar",
  showMap: false,
  showLocationPicker: false,
  shareItems: persisted.shareItems,
  storyItemIds: persisted.storyItemIds,
  showShareDrawer: false,
  shareUrlVersionMismatch: false,
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
  showResilienceOutcomeSelector: false,
  resilienceVisibleOutcomes: [...OUTCOME_CODE_ORDER],
  resilienceDistributionMode: "scenario",
  hydroclimate: "historical",
  showEquityComparison: false,
  groupByTheme: true,
  sortBy: null,
  sortDirection: "asc",
  isSortActive: false,
  selectedTier: null,
  welcomeDismissedPermanently: persistedJourney.welcomeDismissedPermanently,
  welcomeDismissedThisSession: false,
  baselinePrePinned: persistedJourney.baselinePrePinned,
  seenBaselinePinHint: persistedJourney.seenBaselinePinHint,
  tour: { tool: null, step: 0 },
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
        // If the user leaves the explorer while a tool tour is running,
        // reset the tour so it doesn't pop back up when they return.
        // The tour is always anchored to a specific tool (list / radar),
        // and coming back to a stale, dangling popper is
        // disorienting.
        if (state.mainView !== view) {
          state.tour = { tool: null, step: 0 }
        }
        state.mainView = view
      }),

    setExploreMode: (mode) =>
      set((state) => {
        if (state.exploreMode !== mode) {
          state.tour = { tool: null, step: 0 }
        }
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

    setEquityFocusScenario: (scenarioId) =>
      set((state) => {
        state.equityFocusScenario = scenarioId
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

    setShowResilienceOutcomeSelector: (show) =>
      set((state) => {
        state.showResilienceOutcomeSelector = show
      }),

    toggleResilienceOutcome: (code) =>
      set((state) => {
        const idx = state.resilienceVisibleOutcomes.indexOf(code)
        if (idx >= 0) {
          state.resilienceVisibleOutcomes.splice(idx, 1)
        } else {
          state.resilienceVisibleOutcomes.push(code)
        }
      }),

    setResilienceVisibleOutcomes: (codes) =>
      set((state) => {
        state.resilienceVisibleOutcomes = codes
      }),

    setResilienceDistributionMode: (mode) =>
      set((state) => {
        state.resilienceDistributionMode = mode
      }),

    // Hydroclimate
    setHydroclimate: (value) =>
      set((state) => {
        state.hydroclimate = value
      }),

    // Equity comparison mode
    setShowEquityComparison: (show) =>
      set((state) => {
        state.showEquityComparison = show
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

    // Beginner journey
    dismissWelcome: (permanent) =>
      set((state) => {
        state.welcomeDismissedThisSession = true
        if (permanent) state.welcomeDismissedPermanently = true
      }),

    reopenWelcome: () =>
      set((state) => {
        state.welcomeDismissedThisSession = false
        state.welcomeDismissedPermanently = false
      }),

    ensureBaselinePrePin: () =>
      set((state) => {
        if (state.baselinePrePinned) return
        if (state.pinnedScenarioIds.length > 0) {
          state.baselinePrePinned = true
          return
        }
        state.pinnedScenarioIds.push(BASELINE_SCENARIO_ID)
        state.baselinePrePinned = true
      }),

    setSeenBaselinePinHint: (seen) =>
      set((state) => {
        state.seenBaselinePinHint = seen
      }),

    startToolTour: (tool) =>
      set((state) => {
        state.tour = { tool, step: 0 }
        // Align the active tool so anchors for this tour are mounted
        // when the runner resolves them.
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

// Auto-save journey progress (first-visit flags) to localStorage.
let prevJourneyRef: JourneyPersist = persistedJourney
useScenarioExplorerStore.subscribe((state) => {
  if (
    state.welcomeDismissedPermanently !==
      prevJourneyRef.welcomeDismissedPermanently ||
    state.baselinePrePinned !== prevJourneyRef.baselinePrePinned ||
    state.seenBaselinePinHint !== prevJourneyRef.seenBaselinePinHint
  ) {
    prevJourneyRef = {
      welcomeDismissedPermanently: state.welcomeDismissedPermanently,
      baselinePrePinned: state.baselinePrePinned,
      seenBaselinePinHint: state.seenBaselinePinHint,
    }
    saveJourneyState(prevJourneyRef)
  }
})
