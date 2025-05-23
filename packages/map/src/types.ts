import type { MapRef } from "react-map-gl/mapbox"
import type { ReactNode, RefObject, CSSProperties } from "react"
import type {
  GeoJSONSourceSpecification,
  VectorSourceSpecification,
  RasterSourceSpecification,
  RasterDEMSourceSpecification,
  ImageSourceSpecification,
  VideoSourceSpecification,
  PropertyValueSpecification,
  StyleSpecification,
} from "mapbox-gl"

/** Marker properties used across the map package */
export interface MarkerProperties {
  longitude: number
  latitude: number
  id?: string | number
  color?: string
  size?: number
  title?: string
  description?: string
  content?: ReactNode
  properties?: Record<string, unknown>
}

/** Optional transition options when moving the map view */
export interface ViewStateTransitionOptions {
  duration?: number
  easing?: (t: number) => number
  essential?: boolean
}

/** The map's current or target view state */
export interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
  bounds?: [[number, number], [number, number]]
  transitionOptions?: ViewStateTransitionOptions
}

/** All supported Mapbox layer types */
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

/** Style values for paint and layout properties */
export type StyleValue = PropertyValueSpecification<string | number | boolean>

/** Data that can be passed as a GeoJSON source */
export type MapSourceData =
  | GeoJSON.FeatureCollection
  | GeoJSON.Feature
  | string
  | Record<string, unknown>

/** All supported source specification types */
export type SourceSpecification =
  | GeoJSONSourceSpecification
  | VectorSourceSpecification
  | RasterSourceSpecification
  | RasterDEMSourceSpecification
  | ImageSourceSpecification
  | VideoSourceSpecification

/** Wrapper for a source definition */
export interface MapSource {
  id: string
  type: "vector" | "raster" | "raster-dem" | "geojson" | "image" | "video"
  data?: MapSourceData
  [key: string]: unknown
}

/** Wrapper for a layer definition */
export interface MapLayer {
  id: string
  source: string
  type: MapLayerType
  paint?: Record<string, StyleValue>
  layout?: Record<string, StyleValue>
  [key: string]: unknown
}

/**
 * Helper types for easier layer creation without type assertions
 */

// Line layer style helpers
export type LineCapType = "butt" | "round" | "square"
export type LineJoinType = "bevel" | "round" | "miter"

export interface LineLayerStyle {
  type: "line"
  layout?: Partial<{
    "line-cap": PropertyValueSpecification<LineCapType>
    "line-join": PropertyValueSpecification<LineJoinType>
    "line-miter-limit": PropertyValueSpecification<number>
    "line-round-limit": PropertyValueSpecification<number>
    visibility: PropertyValueSpecification<"visible" | "none">
  }> &
    Record<string, PropertyValueSpecification<string | number | boolean>>
  paint?: Partial<{
    "line-color": PropertyValueSpecification<string>
    "line-opacity": PropertyValueSpecification<number>
    "line-width": PropertyValueSpecification<number>
    "line-gap-width": PropertyValueSpecification<number>
    "line-dasharray": PropertyValueSpecification<number[]>
  }> &
    Record<string, PropertyValueSpecification<string | number | boolean>>
}

// Fill layer style helpers
export interface FillLayerStyle {
  type: "fill"
  layout?: Partial<{
    visibility: PropertyValueSpecification<"visible" | "none">
  }> &
    Record<string, PropertyValueSpecification<string | number | boolean>>
  paint?: Partial<{
    "fill-color": PropertyValueSpecification<string>
    "fill-opacity": PropertyValueSpecification<number>
    "fill-outline-color": PropertyValueSpecification<string>
  }> &
    Record<string, PropertyValueSpecification<string | number | boolean>>
}

// Circle layer style helpers
export interface CircleLayerStyle {
  type: "circle"
  layout?: Partial<{
    visibility: PropertyValueSpecification<"visible" | "none">
  }> &
    Record<string, PropertyValueSpecification<string | number | boolean>>
  paint?: Partial<{
    "circle-color": PropertyValueSpecification<string>
    "circle-opacity": PropertyValueSpecification<number>
    "circle-radius": PropertyValueSpecification<number>
    "circle-stroke-width": PropertyValueSpecification<number>
    "circle-stroke-color": PropertyValueSpecification<string>
  }> &
    Record<string, PropertyValueSpecification<string | number | boolean>>
}

// Union of all layer styles for easy usage
export type MapLayerStyle =
  | LineLayerStyle
  | FillLayerStyle
  | CircleLayerStyle
  | ({ type: MapLayerType } & Record<
      string,
      PropertyValueSpecification<string | number | boolean>
    >)

/** Individual overlay entry rendered in the overlay portal */
export interface OverlayEntry {
  element: ReactNode
  style?: CSSProperties
}

/** The public context API for interacting with the map */
export interface MapOperationsAPI {
  mapRef: RefObject<MapRef | null>
  withMap: (callback: (map: MapRef) => void) => void
  markers?: MarkerProperties[]

  // Map style helpers
  getStyle: () =>
    | StyleSpecification
    | { sources: Record<string, never>; layers: never[] }
  hasSource: (id: string) => boolean
  hasLayer: (id: string) => boolean

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
    type: MapLayerType | string,
    paint?: Record<string, StyleValue>,
    layout?: Record<string, StyleValue>,
    others?: Record<string, StyleValue>,
  ) => void
  removeLayer: (id: string) => void
  setLayerVisibility: (id: string, visible: boolean) => void
  setLayerProperty: (id: string, property: string, value: StyleValue) => void
  setPaintProperty: (id: string, property: string, value: StyleValue) => void
  setLayoutProperty: (id: string, property: string, value: StyleValue) => void
  setFilter: (id: string, filter: string) => void // TODO: not really string type for filter

  // Optional overlay portal system
  overlays?: RefObject<Record<string, OverlayEntry>>
  setOverlay?: (
    key: string,
    element: ReactNode | null,
    style?: CSSProperties,
  ) => void

  // Motion children system for dynamic markers and overlays
  setMotionChildren?: (element: ReactNode | null, style?: CSSProperties) => void
  motionChildren?: ReactNode | null
  motionChildrenStyle?: CSSProperties

  // Named motion children system (preferred over legacy setMotionChildren)
  setNamedMotionChild?: (
    key: string,
    element: ReactNode | null,
    style?: CSSProperties,
  ) => void
  namedMotionChildren?: Record<
    string,
    { element: ReactNode; style?: CSSProperties; isVisible: boolean }
  >
  getAllVisibleMotionChildren?: () => ReactNode[]

  // Optional legacy marker support
  setMarkers?: (markers: MarkerProperties[]) => void
}

/** State management mode if we later support React/zustand control */
export type StateManagementMode = "uncontrolled" | "react" | "zustand"

/** Props accepted by the Map component */
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

/** Named presets for animated transitions */
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
