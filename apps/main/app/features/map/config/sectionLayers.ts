/**
 * Section layer configuration - single source of truth for layer visibility per section
 */

import {
  CameraView,
  CALIFORNIA_VIEW,
  CENTRAL_VALLEY_VIEW,
  CALIFORNIA_CENTERED_VIEW,
} from "./cameraPresets"

/** Section IDs for Learn mode scrollytelling */
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
  | "scenario-intro"
  | "scenario-conclusion"

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

/**
 * SECTION_LAYERS: Single source of truth for layer visibility.
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
  "scenario-intro": { ...BASINS_AND_RIVERS, camera: CALIFORNIA_CENTERED_VIEW },
  "scenario-conclusion": {
    ...BASINS_AND_RIVERS,
    camera: CALIFORNIA_CENTERED_VIEW,
  },
}
