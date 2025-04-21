// packages/map/index.ts

// ✅ Export the wrapper as the default MapProvider
export { MapProviderClientWrapper as MapProvider } from "./src/context/MapProviderClientWrapper"
export { useMap } from "./src/context/MapContext"

// Export Map component
export { default as Map } from "./src/Map"

// 📍 Marker components
export {
  Marker,
  Popup,
  ScaledMarker,
  MarkerWithPopup,
  MarkersLayer,
} from "./src/markers"

export type { MarkerProperties } from "./src/markers"

// 📐 Core map types and interfaces
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
} from "./src/types"

export type { MapRef as MapboxMapRef } from "react-map-gl/mapbox"

// 🔁 Predefined transitions
export { MapTransitions } from "./src/types"

// 🧰 Re-export Mapbox GL components from ReactMapGL for convenience
export {
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/mapbox"
