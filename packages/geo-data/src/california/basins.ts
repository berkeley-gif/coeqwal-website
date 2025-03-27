export const WATERSHEDS_BASINS_PATH =
  "/california/allwatersheds_4326_with_ids.geojson"

export interface WatershedBasin {
  id: number
  name: string
  // Add any other properties that exist in the geojson
}

export const watershedsMetadata = {
  description: "California watersheds basin boundaries",
  source: "California Department of Water Resources",
  lastUpdated: "2023",
}
