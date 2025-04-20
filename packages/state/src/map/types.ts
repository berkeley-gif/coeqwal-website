// Types for the map module
import { RefObject } from "react"

export interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
}

// Define a proper interface for MapboxMapRef
export interface MapboxMapRef {
  getMap: () => unknown
  flyTo: (
    longitude: number,
    latitude: number,
    zoom: number,
    pitch?: number,
    bearing?: number,
    duration?: number,
  ) => void
  [key: string]: unknown
}

// Map state interface
export interface MapState {
  mapRef: RefObject<MapboxMapRef> | null
  viewState: ViewState
}
