"use client"

/**
 * Map store - Zustand state for persistent map (mode, sections, visualizations)
 */

import { create, immer } from "@repo/state/zustand"
import {
  SECTION_LAYERS,
  type SubSectionLayerConfig,
  type SubSectionId,
  type LearnNavSection,
} from "./config/sectionLayers"
import { MAP_THEME_URLS } from "@repo/map"
import { getDistributionPaintKey } from "./config/mapPaintKey"

// ============================================================================
// Types
// ============================================================================

/** Map mode: hidden (preloading), learn (scrollytelling), explore (fixed panel), get-started (visible background with page-scroll interaction) */
export type MapMode = "hidden" | "learn" | "explore"

/** Outcome visualization state used by both Learn and Explore modes */
/** The data behind Distribution's map markers at the moment they were
 *  painted, so the map caption describes the markers, not the controls. */
export interface DistributionMapSnapshot {
  /** Outcome short codes with at least one painted marker */
  outcomeCodes: string[]
  /** Logical scenario (sibling-group) id the markers were built from */
  scenarioId: string
  /** Workspace hydroclimate value the markers were built under */
  hydroclimate: string
  /** Markers encode the change from current operations */
  comparedWithBaseline: boolean
  /** Painted `tierCode:locationId` keys */
  locationKeys: string[]
}

export interface OutcomeVisualization {
  /** Outcome short code (e.g., "CWS_DEL", "AG_REV") */
  outcomeCode: string
  /** Resolved scenario ID for the current hydroclimate (used by API fetches) */
  scenarioId: string
  /** Original sibling-group ID, if the visualization was triggered from a
   *  hydroclimate-aware context (e.g., the list view). Absent for the Learn
   *  section where the scenario is always the historical variant. */
  siblingGroupId?: string
}

/** Shape for location highlight marker */
export type LocationHighlightShape = "square" | "triangle-up" | "triangle-down"

/** Lightweight tooltip driven by the tier animation overlay hover/pin */
export interface LocationHighlight {
  key: string
  longitude: number
  latitude: number
  name: string
  tierLevel: number
  tierLabel: string
  tierColor: string
  pinned?: boolean
  shape?: LocationHighlightShape
}

// ============================================================================
// State
// ============================================================================

interface MapState {
  // Core
  mapMode: MapMode
  mapReady: boolean
  mapError: boolean
  mapStyle: string

  // Learn mode
  activeSection: LearnNavSection
  activeSubSection: SubSectionId
  riversProgress: number
  geocoderMarker: [number, number] | null
  geocodingResetCounter: number
  learnMapScrollOffset: number
  isVertNavExpanded: boolean

  // Explore mode layout
  /** Percentage of viewport width occupied by the left panel (0-100). Default: 50 */
  explorePanelWidth: number

  // Visualization
  activeOutcomeVisualization: OutcomeVisualization | null
  /** What Distribution's painted markers show (it draws its own markers,
   *  so activeOutcomeVisualization stays null there), captured when the
   *  markers are built. Read by the map caption. */
  distributionMapSnapshot: DistributionMapSnapshot | null
  /** What the renderer last finished drawing; generation is the
   *  paintRevision at that paint, so a repaint during a save is detectable */
  paintedVisualization: { key: string; generation: number } | null
  /** Monotonic counter bumped on every paint and every paint invalidation;
   *  never reset, so A to B to A during a save is still detected */
  paintRevision: number

  // Tooltip control signal (incrementing triggers clearAllPinned in VisualizationLayers)
  clearTooltipsSignal: number

  // Lightweight highlight tooltips driven by the tier animation overlay
  locationHighlights: LocationHighlight[]

  // When true, unpinned (hover) highlights also render as map popups in the storyboard.
  // It turns this on for the beats where the
  // distribution grid is settled, so hovering a square or a map polygon shows
  // a map popup. Off elsewhere so hover stays quiet on the map by default.
  showHoverHighlightsOnMap: boolean

  // When true, the storyboard region lets pointer events through
  // to the map behind it, so the user can pan, zoom, and hover map polygons.
  // The storyboard turns this on only for the settled-grid beats. Off
  // elsewhere keeps the storyboard a solid card with a scripted camera.
  storyboardMapInteractive: boolean

