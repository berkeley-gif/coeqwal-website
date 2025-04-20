"use client"

// Main component
export { Map } from "./Map"

// Context
export { MapProvider, useMap } from "../context/MapContext"

// Marker components
export {
  Marker,
  Popup,
  ScaledMarker,
  MarkerWithPopup,
  MarkersLayer,
} from "../src/markers"

// Export MapTransitions
export { MapTransitions } from "./types"

// Types
export type {
  ViewState,
  MapboxMapRef,
  ViewStateTransitionOptions,
  MapLayerType,
  StyleValue,
  MapSourceData,
  MapSource,
  MapLayer,
  MapOperationsAPI,
  StateManagementMode,
  MapProps,
} from "./types"

// Marker types
export type { MarkerProperties } from "./markers"

// Re-export some ReactMapGL components for convenience
export {
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/mapbox"

// Export Layer type for typing
export type Layer = mapboxgl.Layer
