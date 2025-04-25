// Types for the map module
import { RefObject } from "react"
import type {
  ViewState as MapPackageViewState,
  MapboxMapRef as MapPackageMapboxMapRef,
} from "@repo/map"

// Re-export the types from map package
export type ViewState = MapPackageViewState
export type MapboxMapRef = MapPackageMapboxMapRef

// Map state interface
export interface MapState {
  mapRef: RefObject<MapboxMapRef | null> | null
  viewState: ViewState
}