  // The storyboard panel's own live-measured rect (viewport-relative left,
  // and its full width), written by TierAnimationSection via a
  // ResizeObserver. MapInstance (a sibling, not a parent/child - see
  // MapOverlayPanels.tsx) reads this to pad the fly-home camera so it
  // centers on the storyboard's middle column instead of the whole map
  // canvas, without duplicating the panel's own CSS layout math.
  storyboardColumnRect: { left: number; width: number } | null
}

const initialState: MapState = {
  mapMode: "hidden",
  mapReady: false,
  mapError: false,
  mapStyle: MAP_THEME_URLS.satellite,
  activeSection: "get-started",
  activeSubSection: "intro",
  riversProgress: 0,
  geocoderMarker: null,
  geocodingResetCounter: 0,
  learnMapScrollOffset: 0,
  isVertNavExpanded: false,
  explorePanelWidth: 50,
  activeOutcomeVisualization: null,
  distributionMapSnapshot: null,
  paintedVisualization: null,
  paintRevision: 0,
  clearTooltipsSignal: 0,
  locationHighlights: [],
  showHoverHighlightsOnMap: false,
  storyboardMapInteractive: false,
  storyboardColumnRect: null,
}

// ============================================================================
// Store
// ============================================================================

export const useMapStore = create<MapState>()(immer(() => initialState))

/** State patch that drops a finished tier-layer paint (Bar, Radar,
 *  Heatmap, Learn) when what the tier layer is asked to draw changes to
 *  `next`, so a save cannot pair an old picture with a new request. An
 *  unchanged request keeps the paint (the renderer would not re-mark it).
 *  Distribution's paint is left alone: it survives a map close and
 *  reopen. */
function tierPaintInvalidation(
  next: OutcomeVisualization | null,
): Partial<MapState> {
  const { paintedVisualization, paintRevision, activeOutcomeVisualization } =
    useMapStore.getState()
  const unchanged =
    activeOutcomeVisualization?.outcomeCode === next?.outcomeCode &&
    activeOutcomeVisualization?.scenarioId === next?.scenarioId
  return !unchanged && paintedVisualization?.key.startsWith("tiers|")
    ? { paintedVisualization: null, paintRevision: paintRevision + 1 }
    : {}
}

// Stored outside immer to avoid proxy/freeze issues with function values
let _onLocationToggle: ((key: string) => void) | null = null
let _onLocationClick:
  | ((info: { code: string; sourceId: string; tier: number }) => void)
  | null = null
let _onLocationHover:
  | ((info: { code: string; sourceId: string; tier: number } | null) => void)
  | null = null

// ============================================================================
// Actions
// ============================================================================

