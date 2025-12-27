/**
 * Visualization types - tier data, color maps, and layer config types
 */

import type { TierLevel } from "../../../content/tiers"
import type { CameraView } from "../config/cameraPresets"

// ============================================================================
// TIER DATA TYPES
// ============================================================================

/** Raw tier location data from API */
export interface TierLocation {
  location_id: string
  location_name: string
  location_type: string
  tier_level: number
  tier_value: number | null
  display_order: number
}

/** API response for tier locations */
export interface TierLocationsResponse {
  scenario: string
  tier_code: string
  tier_name: string
  tier_type: "single_value" | "multi_value"
  locations: TierLocation[]
  metadata: {
    total_locations: number
    location_types: string[]
    tier_counts: Record<string, number>
  }
}

// ============================================================================
// COLOR MAP TYPES
// ============================================================================

/** Map from feature ID to hex color string (ready for Mapbox expressions) */
export type TierColorMap = Record<string, string>

/** Map from feature ID to tier level (1-4) */
export type TierLevelMap = Record<string, TierLevel>

// ============================================================================
// TOOLTIP TYPES
// ============================================================================

/** Geometry types for map layers */
export type GeometryType = "polygon" | "point" | "line" | "react-marker"

/** Layer type identifiers */
export type LayerType =
  | "demand-units"
  | "wba"
  | "reservoir"
  | "delta"
  | "river"
  | "marker"

/** Feature info for tooltips - supports all layer types */
export interface HoveredFeatureInfo {
  longitude: number
  latitude: number
  geometryType: GeometryType
  layerType: LayerType
  featureId: string
  tierLevel: number
  tierLabel: string
  locationName: string | null
  tierValue: number | null
  properties: Record<string, unknown>
  // Demand-units specific fields
  urbName?: string | null
  modName?: string | null
  subName?: string | null
  comments?: string | null
  type?: string | null
  classType?: string | null
  // WBA specific fields
  hydroRegion?: string | null
  gisAcres?: number | null
}

// ============================================================================
// LAYER CONFIG TYPES
// ============================================================================

/** Source of tooltip data */
export type TooltipFieldSource = "mapbox" | "api" | "computed"

/** Format options for displaying values */
export type TooltipFieldFormat = "text" | "acres" | "acrefeet" | "number"

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
  geometryType: GeometryType
  layerType: LayerType
  mapboxLayerId: string
  mapboxSource?: string
  sourceLayer?: string
  idProperty?: string
  classFilter?: "Agriculture" | "Urban" | "Refuge" | "N/A"
  tierCode: string
  requiresIdMatching: boolean
  tooltipFields: TooltipFieldDef[]
  idLabel?: string
  circleRadius?: number
  circleStrokeWidth?: number
  cameraPreset?: CameraView
}

