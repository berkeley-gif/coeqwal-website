// This file defines types and constants for groundwater basins
// NOTE: We're using inline GeoJSON data in the components instead of loading from a file

// Path is kept for type compatibility but the file is not actually used
export const GROUNDWATER_BASINS_PATH = "/placeholder-not-used.json"

export interface GroundwaterBasin {
  id: string
  name: string
  status: "critical" | "high-priority" | "medium-priority" | "low-priority"
}

export const groundwaterMetadata = {
  description: "California groundwater basin boundaries as defined by DWR",
  source: "California Department of Water Resources",
  lastUpdated: "2023-04-15",
}
