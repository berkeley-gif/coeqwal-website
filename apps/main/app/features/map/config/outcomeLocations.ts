/**
 * Centralized location coordinate data for outcome visualizations.
 *
 * This file is the single source of truth for geographic coordinates used by
 * both the map visualization components (TierMarkers, TierLocationLabels) and
 * the get-started animation. Coordinates are hardcoded because the tier API
 * returns location IDs and tier levels but not geometry.
 */

// ============================================================================
// ENV_FLOWS - Environmental flow monitoring stations (diamond markers)
// ============================================================================

export const ENV_FLOWS_COORDINATES: Record<string, [number, number]> = {
  AMR004: [-121.44652, 38.58742],
  TRN111: [-122.80357, 40.71986],
  FTR029: [-121.60595, 39.13874],
  FTR003: [-121.64106, 38.82422],
  MOK028: [-121.33569, 38.19941],
  MCD005: [-120.93038, 37.37076],
  SAC000: [-121.89059, 38.04598],
  SAC049: [-121.50203, 38.4557],
  SAC122: [-121.82241, 39.02399],
  SAC148: [-121.9983, 39.23212],
  SAC257: [-122.1869, 40.28875],
  SJR127: [-120.89662, 37.29453],
  SAC289: [-122.35625, 40.53738],
  SJR070: [-121.26529, 37.67577],
  STS011: [-121.1642, 37.70396],
  TUO003: [-121.14185, 37.60423],
  YUB002: [-121.5773, 39.14433],
}

export const ENV_FLOWS_NAMES: Record<string, string> = {
  AMR004: "American River at I-80 Bridge",
  TRN111: "Trinity River at Lewiston",
  FTR029: "Feather River at Yuba City",
  FTR003: "Feather River",
  MOK028: "Mokelumne River",
  MCD005: "Merced River at Stevinson",
  SAC000: "Sacramento at confluence",
  SAC049: "Sacramento River at Freeport",
  SAC122: "Sacramento River at Tisdale Weir",
  SAC148: "Sacramento River at Colusa Weir",
  SAC257: "Sacramento River above Bend Bridge",
  SJR127: "San Joaquin at Salt Slough",
  SAC289: "Sacramento River (South Bonnieville)",
  SJR070: "San Joaquin near Vernalis",
  STS011: "Stanislaus River",
  TUO003: "Tuolumne River",
  YUB002: "Yuba River at Marysville",
}

// ============================================================================
// STATION COORDINATES - Compliance stations and pumping plants
// ============================================================================

export const STATION_COORDINATES: Record<string, [number, number]> = {
  EM: [-121.742, 38.0802],
  JP: [-121.685, 38.0519],
  CAA003: [-121.6209, 37.8007],
  DMC000: [-121.5854, 37.7967],
}

export const STATION_NAMES: Record<string, string> = {
  EM: "Emmaton (Salinity) Compliance Station",
  JP: "Jersey Point (Salinity) Compliance Station",
  CAA003: "Banks Pumping Plant",
  DMC000: "Jones Pumping Plant",
}

// ============================================================================
// RESERVOIRS - Coordinates and label stagger for reservoir polygon markers
// ============================================================================

export interface ReservoirConfig {
  coordinates: [number, number]
  staggerIndex: number
}

export const RESERVOIR_CONFIGS: Record<string, ReservoirConfig> = {
  "Trinity Lake": { coordinates: [-122.68, 40.98], staggerIndex: 0 },
  "Shasta Lake": { coordinates: [-122.23, 40.78], staggerIndex: 1 },
  "Lake Oroville": { coordinates: [-121.44, 39.56], staggerIndex: 0 },
  "Folsom Lake": { coordinates: [-121.12, 38.76], staggerIndex: 1 },
  "New Melones Lake": { coordinates: [-120.53, 37.98], staggerIndex: 0 },
  "San Luis Reservoir": { coordinates: [-121.13, 37.08], staggerIndex: 1 },
  "Millerton Lake": { coordinates: [-119.66, 37.01], staggerIndex: 0 },
}

// ============================================================================
// SALMON - Representative centroid for the Sacramento River
// ============================================================================

export const SALMON_RIVER_CENTROID: [number, number] = [-121.95, 39.5]

// ============================================================================
// UNIFIED LOOKUP
// ============================================================================

/**
 * Look up the geographic coordinates for a location within an outcome.
 * Returns [lng, lat] or null if coordinates are not available.
 */
export function getOutcomeLocationCoordinates(
  outcomeCode: string,
  locationId: string,
): [number, number] | null {
  switch (outcomeCode) {
    case "ENV_FLOWS":
      return ENV_FLOWS_COORDINATES[locationId] ?? null
    case "FW_DELTA_USES":
    case "FW_EXP":
      return STATION_COORDINATES[locationId] ?? null
    case "RES_STOR":
      return RESERVOIR_CONFIGS[locationId]?.coordinates ?? null
    case "WRC_SALMON_AB":
      return SALMON_RIVER_CENTROID
    default:
      return null
  }
}
