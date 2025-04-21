// packages/map/index.ts

// ✅ Default export: main Map component
export { default } from "./src/Map"

// ✅ Named export for Map component (if needed by others)
export { default as Map } from "./src/Map"

// 🧠 Map context and hooks
export { MapProvider, useMap } from "./context/MapContext"

// 📍 Marker components
export {
  Marker,
  Popup,
  ScaledMarker,
  MarkerWithPopup,
  MarkersLayer,
} from "./src/markers"

// 🧠 Marker types
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

// ✅ ⬅️ Add this line to fix the import error
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
