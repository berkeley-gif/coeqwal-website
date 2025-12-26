/**
 * Outcome layer registry
 *
 * Single source of truth for all outcome layer configurations.
 *
 * To add a new outcome:
 * 1. Add an entry to OUTCOME_LAYER_REGISTRY
 * 2. Ensure the Mapbox layer exists in the style
 * 3. The visualization system will handle it automatically
 */

// ============================================================================
// TYPES
// ============================================================================

/** Geometry type for the layer */
export type GeometryType = "polygon" | "point" | "line" | "react-marker"

/** Layer type identifier */
export type LayerType =
  | "demand-units"
  | "wba"
  | "reservoir"
  | "delta"
  | "river"
  | "marker"

/** Source of tooltip data */
export type TooltipFieldSource =
  | "mapbox" // From Mapbox feature properties
  | "api" // From COEQWAL API response
  | "computed" // Computed from other fields

/** Format options for displaying values */
export type TooltipFieldFormat =
  | "text" // Plain text (default)
  | "acres" // Number with " acres" suffix and toLocaleString()
  | "acrefeet" // Number with " acre-feet" suffix
  | "number" // toLocaleString() formatting

/** Typography variant for the field */
export type TooltipFieldVariant = "body2" | "caption"

/** Definition for a single tooltip field */
export interface TooltipFieldDef {
  key: string
  label: string | null
  source: TooltipFieldSource
  mapboxKey?: string
  apiKey?: string
  format?: TooltipFieldFormat
  variant?: TooltipFieldVariant
  isPrimary?: boolean
  isSecondary?: boolean
}

/** Configuration for an outcome layer */
export interface OutcomeLayerConfig {
  /** Geometry type */
  geometryType: GeometryType
  /** Layer type identifier */
  layerType: LayerType
  /** Mapbox layer ID for the fill/circle/line layer */
  mapboxLayerId: string
  /** Mapbox source (for non-composite sources) */
  mapboxSource?: string
  /** Mapbox source layer name */
  sourceLayer?: string
  /** Property name for feature ID matching */
  idProperty?: string
  /** Class filter for demand-units layer */
  classFilter?: "Agriculture" | "Urban" | "Refuge" | "N/A"
  /** API tier code for fetching tier data */
  tierCode: string
  /** Whether this outcome requires ID matching (false for single-feature layers) */
  requiresIdMatching: boolean
  /** Tooltip field definitions */
  tooltipFields: TooltipFieldDef[]
  /** Label for the feature ID in tooltip */
  idLabel?: string
  /** For point layers: circle radius */
  circleRadius?: number
  /** For point layers: circle stroke width */
  circleStrokeWidth?: number
  /** For line layers: line width */
  lineWidth?: number
  /** React layer IDs (for React-rendered layers like rivers) */
  reactLayerIds?: string[]
  /** Default zoom level for Learn mode (defaults to 6.5) */
  defaultZoom?: number
  /** Default center point for Learn mode [longitude, latitude] */
  defaultCenter?: [number, number]
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Mapbox layer IDs */
export const LAYER_IDS = {
  // Polygon layers
  demandUnits: {
    fill: "demand-units",
    outline: "demand-units-outline",
  },
  wba: {
    fill: "calsim-wba",
    outline: "calsim-wba-outline",
  },
  delta: {
    fill: "delta-water",
    outline: "delta-water-outline",
  },
  // Reservoir layer (polygon)
  reservoir: {
    fill: "california-reservoir",
    outline: "california-reservoir-outline",
    label: "california-reservoir-labels",
  },
  // Line layers (React-rendered)
  sacramento: {
    trough: "sacramento-river-trough",
    body: "sacramento-river-body",
  },
  sanJoaquin: {
    trough: "san-joaquin-river-trough",
    body: "san-joaquin-river-body",
  },
  // Utility layers
  basemapDim: "basemap-dim-overlay",
} as const

/** All river layer IDs for z-index management */
export const RIVER_LAYER_IDS = [
  LAYER_IDS.sacramento.trough,
  LAYER_IDS.sacramento.body,
  LAYER_IDS.sanJoaquin.trough,
  LAYER_IDS.sanJoaquin.body,
] as const

/** Basemap dim opacity */
export const BASEMAP_DIM_OPACITY = 0.15

/**
 * TODO: Update the california-reservoir Mapbox tileset to include a `calsim_id` property
 * with these short codes, then update the registry to use `idProperty: "calsim_id"` and
 * remove this mapping. In the meantime:
 *
 * Mapping from CalSim short codes (returned by API) to Mapbox gnisidlabel values
 */
export const RESERVOIR_CALSIM_TO_GNISIDLABEL: Record<string, string> = {
  FOLSM: "Folsom Lake",
  MELON: "New Melones Lake",
  MLRTN: "Millerton Lake",
  OROVL: "Lake Oroville",
  SHSTA: "Shasta Lake",
  SLUIS_CVP: "San Luis Reservoir", // CVP portion
  SLUIS_SWP: "San Luis Reservoir", // SWP portion (same reservoir)
  TRNTY: "Trinity Lake",
}

// ============================================================================
// OUTCOME LAYER REGISTRY
// ============================================================================

/**
 * Registry of all outcome layers
 */
export const OUTCOME_LAYER_REGISTRY: Record<string, OutcomeLayerConfig> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // POLYGON LAYERS (Mapbox vector tiles with ID matching)
  // ═══════════════════════════════════════════════════════════════════════════

