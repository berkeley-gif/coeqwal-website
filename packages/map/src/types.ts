import type { Map as MapboxMap } from "mapbox-gl"
// Import types from ReactMapGL possibly in the future
// import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox'
import type { ReactNode, RefObject, CSSProperties } from "react"

// Import MarkerProperties type
import { MarkerProperties } from "./markers"

/**
 * Reference to Mapbox GL map instance wrapper
 */
export interface MapboxMapRef {
  getMap: () => MapboxMap
}

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
  // Optional bounds parameter - alternative to center coordinates
  bounds?: [[number, number], [number, number]] // [southwest, northeast] corners bc viewports differ
  // Optional transition parameters
  transitionOptions?: ViewStateTransitionOptions
}

/**
 * Supported layer types from Mapbox GL
 */
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

/**
 * Style values for Mapbox GL layers
 */
export type StyleValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | Record<string, unknown>

/**
 * Type for generic map source data
 */
export type MapSourceData =
  | GeoJSON.FeatureCollection
  | GeoJSON.Feature
  | string // URL to GeoJSON file
  | Record<string, unknown> // Tile source options or other source config

/**
 * Source definition for the map
 */
export interface MapSource {
  id: string
  type: "vector" | "raster" | "raster-dem" | "geojson" | "image" | "video"
  data?: MapSourceData
  [key: string]: unknown
}

/**
 * Map layer definition
 */
export interface MapLayer {
  id: string
  source: string
  type: MapLayerType
  paint?: Record<string, StyleValue>
  layout?: Record<string, StyleValue>
  [key: string]: unknown
}

/**
 * Core operations API for the map context
 */
export interface MapOperationsAPI {
  /**
   * Reference to the map instance
   */
  mapRef: RefObject<MapboxMapRef | null>

  /**
   * Execute a callback with the map instance if available
   */
  withMap: (callback: (map: MapboxMap) => void) => void

  /**
   * Fly to a location on the map with smooth animation
   * @overload
   */
  flyTo: {
    /**
     * Fly to a location using individual coordinates and options
     * @param longitude The longitude to fly to
     * @param latitude The latitude to fly to
     * @param zoom The zoom level to fly to
     * @param pitch Optional camera pitch in degrees
     * @param bearing Optional camera bearing in degrees
     * @param transitionOptions Optional animation settings
     */
    (
      longitude: number,
      latitude: number,
      zoom: number,
      pitch?: number,
      bearing?: number,
      transitionOptions?: ViewStateTransitionOptions,
    ): void

    /**
     * Fly to a location using a ViewState object
     * @param viewState The view state to fly to (must include longitude, latitude, zoom)
     */
    (viewState: Omit<ViewState, "bounds">): void
  }

  /**
   * Fit the map view to a bounding box with smooth animation
   * @overload
   */
  fitBounds: {
    /**
     * Fit bounds using a bounds array and options
     * @param bounds The bounds to fit the map view to [[sw_lng, sw_lat], [ne_lng, ne_lat]]
     * @param pitch Optional camera pitch in degrees
     * @param bearing Optional camera bearing in degrees
     * @param padding Optional padding to apply around the bounds (in pixels)
     * @param transitionOptions Optional animation settings
     */
    (
      bounds: [[number, number], [number, number]],
      pitch?: number,
      bearing?: number,
      padding?:
        | number
        | { top: number; bottom: number; left: number; right: number },
      transitionOptions?: ViewStateTransitionOptions,
    ): void

    /**
     * Fit bounds using a ViewState object with bounds
     * @param viewState The view state (must include bounds)
     */
    (
      viewState: Pick<
        ViewState,
        "bounds" | "pitch" | "bearing" | "transitionOptions"
      >,
    ): void
  }

  /**
   * Add a source to the map
   */
  addSource: (id: string, source: Omit<MapSource, "id">) => void

  /**
   * Remove a source from the map
   */
  removeSource: (id: string) => void

