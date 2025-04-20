"use client"

export { Map } from "./src/Map"
export { useMap, MapProvider } from "./context/MapContext"
export {
  Marker,
  Popup,
  ScaledMarker,
  MarkerWithPopup,
  MarkersLayer,
} from "./src/markers"

// Export all types as well
export type {
  MapboxMapRef,
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
} from "./src/types"

// Export map transitions
export { MapTransitions } from "./src/types"

// Export marker types
export type { MarkerProperties } from "./src/markers"

// Export Layer for typing
export type Layer = mapboxgl.Layer
