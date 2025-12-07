"use client"

/**
 * Learn Map Store
 *
 * Local Zustand store for the Learn section map choreography.
 * Uses direct Zustand import (not @repo/state) since this is app-specific.
 */

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

// ============================================================================
// Types
// ============================================================================

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
  | "strategy-row"
  | "key-operations"
  | "scenario-cards"
  | "scenario-conclusion"

export interface CameraView {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
}

export interface SectionLayerConfig {
  californiaLabel?: boolean
  centralValley?: boolean
  basins?: boolean
  inflowWatersheds?: boolean
  arrows?: boolean
  rivers?: boolean
  water?: boolean // Delta water layer
  camera?: CameraView
}

interface LearnMapState {
  activeSection: SectionId
  riversProgress: number
  arrowsOpacity: number
  geocoderMarker: [number, number] | null
  geocodingResetCounter: number // Incremented to trigger GeocodingPanel reset
  selectedOutcome: string | null
  isPanelsExpanded: boolean
}

// ============================================================================
// Configuration
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
  longitude: -126,
  latitude: 38.12,
  zoom: 10,
  bearing: 0,
  pitch: 0,
}

export const SECTION_LAYERS: Record<SectionId, SectionLayerConfig> = {
  california: {
    californiaLabel: true,
    camera: CALIFORNIA_VIEW,
  },
  "central-valley": {
    centralValley: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  basins: {
    basins: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  watersheds: {
    basins: true,
    inflowWatersheds: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  arrows: {
    basins: true,
    inflowWatersheds: true,
    arrows: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  "find-basin": {
    basins: true,
    inflowWatersheds: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  rivers: {
    basins: true,
    // inflowWatersheds fades out during rivers animation
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  delta: {
    basins: true,
    rivers: true,
    // water: NOT auto-shown - only shown when user clicks "Go to Delta" button
    camera: CENTRAL_VALLEY_VIEW, // Camera is controlled by DeltaInfoPanel button
  },
  distribution: {
    basins: true,
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  calsim: {
    basins: true,
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  coeqwal: {
    basins: true,
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  "public-data": {
    basins: true,
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  "scenario-intro": {
    basins: true,
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  "strategy-row": {
    basins: true,
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  "key-operations": {
    basins: true,
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  "scenario-cards": {
    basins: true,
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
  "scenario-conclusion": {
    basins: true,
    rivers: true,
    camera: CENTRAL_VALLEY_VIEW,
  },
}

// ============================================================================
// Store
// ============================================================================

const initialState: LearnMapState = {
  activeSection: "california",
  riversProgress: 0,
  arrowsOpacity: 0,
  geocoderMarker: null,
  geocodingResetCounter: 0,
  selectedOutcome: null,
  isPanelsExpanded: false,
}

export const useLearnMapStore = create<LearnMapState>()(
  immer(() => initialState),
)

// Actions (outside store for better tree-shaking)
export const learnMapActions = {
  setActiveSection: (section: SectionId) =>
    useLearnMapStore.setState({ activeSection: section }),

  setRiversProgress: (progress: number) =>
    useLearnMapStore.setState({ riversProgress: progress }),

  setArrowsOpacity: (opacity: number) =>
    useLearnMapStore.setState({ arrowsOpacity: opacity }),

  setGeocoderMarker: (marker: [number, number] | null) =>
    useLearnMapStore.setState({ geocoderMarker: marker }),

  resetGeocoding: () =>
    useLearnMapStore.setState((state) => ({
      geocoderMarker: null,
      geocodingResetCounter: state.geocodingResetCounter + 1,
    })),

  setSelectedOutcome: (outcome: string | null) =>
    useLearnMapStore.setState({ selectedOutcome: outcome }),

  setIsPanelsExpanded: (expanded: boolean) =>
    useLearnMapStore.setState({ isPanelsExpanded: expanded }),
}

// ============================================================================
// Selectors
// ============================================================================

export const useActiveSection = () => useLearnMapStore((s) => s.activeSection)

export const useRiversProgress = () => useLearnMapStore((s) => s.riversProgress)

export const useArrowsOpacity = () => useLearnMapStore((s) => s.arrowsOpacity)

export const useGeocoderMarker = () => useLearnMapStore((s) => s.geocoderMarker)

export const useGeocodingResetCounter = () =>
  useLearnMapStore((s) => s.geocodingResetCounter)

export const useIsPanelsExpanded = () =>
  useLearnMapStore((s) => s.isPanelsExpanded)

export const useSelectedOutcome = () =>
  useLearnMapStore((s) => s.selectedOutcome)

// Derived selectors
export const useShowBasins = () =>
  useLearnMapStore((s) => !!SECTION_LAYERS[s.activeSection].basins)

export const useShowRivers = () =>
  useLearnMapStore((s) => !!SECTION_LAYERS[s.activeSection].rivers)

export const useShowArrows = () =>
  useLearnMapStore((s) => !!SECTION_LAYERS[s.activeSection].arrows)

// Derived opacity for arrows - 1 when visible, 0 when not
export const useDerivedArrowsOpacity = () =>
  useLearnMapStore((s) => (SECTION_LAYERS[s.activeSection].arrows ? 1 : 0))

export const useCameraView = () =>
  useLearnMapStore((s) => SECTION_LAYERS[s.activeSection].camera)

export const useLayerConfig = () =>
  useLearnMapStore((s) => SECTION_LAYERS[s.activeSection])
