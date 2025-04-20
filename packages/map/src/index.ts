// Main component
export { Map } from "./Map"

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
  ViewStateTransitionOptions,
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
