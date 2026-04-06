"use client"

/**
 * Map store - Zustand state for persistent map (mode, sections, visualizations)
 */

import { create, immer } from "@repo/state/zustand"
import {
  SECTION_LAYERS,
  type SectionLayerConfig,
  type SectionId,
} from "./config/sectionLayers"

// ============================================================================
// Types
// ============================================================================

/** Map mode: hidden (preloading), learn (scrollytelling), explore (fixed panel), get-started (visible background with page-scroll interaction) */
export type MapMode = "hidden" | "learn" | "explore" | "get-started"

/** Outcome visualization state used by both Learn and Explore modes */
export interface OutcomeVisualization {
  /** Outcome short code (e.g., "CWS_DEL", "AG_REV") */
  outcomeCode: string
  scenarioId: string
}

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
}

// ============================================================================
// State
// ============================================================================

interface MapState {
  // Core
  mapMode: MapMode
  mapReady: boolean
  mapError: boolean

  // Learn mode
  activeSection: SectionId
  riversProgress: number
  geocoderMarker: [number, number] | null
  geocodingResetCounter: number
  learnMapScrollOffset: number

  // Explore mode layout
  /** Percentage of viewport width occupied by the left panel (0-100). Default: 50 */
  explorePanelWidth: number

  // Visualization
  activeOutcomeVisualization: OutcomeVisualization | null

  // Tooltip control signal (incrementing triggers clearAllPinned in VisualizationLayers)
  clearTooltipsSignal: number

  // Lightweight highlight tooltips driven by the tier animation overlay
  locationHighlights: LocationHighlight[]
}

const initialState: MapState = {
  mapMode: "hidden",
  mapReady: false,
  mapError: false,
  activeSection: "california",
  riversProgress: 0,
  geocoderMarker: null,
  geocodingResetCounter: 0,
  learnMapScrollOffset: 0,
  explorePanelWidth: 50,
  activeOutcomeVisualization: null,
  clearTooltipsSignal: 0,
  locationHighlights: [],
}

// ============================================================================
// Store
// ============================================================================

export const useMapStore = create<MapState>()(immer(() => initialState))

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
    useMapStore.setState({
      mapMode: mode,
      activeOutcomeVisualization:
        mode === "hidden"
          ? null
          : useMapStore.getState().activeOutcomeVisualization,
    })
  },

  setMapReady: (ready: boolean) => useMapStore.setState({ mapReady: ready }),

  setMapError: (error: boolean) => useMapStore.setState({ mapError: error }),

  // Learn mode
  setActiveSection: (section: SectionId) =>
    useMapStore.setState({ activeSection: section }),

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

  // Explore mode layout
  setExplorePanelWidth: (width: number) =>
    useMapStore.setState({ explorePanelWidth: width }),

  resetLearnState: () =>
    useMapStore.setState({
      activeSection: "california",
      riversProgress: 0,
      geocoderMarker: null,
      learnMapScrollOffset: 0,
      activeOutcomeVisualization: null,
    }),

  // Visualization
  setOutcomeVisualization: (outcomeCode: string | null, scenarioId = "s0020") =>
    useMapStore.setState({
      activeOutcomeVisualization: outcomeCode
        ? { outcomeCode, scenarioId }
        : null,
    }),

  clearOutcomeVisualization: () =>
    useMapStore.setState({ activeOutcomeVisualization: null }),

  toggleOutcomeVisualization: (outcomeCode: string, scenarioId = "s0020") => {
    const current = useMapStore.getState().activeOutcomeVisualization
    useMapStore.setState({
      activeOutcomeVisualization:
        current?.outcomeCode === outcomeCode
          ? null
          : { outcomeCode, scenarioId },
    })
  },

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
  setOnLocationToggle: (fn: ((key: string) => void) | null) => {
    _onLocationToggle = fn
  },
  setOnLocationClick: (
    fn: ((info: { code: string; sourceId: string; tier: number }) => void) | null,
  ) => {
    _onLocationClick = fn
  },
  setOnLocationHover: (
    fn: ((info: { code: string; sourceId: string; tier: number } | null) => void) | null,
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

// Learn mode
export const useActiveSection = (): SectionId =>
  useMapStore((s) => s.activeSection)

export const useRiversProgress = () => useMapStore((s) => s.riversProgress)

export const useGeocoderMarker = () => useMapStore((s) => s.geocoderMarker)

export const useGeocodingResetCounter = () =>
  useMapStore((s) => s.geocodingResetCounter)

export const useLearnMapScrollOffset = () =>
  useMapStore((s) => s.learnMapScrollOffset)

// Explore mode layout
export const useExplorePanelWidth = () =>
  useMapStore((s) => s.explorePanelWidth)

// Derived layer visibility selectors
const createLayerSelector = (key: keyof SectionLayerConfig) => () =>
  useMapStore((s) => !!SECTION_LAYERS[s.activeSection][key])

export const useShowBasins = createLayerSelector("basins")
export const useShowRivers = createLayerSelector("rivers")
export const useShowArrows = createLayerSelector("arrows")
export const useShowInflowWatersheds = createLayerSelector("inflowWatersheds")

export const useCameraView = () =>
  useMapStore((s) => SECTION_LAYERS[s.activeSection].camera)

export const useDerivedArrowsOpacity = () =>
  useMapStore((s) => (SECTION_LAYERS[s.activeSection].arrows ? 1 : 0))

// Visualization
export const useActiveOutcomeVisualization = () =>
  useMapStore((s) => s.activeOutcomeVisualization)

export const useIsOutcomeVisualizationActive = () =>
  useMapStore((s) => s.activeOutcomeVisualization !== null)

// Tooltips
export const useClearTooltipsSignal = () =>
  useMapStore((s) => s.clearTooltipsSignal)

// Location highlights
export const useLocationHighlights = () =>
  useMapStore((s) => s.locationHighlights)
export const getOnLocationToggle = () => _onLocationToggle
export const getOnLocationClick = () => _onLocationClick
export const getOnLocationHover = () => _onLocationHover
