// packages/map/index.ts

// Export the wrapper as the default MapProvider
export { MapProviderClientWrapper as MapProvider } from "./src/context/MapProviderClientWrapper"
export { useMap } from "./src/context/MapContext"

// Export Map component
export { default as Map } from "./src/Map"

// Export Marker and Popup directly from react-map-gl
export {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/mapbox"

// Marker components
export { ScaledMarker, MarkerWithPopup, MarkersLayer } from "./src/markers"

export type { MarkerProperties } from "./src/markers"

// Core map types and interfaces
export type {
  ViewState,
  ViewStateTransitionOptions,
  StyleValue,
  MapSourceData,
  MapSource,
  MapLayer,
  MapOperationsAPI,
  StateManagementMode,
  MapProps,
  // Export layer style types
  LineLayerStyle,
  FillLayerStyle,
  CircleLayerStyle,
  MapLayerStyle,
  LineCapType,
  LineJoinType,
} from "./src/types"

// Type from Mapbox GL
export type { MapRef as MapboxMapRef } from "react-map-gl/mapbox"

// Export types for mapbox-gl layers
export type { LayerProps } from "react-map-gl/mapbox"

// Create a proper type alias for Layer
import { Layer } from "react-map-gl/mapbox"
export type LayerType = typeof Layer

// Predefined transitions
export { MapTransitions } from "./src/types"