  "Community deliveries": {
    geometryType: "polygon",
    layerType: "demand-units",
    mapboxLayerId: "demand-units",
    sourceLayer: "demand-units",
    idProperty: "DU_ID",
    classFilter: "Urban",
    tierCode: "CWS_DEL",
    requiresIdMatching: true,
    tooltipFields: [
      {
        key: "urbName",
        label: null,
        source: "mapbox",
        mapboxKey: "Urb_Name",
        isPrimary: true,
      },
      {
        key: "modName",
        label: null,
        source: "mapbox",
        mapboxKey: "Mod_Name",
        isSecondary: true,
      },
      {
        key: "subName",
        label: null,
        source: "mapbox",
        mapboxKey: "Sub_Name",
        variant: "body2",
      },
      {
        key: "comments",
        label: null,
        source: "mapbox",
        mapboxKey: "Comments",
        variant: "caption",
      },
      {
        key: "type",
        label: null,
        source: "mapbox",
        mapboxKey: "Type",
        variant: "caption",
      },
    ],
    idLabel: "CalSim ID",
  },

  "Agricultural revenue": {
    geometryType: "polygon",
    layerType: "demand-units",
    mapboxLayerId: "demand-units",
    sourceLayer: "demand-units",
    idProperty: "DU_ID",
    classFilter: "Agriculture",
    tierCode: "AG_REV",
    requiresIdMatching: true,
    tooltipFields: [
      {
        key: "modName",
        label: null,
        source: "mapbox",
        mapboxKey: "Mod_Name",
        isPrimary: true,
      },
      {
        key: "subName",
        label: null,
        source: "mapbox",
        mapboxKey: "Sub_Name",
        variant: "body2",
      },
      {
        key: "comments",
        label: null,
        source: "mapbox",
        mapboxKey: "Comments",
        variant: "caption",
      },
      {
        key: "type",
        label: null,
        source: "mapbox",
        mapboxKey: "Type",
        variant: "caption",
      },
    ],
    idLabel: "CalSim ID",
  },