export const mapActions = {
  // Core
  setMapMode: (mode: MapMode) => {
    const updates: Partial<MapState> = {
      mapMode: mode,
      activeOutcomeVisualization:
        mode === "hidden"
          ? null
          : useMapStore.getState().activeOutcomeVisualization,
      ...(mode === "hidden" ? tierPaintInvalidation(null) : {}),
    }

    // Learn and get-started always use the satellite basemap
    if (mode === "learn") {
      updates.mapStyle = MAP_THEME_URLS.satellite
    }

    useMapStore.setState(updates)
  },

  setMapReady: (ready: boolean) => useMapStore.setState({ mapReady: ready }),

  setMapError: (error: boolean) => useMapStore.setState({ mapError: error }),

  setMapStyle: (style: string) => useMapStore.setState({ mapStyle: style }),

  // Learn mode
  setActiveSubSection: (section: SubSectionId) =>
    useMapStore.setState({ activeSubSection: section }),

  setLearnNavSection: (section: LearnNavSection) => {
    useMapStore.setState({ activeSection: section })
    // The persistent map only shows during "get-started" (it's the
    // scrollytelling section) - every other Learn section is static
    // content with the map hidden. Doing that switch here, rather than
    // in each caller, means every future entry point that changes the
    // Learn section (VerticalNav today, the footer CTA now, anything
    // later) gets correct map behavior for free instead of having to
    // remember to call setMapMode too.
    mapActions.setMapMode(section === "get-started" ? "learn" : "hidden")
  },

  setRiversProgress: (progress: number) =>
    useMapStore.setState({ riversProgress: progress }),

  setGeocoderMarker: (marker: [number, number] | null) =>
    useMapStore.setState({ geocoderMarker: marker }),

  resetGeocoding: () =>
    useMapStore.setState((state) => ({
      geocoderMarker: null,
      geocodingResetCounter: state.geocodingResetCounter + 1,
    })),

  setLearnMapScrollOffset: (offset: number) =>
    useMapStore.setState({ learnMapScrollOffset: offset }),

  toggleVertNavExpanded: () =>
    useMapStore.setState((state) => ({
      isVertNavExpanded: !state.isVertNavExpanded,
    })),

  // Explore mode layout
  setExplorePanelWidth: (width: number) =>
    useMapStore.setState({ explorePanelWidth: width }),

  setStoryboardColumnRect: (rect: { left: number; width: number } | null) =>
    useMapStore.setState({ storyboardColumnRect: rect }),

  resetLearnState: () =>
    useMapStore.setState({
      activeSection: "get-started",
      activeSubSection: "california",
      riversProgress: 0,
      geocoderMarker: null,
      learnMapScrollOffset: 0,
      isVertNavExpanded: false,
      activeOutcomeVisualization: null,
      ...tierPaintInvalidation(null),
    }),

  // Visualization
  setOutcomeVisualization: (
    outcomeCode: string | null,
    scenarioId = "s0020",
    siblingGroupId?: string,
  ) =>
    useMapStore.setState({
      activeOutcomeVisualization: outcomeCode
        ? { outcomeCode, scenarioId, siblingGroupId }
        : null,
      ...tierPaintInvalidation(
        outcomeCode ? { outcomeCode, scenarioId, siblingGroupId } : null,
      ),
    }),

  clearOutcomeVisualization: () =>
    useMapStore.setState({
      activeOutcomeVisualization: null,
      ...tierPaintInvalidation(null),
    }),

  toggleOutcomeVisualization: (
    outcomeCode: string,
    scenarioId = "s0020",
    siblingGroupId?: string,
  ) => {
    const current = useMapStore.getState().activeOutcomeVisualization
    // Identity check: use siblingGroupId when available so the toggle stays
    // stable across hydroclimate changes (resolved scenarioId shifts).
    const currentIdentity = current?.siblingGroupId ?? current?.scenarioId
    const newIdentity = siblingGroupId ?? scenarioId
    const isSame =
      current?.outcomeCode === outcomeCode && currentIdentity === newIdentity
    useMapStore.setState({
      activeOutcomeVisualization: isSame
        ? null
        : { outcomeCode, scenarioId, siblingGroupId },
      ...tierPaintInvalidation(
        isSame ? null : { outcomeCode, scenarioId, siblingGroupId },
      ),
    })
  },

  setDistributionMapSnapshot: (snapshot: DistributionMapSnapshot | null) => {
    const state = useMapStore.getState()
    // A different set of painted markers invalidates Distribution's last
    // paint; the panel marks the new one once it has built the markers.
    const changed =
      getDistributionPaintKey(snapshot) !==
      getDistributionPaintKey(state.distributionMapSnapshot)
    useMapStore.setState({
      distributionMapSnapshot: snapshot,
      ...(changed && state.paintedVisualization?.key.startsWith("equity|")
        ? {
            paintedVisualization: null,
            paintRevision: state.paintRevision + 1,
          }
        : {}),
    })
  },

  /** The renderer finished drawing `key` */
  markMapPainted: (key: string) =>
    useMapStore.setState((state) => ({
      paintRevision: state.paintRevision + 1,
      paintedVisualization: { key, generation: state.paintRevision + 1 },
    })),

  clearMapPainted: () =>
    useMapStore.setState((state) => ({
      paintRevision: state.paintRevision + 1,
      paintedVisualization: null,
    })),

  // Tooltips
  clearMapTooltips: () =>
    useMapStore.setState((state) => ({
      clearTooltipsSignal: state.clearTooltipsSignal + 1,
    })),

  // Location highlights (tier animation overlay hover/pin)
  setLocationHighlights: (highlights: LocationHighlight[]) =>
    useMapStore.setState({ locationHighlights: highlights }),
  clearLocationHighlights: () => {
    useMapStore.setState({ locationHighlights: [] })
  },
  setShowHoverHighlightsOnMap: (value: boolean) =>
    useMapStore.setState({ showHoverHighlightsOnMap: value }),
  setStoryboardMapInteractive: (value: boolean) =>
    useMapStore.setState({ storyboardMapInteractive: value }),
  setOnLocationToggle: (fn: ((key: string) => void) | null) => {
    _onLocationToggle = fn
  },
  setOnLocationClick: (
    fn:
      | ((info: { code: string; sourceId: string; tier: number }) => void)
      | null,
  ) => {
    _onLocationClick = fn
  },
  setOnLocationHover: (
    fn:
      | ((
          info: { code: string; sourceId: string; tier: number } | null,
        ) => void)
      | null,
  ) => {
    _onLocationHover = fn
  },
}

