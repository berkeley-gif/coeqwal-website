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

// Export types from react-map-gl and mapbox-gl
export type { LayerProps } from "react-map-gl/mapbox"
export type { MapRef } from "react-map-gl/mapbox"
export type { LngLatLike, FitBoundsOptions } from "mapbox-gl"

// Export core types from our types file
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
  // Layer style types
  LineLayerStyle,
  FillLayerStyle,
  CircleLayerStyle,
  MapLayerStyle,
  LineCapType,
  LineJoinType,
} from "./types"

// Import Layer first
import { Layer } from "react-map-gl/mapbox"

// Export MapboxLayer as typeof
export type MapboxLayer = typeof Layer

// Export transitions
export { MapTransitions } from "./types"

// Marker components
export { ScaledMarker, MarkerWithPopup, MarkersLayer } from "./markers"

// Export MapboxMapRef as an alias for MapRef
export type { MapRef as MapboxMapRef } from "react-map-gl/mapbox"

// Export styles for consistency
export { MAP_STYLES, MAP_THEME_URLS, MAP_TRANSITIONS } from "./styles"

// Export hooks for declarative layer management
export { useMapLayers, useMapSources } from "./hooks/useMapLayers"
