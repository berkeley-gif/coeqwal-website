/**
 * Section layer configuration - single source of truth for layer visibility per section
 */

import {
  CameraView,
  CALIFORNIA_VIEW,
  CENTRAL_VALLEY_VIEW,
  DELTA_VIEW,
} from "./cameraPresets"

/** Section IDs for Learn mode scrollytelling */
export type SectionId =
  | "intro"
  | "california"
  | "central-valley"
  | "rivers"
  | "distribution"
  | "calsim"

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
  intro: {
    camera: CALIFORNIA_VIEW,
  },

  // === California intro === 
  california: {
    californiaLabel: true,
    camera: CALIFORNIA_VIEW,
  },

  // === Central Valley ===
  "central-valley": {
    centralValley: true,
    camera: CENTRAL_VALLEY_VIEW,
  },

  // === Rivers onwards - basins + rivers stay visible ===
  rivers: { ...BASINS_AND_RIVERS, camera: DELTA_VIEW },
  distribution: { ...BASINS_AND_RIVERS, arrows: true },
  calsim: {
    ...BASINS_AND_RIVERS,
    camera: CENTRAL_VALLEY_VIEW,
  },
}