// ============================================================================
// Selectors (subscribing)
// ============================================================================

// Core
export const useMapMode = () => useMapStore((s) => s.mapMode)
export const useMapReady = () => useMapStore((s) => s.mapReady)
export const useMapError = () => useMapStore((s) => s.mapError)
export const useMapStyle = () => useMapStore((s) => s.mapStyle)

// Learn mode
export const useActiveSubSection = (): SubSectionId =>
  useMapStore((s) => s.activeSubSection)

export const useLearnNavSection = (): LearnNavSection =>
  useMapStore((s) => s.activeSection)

export const useRiversProgress = () => useMapStore((s) => s.riversProgress)

export const useGeocoderMarker = () => useMapStore((s) => s.geocoderMarker)

export const useGeocodingResetCounter = () =>
  useMapStore((s) => s.geocodingResetCounter)

export const useLearnMapScrollOffset = () =>
  useMapStore((s) => s.learnMapScrollOffset)

export const useIsVertNavExpanded = () =>
  useMapStore((s) => s.isVertNavExpanded)

// Explore mode layout
export const useExplorePanelWidth = () =>
  useMapStore((s) => s.explorePanelWidth)

export const useStoryboardColumnRect = () =>
  useMapStore((s) => s.storyboardColumnRect)

// Derived layer visibility selectors
const createLayerSelector = (key: keyof SubSectionLayerConfig) => () =>
  useMapStore((s) => !!SECTION_LAYERS[s.activeSubSection][key])

export const useShowBasins = createLayerSelector("basins")
export const useShowRivers = createLayerSelector("rivers")
export const useShowArrows = createLayerSelector("arrows")
export const useShowInflowWatersheds = createLayerSelector("inflowWatersheds")

export const useCameraView = () =>
  useMapStore((s) => SECTION_LAYERS[s.activeSubSection].camera)

export const useDerivedArrowsOpacity = () =>
  useMapStore((s) => (SECTION_LAYERS[s.activeSubSection].arrows ? 1 : 0))

// Visualization
export const useActiveOutcomeVisualization = () =>
  useMapStore((s) => s.activeOutcomeVisualization)

export const useIsOutcomeVisualizationActive = () =>
  useMapStore((s) => s.activeOutcomeVisualization !== null)

export const useDistributionMapSnapshot = () =>
  useMapStore((s) => s.distributionMapSnapshot)

export const usePaintedVisualization = () =>
  useMapStore((s) => s.paintedVisualization)

// Tooltips
export const useClearTooltipsSignal = () =>
  useMapStore((s) => s.clearTooltipsSignal)

// Location highlights
export const useLocationHighlights = () =>
  useMapStore((s) => s.locationHighlights)
export const useShowHoverHighlightsOnMap = () =>
  useMapStore((s) => s.showHoverHighlightsOnMap)
export const useStoryboardMapInteractive = () =>
  useMapStore((s) => s.storyboardMapInteractive)
export const getOnLocationToggle = () => _onLocationToggle
export const getOnLocationClick = () => _onLocationClick
export const getOnLocationHover = () => _onLocationHover
