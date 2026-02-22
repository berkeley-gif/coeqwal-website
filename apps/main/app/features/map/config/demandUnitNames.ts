/**
 * Static mapping of demand unit IDs to their display names
 *
 * This provides a fallback when Mapbox tiles aren't loaded (e.g., at lower zoom levels).
 * The Mapbox tileset has Sub_Name, Urb_Name, and Mod_Name fields, but querySourceFeatures
 * only returns features from tiles currently in memory.
 *
 * Priority: Sub_Name > Urb_Name > Mod_Name
 *
 * Add entries here for any demand units that need reliable name display.
 */

export interface DemandUnitNameInfo {
  subName?: string
  urbName?: string
  modName?: string
}

/**
 * Static name lookup for demand units
 * Key: DU_ID (e.g., "13_NU2")
 * Value: Name info with Sub_Name, Urb_Name, Mod_Name
 */
export const DEMAND_UNIT_NAMES: Record<string, DemandUnitNameInfo> = {
  // Community Water Systems - small polygons that may not load in tiles
  "13_NU2": {
    urbName: "Palermo, Wyandotte, Vista Robles, and Bangor",
    modName: "Non-Urban",
  },
  "24_NU4": {
    urbName: "Small Communities",
    modName: "Non-Urban",
  },
  "02_PU": {
    subName: "Keswick",
    urbName: "Shasta Co S.A. #25 - Keswick C.S.D.",
  },
  "02_SU": {
    subName: "Redding",
    urbName: "City of Redding",
  },
  "03_PU2": {
    subName: "Bella Vista and Palo Cedro",
    urbName: "Bella Vista W.D.",
  },
  "Musco Family Olive Company": {
    urbName: "Musco Family Olive Company",
  },

  // Add more demand units as needed
  // Format:
  // "DU_ID": {
  //   subName: "Sub Name if available",
  //   urbName: "Urban Name if available",
  //   modName: "Model Name if available",
  // },
}

/**
 * Get the best display name for a demand unit
 * Priority: Sub_Name > Urb_Name > Mod_Name > duId
 */
export function getDemandUnitDisplayName(duId: string): string {
  const info = DEMAND_UNIT_NAMES[duId]
  if (!info) return duId

  return info.subName || info.urbName || info.modName || duId
}

/**
 * Get full name info for a demand unit
 */
export function getDemandUnitNameInfo(
  duId: string,
): DemandUnitNameInfo | undefined {
  return DEMAND_UNIT_NAMES[duId]
}