  "Groundwater storage": {
    geometryType: "polygon",
    layerType: "wba",
    mapboxLayerId: "calsim-wba",
    sourceLayer: "geoschem",
    idProperty: "WBA_ID",
    tierCode: "GW_STOR",
    requiresIdMatching: true,
    tooltipFields: [
      {
        key: "locationName",
        label: null,
        source: "api",
        apiKey: "location_name",
        isPrimary: true,
      },
      {
        key: "hydroRegion",
        label: "Region",
        source: "mapbox",
        mapboxKey: "HydroRegion",
        variant: "body2",
      },
      {
        key: "gisAcres",
        label: "Area",
        source: "mapbox",
        mapboxKey: "GIS_Acres",
        format: "acres",
        variant: "caption",
      },
    ],
    idLabel: "WBA ID",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RESERVOIR LAYER (polygon - represents reservoir footprints)
  // ═══════════════════════════════════════════════════════════════════════════

  "Reservoir storage": {
    geometryType: "polygon",
    layerType: "reservoir",
    mapboxLayerId: "california-reservoir",
    mapboxSource: "coeqwal.california-reservoir",
    sourceLayer: "california-reservoir",
    idProperty: "gnisidlabel",
    tierCode: "RES_STOR",
    requiresIdMatching: true,
    tooltipFields: [
      {
        key: "locationName",
        label: null,
        source: "api",
        apiKey: "location_name",
        isPrimary: true,
      },
      {
        key: "gnisidlabel",
        label: "GNIS ID",
        source: "mapbox",
        mapboxKey: "gnisidlabel",
        variant: "caption",
      },
    ],
    idLabel: "Reservoir ID",
    defaultZoom: 6, // zoom to see all reservoirs across California
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SINGLE-FEATURE POLYGON LAYERS (no ID matching needed)
  // ═══════════════════════════════════════════════════════════════════════════

  "Delta estuary ecology": {
    geometryType: "polygon",
    layerType: "delta",
    mapboxLayerId: "delta-water",
    mapboxSource: "coeqwal.delta-water",
    sourceLayer: "delta-water",
    tierCode: "DELTA_ECO",
    requiresIdMatching: false, // Single polygon, no ID matching
    tooltipFields: [
      { key: "name", label: null, source: "computed", isPrimary: true },
    ],
    idLabel: "Delta",
    // Camera settings for single-feature outcome
    defaultZoom: 9,
    defaultCenter: [-121.5, 38.05], // Delta region center
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LINE LAYERS (React-rendered, highlighting existing rivers)
  // ═══════════════════════════════════════════════════════════════════════════

  "Salmon abundance": {
    geometryType: "line",
    layerType: "river",
    mapboxLayerId: "sacramento-river-body", // Primary layer for interactions
    tierCode: "WRC_SALMON_AB",
    requiresIdMatching: false, // Single river, no ID matching
    lineWidth: 4,
    reactLayerIds: ["sacramento-river-trough", "sacramento-river-body"],
    tooltipFields: [
      { key: "name", label: null, source: "computed", isPrimary: true },
    ],
    idLabel: "River",
    defaultZoom: 6.5,
    defaultCenter: [-121.5, 40], // Sacramento River center
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REACT MARKER LAYERS (API-fetched points rendered as React components)
  // ═══════════════════════════════════════════════════════════════════════════

  "Environmental flows": {
    geometryType: "react-marker",
    layerType: "marker",
    mapboxLayerId: "", // No Mapbox layer - React rendered
    tierCode: "ENV_FLOWS",
    requiresIdMatching: false,
    tooltipFields: [
      {
        key: "locationName",
        label: null,
        source: "api",
        apiKey: "location_name",
        isPrimary: true,
      },
    ],
    idLabel: "Station ID",
  },

  "Freshwater for in-Delta uses": {
    geometryType: "react-marker",
    layerType: "marker",
    mapboxLayerId: "", // No Mapbox layer - React rendered
    tierCode: "FW_DELTA_USES",
    requiresIdMatching: false,
    tooltipFields: [
      {
        key: "locationName",
        label: null,
        source: "api",
        apiKey: "location_name",
        isPrimary: true,
      },
    ],
    idLabel: "Station ID",
  },

  "Freshwater for Delta exports": {
    geometryType: "react-marker",
    layerType: "marker",
    mapboxLayerId: "", // No Mapbox layer - React rendered
    tierCode: "FW_EXP",
    requiresIdMatching: false,
    tooltipFields: [
      {
        key: "locationName",
        label: null,
        source: "api",
        apiKey: "location_name",
        isPrimary: true,
      },
    ],
    idLabel: "Station ID",
  },
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get layer config by outcome name
 */
export function getOutcomeConfig(outcome: string): OutcomeLayerConfig | null {
  return OUTCOME_LAYER_REGISTRY[outcome] || null
}

/**
 * Check if an outcome exists in the registry
 */
export function isValidOutcome(outcome: string): boolean {
  return outcome in OUTCOME_LAYER_REGISTRY
}

/**
 * Check if an outcome uses Mapbox layers (vs React markers)
 */
export function outcomeUsesMapboxLayers(outcome: string): boolean {
  const config = OUTCOME_LAYER_REGISTRY[outcome]
  return config?.geometryType !== "react-marker"
}

/**
 * Check if an outcome uses polygon visualization
 *
 * TODO: Deprecate this function - use getOutcomeConfig(outcome)?.geometryType === "polygon" instead
 */
export function outcomeUsesPolygons(outcome: string): boolean {
  const config = OUTCOME_LAYER_REGISTRY[outcome]
  return config?.geometryType === "polygon"
}

/**
 * Get all outcome names
 */
export function getAllOutcomes(): string[] {
  return Object.keys(OUTCOME_LAYER_REGISTRY)
}

/**
 * Get outcomes by geometry type
 */
export function getOutcomesByGeometry(geometryType: GeometryType): string[] {
  return Object.entries(OUTCOME_LAYER_REGISTRY)
    .filter(([, config]) => config.geometryType === geometryType)
    .map(([name]) => name)
}

/**
 * Get Mapbox layer IDs for an outcome
 *
 * TODO: Consider removing this helper - callers should use getOutcomeConfig() directly
 */
export function getOutcomeLayerIds(outcome: string): {
  fill?: string
  outline?: string
} {
  const config = OUTCOME_LAYER_REGISTRY[outcome]
  if (!config) return {}

  switch (config.layerType) {
    case "demand-units":
      return LAYER_IDS.demandUnits
    case "wba":
      return LAYER_IDS.wba
    case "delta":
      return LAYER_IDS.delta
    case "reservoir":
      return LAYER_IDS.reservoir
    default:
      return {}
  }
}
