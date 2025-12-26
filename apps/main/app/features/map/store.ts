"use client"

/**
 * Learn Map Store
 *
 * Central state management for the Learn section map choreography.
 * SECTION_LAYERS is the single source of truth for what layers
 * should be visible at each scroll position.
 */

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

// ============================================================================
// Types
// ============================================================================

/**
 * MapMode controls which tab/context the persistent map is serving.
 * - 'hidden': Map is preloading but not visible
 * - 'learn': Map is in Learn tab mode (sticky, scrollytelling)
 * - 'explore': Map is in Explore tab mode (fixed right panel)
 */
export type MapMode = "hidden" | "learn" | "explore"

export type SectionId =
  | "california"
  | "central-valley"
  | "basins"
  | "watersheds"
  | "arrows"
  | "find-basin"
  | "rivers"
  | "delta"
  | "distribution"
  | "calsim"
  | "coeqwal"
  | "public-data"
  | "scenario-intro"
  | "scenario-conclusion"

export interface CameraView {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
}

/**
 * Layer visibility configuration for a section.
 * Each boolean controls whether that layer group should be visible.
 * Missing = false (hidden).
 */
export interface SectionLayerConfig {
  // Native Mapbox layers (controlled via useMapLayers)
  californiaLabel?: boolean
  centralValley?: boolean
  inflowWatersheds?: boolean

  // React component layers (controlled via props)
  basins?: boolean
  rivers?: boolean
  arrows?: boolean

  // Camera position
  camera?: CameraView
}

// ============================================================================
// Camera presets
// ============================================================================

export const CALIFORNIA_VIEW: CameraView = {
  longitude: -120.2,
  latitude: 37.5,
  zoom: 5,
  bearing: 0,
  pitch: 0,
}

export const CENTRAL_VALLEY_VIEW: CameraView = {
  longitude: -120.8,
  latitude: 38.5,
  zoom: 5.82,
  bearing: 0,
  pitch: 0,
}

export const DELTA_VIEW: CameraView = {
  longitude: -121.8,
  latitude: 38.12,
  zoom: 10,
  bearing: 0,
  pitch: 0,
}

// ============================================================================
// Section layer configuration
// ============================================================================

/**
 * SECTION_LAYERS: The single source of truth for layer visibility.
 *
 * Each section defines exactly which layers should be visible.
 * The system compares current vs previous section and applies
 * the differences with smooth animations.
 *
 * Layer groups:
 * - californiaLabel: "California" text label on the map
 * - centralValley: Central Valley outline + label
 * - basins: Basin outlines + labels (React component)
 * - inflowWatersheds: Mountain watershed fills
 * - arrows: Inflow arrows (React component)
 * - rivers: River lines + labels (React component)
 */

// Shared config for sections that show basins + rivers
const BASINS_AND_RIVERS: SectionLayerConfig = {
  basins: true,
  rivers: true,
  camera: CENTRAL_VALLEY_VIEW,
}

export const SECTION_LAYERS: Record<SectionId, SectionLayerConfig> = {
  // === Introduction ===
  california: {
    californiaLabel: true,
    camera: CALIFORNIA_VIEW,
  },

  // === Central Valley ===
  "central-valley": {
    centralValley: true,
    camera: CENTRAL_VALLEY_VIEW,
  },

  // === Basins ===
  basins: {
    basins: true,
    camera: CENTRAL_VALLEY_VIEW,
  },

  // === Watersheds (basins + inflow fills) ===
  watersheds: {
    basins: true,
    inflowWatersheds: true,
    camera: CENTRAL_VALLEY_VIEW,
  },

  // === Arrows (basins + inflow + arrows) ===
  arrows: {
    basins: true,
    inflowWatersheds: true,
    arrows: true,
    camera: CENTRAL_VALLEY_VIEW,
  },

  // === Find Basin (geocoding) ===
  "find-basin": {
    basins: true,
    inflowWatersheds: true,
    camera: CENTRAL_VALLEY_VIEW,
  },

  // === Rivers onwards - basins + rivers stay visible ===
  rivers: BASINS_AND_RIVERS,
  delta: BASINS_AND_RIVERS,
  distribution: BASINS_AND_RIVERS,
  calsim: BASINS_AND_RIVERS,
  coeqwal: BASINS_AND_RIVERS,
  "public-data": BASINS_AND_RIVERS,
  "scenario-intro": BASINS_AND_RIVERS,
  "scenario-conclusion": BASINS_AND_RIVERS,
}

// ============================================================================
// Explore-specific types
// ============================================================================

export interface ExploreTierSelection {
  strategy: string
  outcome: string
}

// ============================================================================
// State Interface
// ============================================================================

interface LearnMapState {
  // Persistent map state (shared across tabs)
  mapMode: MapMode
  mapReady: boolean

  // Learn-specific state
  activeSection: SectionId
  riversProgress: number
  geocoderMarker: [number, number] | null
  geocodingResetCounter: number
  selectedOutcome: string | null
  isOutcomeVisualizationActive: boolean

  // Map scroll offset - when > 0, the map scrolls up with content
  // This creates the "release from sticky" effect at end of scrollytelling
  learnMapScrollOffset: number

  // Explore-specific state
  exploreTierSelection: ExploreTierSelection | null
}

