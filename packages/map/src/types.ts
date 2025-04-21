import type { MapRef } from "react-map-gl/mapbox"
import type { ReactNode, RefObject, CSSProperties } from "react"
import type {
  GeoJSONSourceSpecification,
  VectorSourceSpecification,
  RasterSourceSpecification,
  RasterDEMSourceSpecification,
  ImageSourceSpecification,
  VideoSourceSpecification,
} from "mapbox-gl"
import { MarkerProperties } from "./markers"

/**
 * Animation options for view state transitions (just below)
 */
export interface ViewStateTransitionOptions {
  duration?: number
  easing?: (t: number) => number
  essential?: boolean
}

/**
 * View state for the map
 */
export interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
  bounds?: [[number, number], [number, number]]
  transitionOptions?: ViewStateTransitionOptions
}

export type MapLayerType =
  | "fill"
  | "line"
  | "circle"
  | "symbol"
  | "heatmap"
  | "fill-extrusion"
  | "raster"
  | "hillshade"
  | "background"
  | "sky"

export type StyleValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | Record<string, unknown>

export type MapSourceData =
  | GeoJSON.FeatureCollection
  | GeoJSON.Feature
  | string
  | Record<string, unknown>

export type SourceSpecification =
  | GeoJSONSourceSpecification
  | VectorSourceSpecification
  | RasterSourceSpecification
  | RasterDEMSourceSpecification
  | ImageSourceSpecification
  | VideoSourceSpecification

export interface MapSource {
  id: string
  type: "vector" | "raster" | "raster-dem" | "geojson" | "image" | "video"
  data?: MapSourceData
  [key: string]: unknown
}

export interface MapLayer {
  id: string
  source: string
  type: MapLayerType
  paint?: Record<string, StyleValue>
  layout?: Record<string, StyleValue>
  [key: string]: unknown
}

export interface MapOperationsAPI {
  mapRef: RefObject<MapRef | null>
  withMap: (callback: (map: MapRef) => void) => void
  flyTo: {
    (
      longitude: number,
      latitude: number,
      zoom: number,
      pitch?: number,
      bearing?: number,
      transitionOptions?: ViewStateTransitionOptions,
    ): void
    (viewState: Omit<ViewState, "bounds">): void
  }
  fitBounds: {
    (
      bounds: [[number, number], [number, number]],
      pitch?: number,
      bearing?: number,
      padding?:
        | number
        | { top: number; bottom: number; left: number; right: number },
      transitionOptions?: ViewStateTransitionOptions,
    ): void
    (
      viewState: Pick<
        ViewState,
        "bounds" | "pitch" | "bearing" | "transitionOptions"
      >,
    ): void
  }
  addSource: (id: string, source: SourceSpecification) => void
  removeSource: (id: string) => void
  addLayer: (
    id: string,
    source: string,
    type: MapLayerType,
    paint?: Record<string, StyleValue>,
    layout?: Record<string, StyleValue>,
  ) => void
  removeLayer: (id: string) => void
  setLayerVisibility: (id: string, visible: boolean) => void
  setLayerProperty: (id: string, property: string, value: StyleValue) => void
  setPaintProperty: (id: string, property: string, value: StyleValue) => void
  setLayoutProperty: (id: string, property: string, value: StyleValue) => void
  setMarkers?: (markers: MarkerProperties[]) => void
  setMotionChildren?: (children: ReactNode) => void
}

export type StateManagementMode = "uncontrolled" | "react" | "zustand"

export interface MapProps {
  mapboxToken: string
  mapStyle?: string
  initialViewState?: ViewState
  width?: string | number
  height?: string | number
  style?: CSSProperties
  children?: ReactNode
  onLoad?: () => void
  onMoveEnd?: (evt: { viewState: ViewState }) => void
  onResize?: () => void
  [key: string]: unknown
}

export const MapTransitions = {
  SMOOTH: {
    duration: 2000,
    easing: (t: number) => t * (2 - t),
    essential: true,
  },
  QUICK: {
    duration: 1000,
    easing: (t: number) => t * (2 - t),
    essential: true,
  },
  GRADUAL: {
    duration: 3500,
    easing: (t: number) => t * (2 - t),
    essential: true,
  },
  LINEAR: {
    duration: 2000,
    easing: (t: number) => t,
    essential: true,
  },
  DRAMATIC: {
    duration: 3500,
    easing: (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    essential: true,
  },
  AERIAL: {
    duration: 2800,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
    essential: true,
    pitch: 60,
  },
  CINEMATIC: {
    duration: 4000,
    easing: (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    essential: true,
    bearing: 30,
    pitch: 45,
  },
} as const
