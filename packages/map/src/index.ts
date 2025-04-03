// Primary Map API (context-based with full map access)
export { Map } from "./MapboxMapWithContext"
export { MapProvider, useMap } from "../context/MapContext"
export { Marker, Popup } from "./MapboxMap"

// Types
export type { ViewState } from "./types"
export type { MapProps, MarkerProperties } from "./MapboxMap"

// Legacy ref-based API (for advanced cases)
export { MapboxMap } from "./MapboxMap"
export type { MapboxMapRef } from "./MapboxMap"