const initialState: LearnMapState = {
  // Persistent map state
  mapMode: "hidden",
  mapReady: false,

  // Learn-specific state
  activeSection: "california",
  riversProgress: 0,
  geocoderMarker: null,
  geocodingResetCounter: 0,
  selectedOutcome: null,
  isOutcomeVisualizationActive: false,
  learnMapScrollOffset: 0,

  // Explore-specific state
  exploreTierSelection: null,
}

// ============================================================================
// Store
// ============================================================================

export const useLearnMapStore = create<LearnMapState>()(
  immer(() => initialState),
)

// ============================================================================
// Actions
// ============================================================================

export const learnMapActions = {
  // === Persistent Map Actions ===

  /**
   * Set the map mode (which tab/context the map is serving).
   * The PersistentMap component uses this to adjust its position and layers.
   *
   * This also clears the opposite mode's state synchronously to prevent
   * race conditions and stale visualizations.
   */
  setMapMode: (mode: MapMode) => {
    if (mode === "learn") {
      // Entering Learn mode: clear Explore state
      useLearnMapStore.setState({
        exploreTierSelection: null,
        mapMode: mode,
      })
    } else if (mode === "explore") {
      // Entering Explore mode: clear Learn outcome state
      useLearnMapStore.setState({
        selectedOutcome: null,
        isOutcomeVisualizationActive: false,
        mapMode: mode,
      })
    } else {
      // Hidden mode: clear both
      useLearnMapStore.setState({
        selectedOutcome: null,
        isOutcomeVisualizationActive: false,
        exploreTierSelection: null,
        mapMode: mode,
      })
    }
  },

  /**
   * Set map ready state. Called when WebGL context is initialized.
   */
  setMapReady: (ready: boolean) =>
    useLearnMapStore.setState({ mapReady: ready }),

  // === Learn-specific Actions ===

  setActiveSection: (section: SectionId) =>
    useLearnMapStore.setState({ activeSection: section }),

  setRiversProgress: (progress: number) =>
    useLearnMapStore.setState({ riversProgress: progress }),

  setGeocoderMarker: (marker: [number, number] | null) =>
    useLearnMapStore.setState({ geocoderMarker: marker }),

  resetGeocoding: () =>
    useLearnMapStore.setState((state) => ({
      geocoderMarker: null,
      geocodingResetCounter: state.geocodingResetCounter + 1,
    })),

  setSelectedOutcome: (outcome: string | null) =>
    useLearnMapStore.setState({
      selectedOutcome: outcome,
      isOutcomeVisualizationActive: outcome !== null,
    }),

  /**
   * Set the scroll offset for the Learn map.
   * When > 0, the map translates up, creating a "release from sticky" effect.
   */
  setLearnMapScrollOffset: (offset: number) =>
    useLearnMapStore.setState({ learnMapScrollOffset: offset }),

  /**
   * Reset Learn-specific state when Learn tab remounts.
   * Does NOT reset mapReady since the persistent map stays alive.
   */
  resetLearnState: () =>
    useLearnMapStore.setState({
      activeSection: "california",
      riversProgress: 0,
      geocoderMarker: null,
      selectedOutcome: null,
      isOutcomeVisualizationActive: false,
      learnMapScrollOffset: 0,
    }),

  // === Explore-specific Actions ===

  /**
   * Set the selected tier for Explore map view.
   * This controls which tier markers are shown on the map.
   */
  setExploreTierSelection: (selection: ExploreTierSelection | null) =>
    useLearnMapStore.setState({ exploreTierSelection: selection }),

  /**
   * Reset Explore-specific state.
   */
  resetExploreState: () =>
    useLearnMapStore.setState({
      exploreTierSelection: null,
    }),
}

// ============================================================================
// Selectors
// ============================================================================

// Persistent map state
export const useMapMode = () => useLearnMapStore((s) => s.mapMode)
export const useMapReady = () => useLearnMapStore((s) => s.mapReady)

// Learn-specific state
export const useActiveSection = (): SectionId =>
  useLearnMapStore((s) => s.activeSection)

export const useRiversProgress = () => useLearnMapStore((s) => s.riversProgress)

export const useGeocoderMarker = () => useLearnMapStore((s) => s.geocoderMarker)

export const useGeocodingResetCounter = () =>
  useLearnMapStore((s) => s.geocodingResetCounter)

export const useSelectedOutcome = () =>
  useLearnMapStore((s) => s.selectedOutcome)

export const useIsOutcomeVisualizationActive = () =>
  useLearnMapStore((s) => s.isOutcomeVisualizationActive)

export const useLearnMapScrollOffset = () =>
  useLearnMapStore((s) => s.learnMapScrollOffset)

// Explore-specific state
export const useExploreTierSelection = () =>
  useLearnMapStore((s) => s.exploreTierSelection)

// Derived selectors - read directly from SECTION_LAYERS
// Helper to create layer visibility selectors
const createLayerSelector = (key: keyof SectionLayerConfig) => () =>
  useLearnMapStore((s) => !!SECTION_LAYERS[s.activeSection][key])

export const useShowBasins = createLayerSelector("basins")
export const useShowRivers = createLayerSelector("rivers")
export const useShowArrows = createLayerSelector("arrows")
export const useShowInflowWatersheds = createLayerSelector("inflowWatersheds")

export const useCameraView = () =>
  useLearnMapStore((s) => SECTION_LAYERS[s.activeSection].camera)

// Arrows opacity: 1 when visible, 0 when not
export const useDerivedArrowsOpacity = () =>
  useLearnMapStore((s) => (SECTION_LAYERS[s.activeSection].arrows ? 1 : 0))
