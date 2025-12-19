/**
 * Map hooks index
 * 
 * Re-exports all hooks for clean imports.
 */

// ============================================================================
// PRIMARY HOOKS (use these in components)
// ============================================================================

// Main hook for outcome map visualization (backward compatible)
export {
  useOutcomeMapLayer,
  outcomeUsesPolygons,
  fetchTierLocations,
  type HoveredFeatureInfo,
  type TierLocationsResponse,
  type TierLocation,
} from "./useOutcomeMapLayer"

// ============================================================================
// SUB-HOOKS (for advanced use cases)
// ============================================================================

export { useTierDataFetch, type TierDataResult } from "./useTierDataFetch"
export { useMapboxLayerStyling } from "./useMapboxLayerStyling"
export { useLayerTooltip } from "./useLayerTooltip"

// ============================================================================
// OTHER HOOKS
// ============================================================================

export { useMapLayers } from "./useMapLayers"
