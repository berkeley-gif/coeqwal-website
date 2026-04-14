/**
 * COEQWAL custom tileset sources and runtime layer definitions.
 *
 * The satellite basemap style includes these tilesets in its "composite" source.
 * Non-satellite basemaps (Light, Streets) do not, so we inject them at runtime
 * as standalone vector tile sources.
 *
 * Tileset IDs come from the Mapbox Studio style JSON for
 * coeqwal/cmh2f40sm000w01qy8m0gaea8 (COEQWAL-main-satellite).
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TilesetSourceDef {
  /** Runtime source ID (used with map.addSource) */
  sourceId: string
  /** Mapbox tileset URL */
  url: string
}

export interface RuntimeLayerDef {
  id: string
  type: "fill" | "line" | "symbol"
  /** Which TilesetSourceDef.sourceId provides this source-layer */
  tilesetSourceId: string
  sourceLayer: string
  paint: Record<string, unknown>
  layout?: Record<string, unknown>
  filter?: unknown[]
}

// ============================================================================
// TILESET SOURCES
// ============================================================================

export const COEQWAL_TILESETS: TilesetSourceDef[] = [
  {
    sourceId: "coeqwal-demand-units",
    url: "mapbox://coeqwal.calsim_demand_units",
  },
  {
    sourceId: "coeqwal-wba",
    url: "mapbox://coeqwal.calsim-wba",
  },
  {
    sourceId: "coeqwal-reservoir",
    url: "mapbox://coeqwal.california-reservoir",
  },
  {
    sourceId: "coeqwal-delta-water",
    url: "mapbox://coeqwal.delta-water",
  },
]

// ============================================================================
// RUNTIME LAYERS
//
// These match the layer definitions in the satellite style JSON.
// On satellite the layers already exist (via composite) and are skipped.
// On non-satellite basemaps they are created at runtime.
// ============================================================================

export const RUNTIME_LAYERS: RuntimeLayerDef[] = [
  // -- Outcome polygon layers (hidden by default, styled by OutcomePolygonLayer) --
  {
    id: "demand-units",
    type: "fill",
    tilesetSourceId: "coeqwal-demand-units",
    sourceLayer: "demand_units",
    paint: {
      "fill-color": "#7094a9",
      "fill-outline-color": "#ffffff",
      "fill-opacity": 0.5,
    },
    layout: { visibility: "none" },
  },
  {
    id: "calsim-wba",
    type: "fill",
    tilesetSourceId: "coeqwal-wba",
    sourceLayer: "geoschem",
    paint: {
      "fill-color": "#70a981",
      "fill-opacity": 0.5,
      "fill-outline-color": "#ffffff",
    },
    layout: { visibility: "none" },
  },
  {
    id: "california-reservoir",
    type: "fill",
    tilesetSourceId: "coeqwal-reservoir",
    sourceLayer: "california-reservoir",
    paint: {
      "fill-color": "rgb(3, 34, 74)",
      "fill-outline-color": "rgba(255, 255, 255, 0)",
    },
    layout: { visibility: "none" },
  },

  // -- Context / decorative layers --
  {
    id: "delta-water",
    type: "fill",
    tilesetSourceId: "coeqwal-delta-water",
    sourceLayer: "delta_water",
    paint: {
      "fill-color": "rgb(42, 82, 135)",
      "fill-outline-color": "rgb(4, 47, 103)",
      "fill-opacity": 0.62,
    },
    layout: { visibility: "none" },
  },

  // -- Delta DETAW layers (always runtime-created, used by DELTA_ECO outcome) --
  {
    id: "delta-detaw",
    type: "fill",
    tilesetSourceId: "coeqwal-wba",
    sourceLayer: "geoschem",
    filter: ["==", ["get", "WBA_ID"], "DETAW"],
    paint: {
      "fill-color": "transparent",
      "fill-opacity": 0,
    },
    layout: { visibility: "none" },
  },
  {
    id: "delta-detaw-outline",
    type: "line",
    tilesetSourceId: "coeqwal-wba",
    sourceLayer: "geoschem",
    filter: ["==", ["get", "WBA_ID"], "DETAW"],
    paint: {
      "line-color": "#7EB8DA",
      "line-width": 4,
      "line-opacity": 0,
    },
    layout: { visibility: "none" },
  },
]

// ============================================================================
// HELPERS
// ============================================================================

const tilesetMap = new Map(
  COEQWAL_TILESETS.map((t) => [t.sourceId, t]),
)

/**
 * Ensure all custom COEQWAL sources and layers exist on the map.
 *
 * On the satellite basemap, most layers already exist via the "composite"
 * source and are skipped. On non-satellite basemaps, standalone vector tile
 * sources are added and layers created from scratch.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ensureCustomLayers(mapInstance: any) {
  for (const layer of RUNTIME_LAYERS) {
    if (mapInstance.getLayer(layer.id)) continue

    // Ensure the tileset source is available
    const { tilesetSourceId } = layer
    if (!mapInstance.getSource(tilesetSourceId)) {
      const tileset = tilesetMap.get(tilesetSourceId)
      if (!tileset) continue
      try {
        mapInstance.addSource(tilesetSourceId, {
          type: "vector",
          url: tileset.url,
        })
      } catch {
        /* source may already exist */
      }
    }

    // Use the standalone source if available, otherwise fall back to composite
    const source = mapInstance.getSource(tilesetSourceId)
      ? tilesetSourceId
      : "composite"

    try {
      mapInstance.addLayer({
        id: layer.id,
        type: layer.type,
        source,
        "source-layer": layer.sourceLayer,
        paint: layer.paint,
        layout: layer.layout ?? { visibility: "none" },
        ...(layer.filter ? { filter: layer.filter } : {}),
      })
    } catch {
      /* layer may already exist */
    }
  }
}

/**
 * Resolve which source name to use for a given source-layer.
 *
 * Checks for a known runtime layer that uses the source-layer, reads its
 * source from the map, and returns it. Falls back to "composite".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveSourceForQuery(mapInstance: any, layerId: string): string {
  try {
    const layer = mapInstance.getLayer(layerId)
    if (layer) return (layer as { source: string }).source
  } catch {
    /* ignore */
  }
  return "composite"
}
