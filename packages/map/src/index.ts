// packages/map/src/index.ts
export { MapProviderClientWrapper as MapProvider } from "./context/MapProviderClientWrapper"
export { useMap } from "./context/MapContext"
export { default as Map } from "./Map"

// Export Marker and Popup directly from react-map-gl
export {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/mapbox"

// Export types for mapbox-gl layers
export type { LayerProps } from "react-map-gl/mapbox"

export type {
  ViewState,
  ViewStateTransitionOptions,
  MapLayerType,
  StyleValue,
  MapSourceData,
  MapSource,
  MapLayer,
  MapOperationsAPI,
  StateManagementMode,
  MapProps,
  MarkerProperties,
  // Export layer style types
  LineLayerStyle,
  FillLayerStyle,
  CircleLayerStyle,
  MapLayerStyle,
  LineCapType,
  LineJoinType,
} from "./types"

export type { MapRef as MapboxMapRef } from "react-map-gl/mapbox"
export { MapTransitions } from "./types"
