/**
 * Polygon layer registry
 * 
 * Single source of truth for polygon layer configuration.
 * To add a new layer, add an entry to this registry.
 * Tooltip fields are defined alongside layer config.
 */

// ============================================================================
// TYPES
// ============================================================================

/** Layer type identifier */
export type LayerType = "demand-units" | "wba"

/** Source of tooltip field data */
export type TooltipFieldSource = 
  | "mapbox"   // From Mapbox feature properties
  | "api"      // From COEQWAL API response
  | "computed" // Computed from other fields

/** Format options for displaying values */
export type TooltipFieldFormat = 
  | "text"       // Plain text (default)
  | "acres"      // Number with " acres" suffix and toLocaleString()
  | "acrefeet"   // Number with " acre-feet" suffix
  | "number"     // toLocaleString() formatting

/** Typography variant for the field */
export type TooltipFieldVariant = "body2" | "caption"

/** Definition for a single tooltip field */
export interface TooltipFieldDef {
  /** Unique key for this field */
  key: string
  /** Label prefix (e.g., "Region:" for "Region: SAC"). Null for no label. */
  label: string | null
  /** Where to get the data from */
  source: TooltipFieldSource
  /** Property key in Mapbox feature (when source is "mapbox") */
  mapboxKey?: string
  /** Property key in API response (when source is "api") */
  apiKey?: string
  /** How to format the value */
  format?: TooltipFieldFormat
  /** Typography variant */
  variant?: TooltipFieldVariant
  /** Whether this is the primary name (bold, blue) */
  isPrimary?: boolean
  /** Whether this is a secondary name (grey) */
  isSecondary?: boolean
}

/** Configuration for a polygon layer */
export interface PolygonLayerConfig {
  /** Layer type identifier */
  layerType: LayerType
  /** Mapbox layer ID for the fill layer */
  mapboxLayerId: string
  /** Mapbox source layer name */
  sourceLayer: string
  /** Property name for feature ID matching (e.g., "DU_ID", "WBA_ID") */
  idProperty: string
  /** Class filter for demand-units layer (e.g., "Urban", "Agriculture") */
  classFilter?: "Agriculture" | "Urban" | "Refuge" | "N/A"
  /** API tier code for fetching tier data */
  tierCode: string
  /** Tooltip field definitions */
  tooltipFields: TooltipFieldDef[]
  /** Label for the feature ID in tooltip (e.g., "CalSim ID", "WBA ID") */
  idLabel: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Mapbox layer IDs */
export const LAYER_IDS = {
  demandUnits: {
    fill: "demand-units",
    outline: "demand-units-outline",
  },
  wba: {
    fill: "calsim-wba",
    outline: "calsim-wba-outline",
  },
  basemapDim: "basemap-dim-overlay",
} as const

/** Basemap dim opacity */
export const BASEMAP_DIM_OPACITY = 0.15

// ============================================================================
// LAYER REGISTRY
// ============================================================================

/**
 * Registry of all polygon layers
 * 
 * To add a new layer:
 * 1. Add an entry here with the layer config
 * 2. Make sure the Mapbox style has the layer
 * 3. That's it! The tooltip will render automatically.
 */
export const POLYGON_LAYER_REGISTRY: Record<string, PolygonLayerConfig> = {
  "Community deliveries": {
    layerType: "demand-units",
    mapboxLayerId: "demand-units",
    sourceLayer: "demand-units",
    idProperty: "DU_ID",
    classFilter: "Urban",
    tierCode: "CWS_DEL",
    tooltipFields: [
      // Primary name: Urb_Name for Urban class
      { 
        key: "urbName", 
        label: null, 
        source: "mapbox", 
        mapboxKey: "Urb_Name",
        isPrimary: true,
      },
      // Secondary name: Mod_Name shown when both exist
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
    layerType: "demand-units",
    mapboxLayerId: "demand-units",
    sourceLayer: "demand-units",
    idProperty: "DU_ID",
    classFilter: "Agriculture",
    tierCode: "AG_REV",
    tooltipFields: [
      // Primary name: Mod_Name for Agriculture
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
    layerType: "wba",
    mapboxLayerId: "calsim-wba",
    sourceLayer: "geoschem",
    idProperty: "WBA_ID",
    tierCode: "GW_STOR",
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
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get layer config by outcome name
 */
export function getLayerConfig(outcome: string): PolygonLayerConfig | null {
  return POLYGON_LAYER_REGISTRY[outcome] || null
}

/**
 * Check if an outcome uses polygon visualization
 */
export function outcomeUsesPolygons(outcome: string): boolean {
  return outcome in POLYGON_LAYER_REGISTRY
}

/**
 * Get all outcome names that use polygon visualization
 */
export function getPolygonOutcomes(): string[] {
  return Object.keys(POLYGON_LAYER_REGISTRY)
}

/**
 * Get Mapbox layer IDs for a layer type
 */
export function getLayerIds(layerType: LayerType): { fill: string; outline: string } {
  return layerType === "wba" 
    ? LAYER_IDS.wba 
    : LAYER_IDS.demandUnits
}
