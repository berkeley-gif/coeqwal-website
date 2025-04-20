// Types for the map module
import { RefObject } from "react"
import type {
  MapboxMapRef as MapPackageMapboxMapRef,
  ViewState as MapPackageViewState,
} from "../../../map/src/types"

// Re-export the types from map package
export type ViewState = MapPackageViewState
export type MapboxMapRef = MapPackageMapboxMapRef

// Map state interface
export interface MapState {
  mapRef: RefObject<MapboxMapRef> | null
  viewState: ViewState
}
