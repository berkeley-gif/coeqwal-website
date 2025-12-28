/**
 * visualizationLayers - barrel exports for outcome visualization layers
 */

// Main component
export { default } from "./VisualizationLayers"
export { default as VisualizationLayers } from "./VisualizationLayers"

// Types
export type {
  TierColorMap,
  TierLevelMap,
  TierLocation,
  TierLocationsResponse,
  HoveredFeatureInfo,
  GeometryType,
  LayerType,
  OutcomeLayerConfig,
} from "./types"

// Hooks
export { useOutcomeVisualization } from "./hooks/useOutcomeVisualization"
export { useTierData, fetchTierLocations } from "./hooks/useTierData"
export {
  usePolygonTooltip,
  type UsePolygonTooltipResult,
} from "./hooks/usePolygonTooltip"
export {
  useTooltipState,
  type UseTooltipStateResult,
} from "./hooks/useTooltipState"
export {
  useMapTooltips,
  type UseMapTooltipsResult,
} from "./hooks/useMapTooltips"
export { useSalmonRiverColor } from "./hooks/useSalmonRiverColor"

// Components
export { OutcomePolygonLayer } from "./components/OutcomePolygonLayer"
export { PoiMarker } from "./components/PoiMarker"
