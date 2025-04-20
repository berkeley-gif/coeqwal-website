// Main component
export { Map } from "./Map"

// Hooks
export { useLocalMapState } from "./hooks/useLocalMapState"

// Context
export { MapProvider, useMap } from "../context/MapContext"

// Types
export type {
  ViewState,
  MapboxMapRef,
  MapProps,
  MapSource,
  MapLayer,
  MapOperationsAPI,
} from "./types"

// Re-export some ReactMapGL components for convenience
export {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/mapbox"

// Export types
export * from "./types"

// Export context and hooks
export * from "../context/MapContext"
