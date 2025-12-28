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

/** Map mode: hidden (preloading), learn (scrollytelling), explore (fixed panel) */
export type MapMode = "hidden" | "learn" | "explore"

/** Outcome visualization state used by both Learn and Explore modes */
export interface OutcomeVisualization {
  outcome: string
  scenarioId: string
}

// ============================================================================
// State
// ============================================================================

interface MapState {
  // Core
  mapMode: MapMode
  mapReady: boolean

  // Learn mode
  activeSection: SectionId
  riversProgress: number
  geocoderMarker: [number, number] | null
  geocodingResetCounter: number
  learnMapScrollOffset: number

  // Visualization
  activeOutcomeVisualization: OutcomeVisualization | null

  // Tooltip control signal (incrementing triggers clearAllPinned in VisualizationLayers)
  clearTooltipsSignal: number
}

const initialState: MapState = {
  mapMode: "hidden",
  mapReady: false,
  activeSection: "california",
  riversProgress: 0,
  geocoderMarker: null,
  geocodingResetCounter: 0,
  learnMapScrollOffset: 0,
  activeOutcomeVisualization: null,
  clearTooltipsSignal: 0,
}

// ============================================================================
// Store
// ============================================================================

export const useMapStore = create<MapState>()(immer(() => initialState))

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

  resetLearnState: () =>
    useMapStore.setState({
      activeSection: "california",
      riversProgress: 0,
      geocoderMarker: null,
      learnMapScrollOffset: 0,
      activeOutcomeVisualization: null,
    }),

  // Visualization
  setOutcomeVisualization: (outcome: string | null, scenarioId = "s0020") =>
    useMapStore.setState({
      activeOutcomeVisualization: outcome ? { outcome, scenarioId } : null,
    }),

  clearOutcomeVisualization: () =>
    useMapStore.setState({ activeOutcomeVisualization: null }),

  // Tooltips
  clearMapTooltips: () =>
    useMapStore.setState((state) => ({
      clearTooltipsSignal: state.clearTooltipsSignal + 1,
    })),
}

// ============================================================================
// Selectors
// ============================================================================

// Core
export const useMapMode = () => useMapStore((s) => s.mapMode)
export const useMapReady = () => useMapStore((s) => s.mapReady)

// Learn mode
export const useActiveSection = (): SectionId =>
  useMapStore((s) => s.activeSection)

export const useRiversProgress = () => useMapStore((s) => s.riversProgress)

export const useGeocoderMarker = () => useMapStore((s) => s.geocoderMarker)

export const useGeocodingResetCounter = () =>
  useMapStore((s) => s.geocodingResetCounter)

export const useLearnMapScrollOffset = () =>
  useMapStore((s) => s.learnMapScrollOffset)

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
