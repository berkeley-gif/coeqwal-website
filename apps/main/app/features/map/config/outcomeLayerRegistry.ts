/**
 * Outcome layer registry - single source of truth for all outcome visualizations
 */

import {
  type CameraView,
  DELTA_VIEW,
  SACRAMENTO_RIVER_VIEW,
  RESERVOIR_VIEW,
  PUMPING_PLANTS_VIEW,
  JERSEY_POINT_VIEW,
} from "./cameraPresets"

// ============================================================================
// TYPES (internal)
// ============================================================================

/** Geometry type for the layer */
type GeometryType = "polygon" | "point" | "line" | "react-marker"

/** Layer type identifier */
type LayerType =
  | "demand-units"
  | "wba"
  | "reservoir"
  | "delta"
  | "river"
  | "marker"

/** Source of tooltip data */
type TooltipFieldSource =
  | "mapbox" // From Mapbox feature properties
  | "api" // From COEQWAL API response
  | "computed" // Computed from other fields

/** Format options for displaying values */
type TooltipFieldFormat =
  | "text" // Plain text (default)
  | "acres" // Number with " acres" suffix and toLocaleString()
  | "acrefeet" // Number with " acre-feet" suffix
  | "number" // toLocaleString() formatting

/** Typography variant for the field */
type TooltipFieldVariant = "body2" | "caption"

/** Definition for a single tooltip field */
interface TooltipFieldDef {
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
  /** Camera preset for this outcome (zoom/center for Learn mode) */
  cameraPreset?: CameraView
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
  // Utility layers
  basemapDim: "basemap-dim-overlay",
} as const

// River layer IDs are defined and exported from RiversLayer.tsx
// (since that component creates the layers with those IDs)
export { RIVER_LAYER_IDS } from "../baseLayers/RiversLayer"

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
 * Registry of all outcome layers, keyed by outcome code (e.g., "CWS_DEL")
 */
export const OUTCOME_LAYER_REGISTRY: Record<string, OutcomeLayerConfig> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // POLYGON LAYERS (Mapbox vector tiles with ID matching)
  // ═══════════════════════════════════════════════════════════════════════════

  CWS_DEL: {
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

  AG_REV: {
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

  GW_STOR: {
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

  RES_STOR: {
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
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SINGLE-FEATURE POLYGON LAYERS (no ID matching needed)
  // ═══════════════════════════════════════════════════════════════════════════

  DELTA_ECO: {
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
    cameraPreset: DELTA_VIEW,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LINE LAYERS (React-rendered, highlighting existing rivers)
  // ═══════════════════════════════════════════════════════════════════════════

  WRC_SALMON_AB: {
    geometryType: "line",
    layerType: "river",
    mapboxLayerId: "sacramento-river-body", // Primary layer for interactions
    tierCode: "WRC_SALMON_AB",
    requiresIdMatching: false, // Single river, no ID matching
    tooltipFields: [
      { key: "name", label: null, source: "computed", isPrimary: true },
    ],
    idLabel: "River",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REACT MARKER LAYERS (API-fetched points rendered as React components)
  // ═══════════════════════════════════════════════════════════════════════════

  ENV_FLOWS: {
    geometryType: "react-marker",
    layerType: "marker",
    mapboxLayerId: "", // No Mapbox layer - React rendered
    tierCode: "ENV_FLOWS",
    requiresIdMatching: true, // 17 per-station tier levels — must use multi-value /locations path
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

  FW_DELTA_USES: {
    geometryType: "react-marker",
    layerType: "marker",
    mapboxLayerId: "", // No Mapbox layer - React rendered
    tierCode: "FW_DELTA_USES",
    requiresIdMatching: true, // 2 per-station tier levels (EM, JP) — use /locations path
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
    cameraPreset: JERSEY_POINT_VIEW,
  },

  FW_EXP: {
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
    cameraPreset: PUMPING_PLANTS_VIEW,
  },
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get layer config by outcome code (e.g., "CWS_DEL")
 */
export function getOutcomeConfig(
  outcomeCode: string,
): OutcomeLayerConfig | null {
  return OUTCOME_LAYER_REGISTRY[outcomeCode] || null
}

/**
 * Check if an outcome uses Mapbox layers (vs React markers)
 */
export function outcomeUsesMapboxLayers(outcomeCode: string): boolean {
  const config = OUTCOME_LAYER_REGISTRY[outcomeCode]
  return config?.geometryType !== "react-marker"
}

/**
 * Check if an outcome uses polygon visualization
 */
export function outcomeUsesPolygons(outcomeCode: string): boolean {
  const config = OUTCOME_LAYER_REGISTRY[outcomeCode]
  return config?.geometryType === "polygon"
}
