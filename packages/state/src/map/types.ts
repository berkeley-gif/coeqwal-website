// Types for the map module
import { RefObject } from "react"

export interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
}

// Use Record<string, any> for now
export type MapboxMapRef = Record<string, any>

// Map state interface
export interface MapState {
  mapRef: RefObject<MapboxMapRef> | null
  viewState: ViewState
}