  /**
   * Add a layer to the map
   */
  addLayer: (
    id: string,
    source: string,
    type: MapLayerType,
    paint?: Record<string, StyleValue>,
    layout?: Record<string, StyleValue>,
  ) => void

  /**
   * Remove a layer from the map
   */
  removeLayer: (id: string) => void

  /**
   * Set the visibility of a layer
   */
  setLayerVisibility: (id: string, visible: boolean) => void

  /**
   * Set a property for a layer (can set both paint and layout properties here, or separately below)
   */
  setLayerProperty: (id: string, property: string, value: StyleValue) => void

  /**
   * Set a paint property for a layer
   */
  setPaintProperty: (id: string, property: string, value: StyleValue) => void

  /**
   * Set a layout property for a layer
   */
  setLayoutProperty: (id: string, property: string, value: StyleValue) => void

  /**
   * Set markers on the map
   * @param markers Array of marker properties to display on the map
   */
  setMarkers?: (markers: MarkerProperties[]) => void

  /**
   * Set React motion children to be rendered with AnimatePresence
   * @param children React nodes to render with motion/animation
   */
  setMotionChildren?: (children: ReactNode) => void
}

/**
 * State management mode for the map
 * - 'uncontrolled': Map manages its own state internally (default)
 * - 'react': Component using the map manages state via props
 * - 'zustand': Global Zustand store manages state
 */
export type StateManagementMode = "uncontrolled" | "react" | "zustand"

/**
 * MapProps for our base Map component
 */
export interface MapProps {
  /** Mapbox access token (required) */
  mapboxToken: string

  /** Map style URL */
  mapStyle?: string

  /** Initial view state */
  initialViewState?: ViewState

  /** Map container width */
  width?: string | number

  /** Map container height */
  height?: string | number

  /** Map container style */
  style?: CSSProperties

  /**
   * Map children - such as:
   * - Markers
   * - Popups
   * - NavigationControl
   * - GeolocateControl
   * - Sources and Layers
   */
  children?: ReactNode

  /** Called when map is loaded */
  onLoad?: () => void

  /** Called when map is moved */
  onMoveEnd?: (evt: { viewState: ViewState }) => void

  /** Called when map is resized */
  onResize?: () => void

  /**
   * Other props passed to ReactMapGL - such as:
   * - reuseMaps
   * - attributionControl
   * - interactiveLayerIds
   * - terrain
   */
  [key: string]: unknown
}

/**
 * Predefined map view transitions
 */
export const MapTransitions = {
  /**
   * Smooth transition with medium duration
   */
  SMOOTH: {
    duration: 2000,
    easing: (t: number) => t * (2 - t), // Ease out quad
    essential: true,
  },

  /**
   * Quick transition with shorter duration
   */
  QUICK: {
    duration: 1000,
    easing: (t: number) => t * (2 - t),
    essential: true,
  },

  /**
   * Gradual transition with longer duration
   */
  GRADUAL: {
    duration: 3500,
    easing: (t: number) => t * (2 - t),
    essential: true,
  },

  /**
   * Linear transition without easing
   */
  LINEAR: {
    duration: 2000,
    easing: (t: number) => t,
    essential: true,
  },

  /**
   * Dramatic transition that zooms out slightly then in
   */
  DRAMATIC: {
    duration: 3500,
    easing: (t: number) => {
      // Custom curve that zooms out slightly then in
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    },
    essential: true,
  },

  /**
   * Aerial view transition with high pitch
   */
  AERIAL: {
    duration: 2800,
    easing: (t: number) => 1 - Math.pow(1 - t, 3), // Ease out cubic
    essential: true,
    pitch: 60, // High pitch for 3D perspective
  },

  /**
   * Cinematic transition with rotation and tilt
   */
  CINEMATIC: {
    duration: 4000,
    easing: (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, // Ease in-out quad
    essential: true,
    bearing: 30, // Slight rotation
    pitch: 45, // Tilt
  },
} as const
