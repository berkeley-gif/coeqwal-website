// Import proper types from mapbox-gl
import type { Map as MapboxMap } from "mapbox-gl"
// Import types from ReactMapGL possibly in the future
// import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox'

// Core view state type with backward compatibility
export interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
  // Additional properties for backward compatibility
  // TODO: remove duplicates
  transitionDuration?: number
  transitionEasing?: (t: number) => number
  bounds?: [[number, number], [number, number]] // [southwest, northeast] corners
  animationOptions?: {
    duration?: number
    easing?: (t: number) => number
  }
}

// Modern replacement for deprecated Expression
export type StyleValue =
  | string
  | number
  | boolean
  | Array<unknown>
  | Record<string, unknown>

/**
 * Our own interface for the map ref
 * Provides access to the underlying map instance and utility methods
 */
export interface MapboxMapRef {
  getMap(): MapboxMap | null

  // Get current view state
  getViewState(): ViewState

  // Fit map to geographic bounds
  fitBounds(
    bounds: [[number, number], [number, number]],
    options?: { padding?: number; maxZoom?: number },
  ): void

  // Jump to location without animation
  jumpTo(viewState: Partial<ViewState>): void

  // Check if map has finished loading
  isLoaded(): boolean

  // Check if a specific source has loaded
  isSourceLoaded(sourceId: string): boolean

  // Check if a specific layer exists
  hasLayer(layerId: string): boolean

  // We could add more helper methods here in the future
}

/**
 * State management mode for the map
 * - 'uncontrolled': Map manages its own state internally (default)
 * - 'react': Component using the map manages state via props
 * - 'zustand': Global Zustand store manages state
 */
export type StateManagementMode = "uncontrolled" | "react" | "zustand"

// MapProps for our base Map component
export interface MapProps {
  /** Mapbox access token */
  mapboxAccessToken?: string

  /** Map style URL */
  mapStyle?: string

  /** Initial view state */
  initialViewState?: ViewState

  /** Map container width */
  width?: string | number

  /** Map container height */
  height?: string | number

  /** Map container style */
  style?: React.CSSProperties

  /**
   * Map children - such as:
   * - Markers
   * - Popups
   * - NavigationControl
   * - GeolocateControl
   * - Sources and Layers
   */
  children?: React.ReactNode

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

// Type for generic map source
export type MapSourceData =
  | GeoJSON.FeatureCollection
  | GeoJSON.Feature
  | string // URL to GeoJSON file
  | Record<string, unknown> // Tile source options or other source config

// Map source definition
export interface MapSource {
  id: string
  type: string
  data?: MapSourceData
  [key: string]: unknown
}

// Map layer types supported by Mapbox
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

// Map layer definition
export interface MapLayer {
  id: string
  source: string
  type: MapLayerType
  paint?: Record<string, StyleValue>
  layout?: Record<string, StyleValue>
  [key: string]: unknown
}

// Map Operations API
export interface MapOperationsAPI {
  // The map ref for direct access
  mapRef: React.RefObject<MapboxMapRef>

  /**
   * Safely execute a callback with the map instance
   *
   * This handles null checking and provides a cleaner way to work
   * with the map directly when needed.
   *
   * @example
   * withMap(map => {
   *   map.setPaintProperty('layer-id', 'fill-color', '#ff0000');
   * });
   */
  withMap: (callback: (map: MapboxMap) => void) => void

  // Navigation
  flyTo: (
    longitude: number,
    latitude: number,
    zoom: number,
    options?: {
      pitch?: number
      bearing?: number
      duration?: number
    },
  ) => void

  // Layers and sources
  addSource: (id: string, source: Omit<MapSource, "id">) => void
  removeSource: (id: string) => void
  addLayer: (
    id: string,
    source: string,
    type: MapLayerType,
    paint?: Record<string, StyleValue>,
    layout?: Record<string, StyleValue>,
  ) => void
  removeLayer: (id: string) => void

  // Styling
  setLayerVisibility: (id: string, visible: boolean) => void
  setLayerProperty: (id: string, property: string, value: StyleValue) => void
}
