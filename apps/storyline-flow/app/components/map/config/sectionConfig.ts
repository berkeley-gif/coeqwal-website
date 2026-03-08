/**
 *
 */

import {
  CameraView,
  CALIFORNIA_VIEW,
  MAJOR_RIVER_VIEW,
  CENTRAL_VALLEY_VIEW,
  DELTA_WETLAND_VIEW,
  DELTA_VIEW,
  GOLD_RUSH_VIEW,
  DRINKING_VIEW,
  CITY_VIEW,
  IMPACT_SALMON_VIEW,
  IMPACT_DELTA_VIEW,
  IMPACT_DRINKING_VIEW,
} from "./cameraPresets"
import { LocationLabel } from "./locationPresets"

/* sectionIDs */
export type SectionId =
  | "opener"
  | "precipitation"
  | "variability"
  | "snowpack" // California's Water
  | "major-river"
  | "central-valley"
  | "delta-wetland"
  | "historical-delta"
  | "transition" // Natural Water Flow
  | "goldrush"
  | "drinking" // Humans
  | "transformation"
  | "city"
  | "agriculture"
  | "economy" // Water Transformation
  | "turning"
  | "impact-salmon"
  | "impact-delta"
  | "impact-groundwater"
  | "impact-water"
  | "impact-climate" // What Has Happened?
  | "resolution"
  | "builder"

export const SECTION_DIVISION = [
  {
    name: "California's Water",
    sections: ["opener", "precipitation", "variability", "snowpack"],
  },
  {
    name: "Natural Water Flow",
    sections: [
      "major-river",
      "central-valley",
      "delta-wetland",
      "historical-delta",
      "transition",
    ],
  },
  {
    name: "Humans",
    sections: ["goldrush", "drinking"],
  },
  {
    name: "Water Transformation",
    sections: ["transformation", "city", "agriculture", "economy"],
  },
  {
    name: "What Has Happened?",
    sections: [
      "turning",
      "impact-salmon",
      "impact-delta",
      "impact-groundwater",
      "impact-water",
      "impact-climate",
      "resolution",
      "builder",
    ],
  },
]

/**
 * Layer visibility configuration for a section.
 * Each boolean controls whether that layer group should be visible.
 * Missing = false (hidden).
 */
export interface SectionLayerConfig {
  // Native Mapbox layers (controlled via useMapLayers)
  californiaLabel?: boolean

  // React component layers (controlled via props)
  precipitation?: boolean
  snowpack?: boolean
  wetland?: boolean
  drinking?: boolean
  transformation?: boolean
  city?: boolean

  //boundary
  majorRivers?: boolean
  centralValleyBoundary?: boolean
  deltaBoundary?: boolean

  // labels
  locationLabels?: LocationLabel[]

  // tooltips
  variability?: boolean
  goldrush?: boolean
  impact?: boolean

  // Camera position
  camera?: CameraView
}

export const getSectionLayerConfig = (
  sectionId: SectionId,
): SectionLayerConfig => {
  const config: SectionLayerConfig = {}
  // Default camera view
  switch (sectionId) {
    case "major-river":
      config.camera = MAJOR_RIVER_VIEW
      break
    case "central-valley":
    case "agriculture":
      config.camera = CENTRAL_VALLEY_VIEW
      break
    case "delta-wetland":
      config.camera = DELTA_WETLAND_VIEW
      break
    case "historical-delta":
      config.camera = DELTA_VIEW
      break
    case "goldrush":
      config.camera = GOLD_RUSH_VIEW
      break
    case "drinking":
      config.camera = DRINKING_VIEW
      break
    case "city":
      config.camera = CITY_VIEW
      break
    case "impact-salmon":
      config.camera = IMPACT_SALMON_VIEW
      break
    case "impact-delta":
      config.camera = IMPACT_DELTA_VIEW
      break
    case "impact-water":
      config.camera = IMPACT_DRINKING_VIEW
      break
    default:
      config.camera = CALIFORNIA_VIEW
      break
  }
  // Layer visibility based on section
  switch (sectionId) {
    case "precipitation":
      config.precipitation = true
      break
    case "variability":
      config.variability = true
      break
    case "snowpack":
      config.snowpack = true
      break
    case "major-river":
      config.majorRivers = true
      break
    case "central-valley":
      config.centralValleyBoundary = true
      break
    case "delta-wetland":
      config.wetland = true
      break
    case "historical-delta":
      config.deltaBoundary = true
      break
    case "goldrush":
      config.goldrush = true
      break
    case "drinking":
      config.drinking = true
      break
    case "transformation":
      config.transformation = true
      break
    case "city":
      config.city = true
      break
    case "impact-salmon":
    case "impact-delta":
    case "impact-water":
    case "impact-climate":
      config.impact = true
      break
    default:
      break
  }
  return config
}
