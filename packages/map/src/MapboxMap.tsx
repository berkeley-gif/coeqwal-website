"use client" // necessary for mapbox-gl

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
} from "react"
import Map, { NavigationControl } from "react-map-gl/mapbox"
import type { MapRef } from "react-map-gl/mapbox"
import type { ViewStateChangeEvent } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { ViewState } from "./types.js"

/**
 * MapboxMapRef: Interface for interacting with the Mapbox map instance
 *
 * This interface provides three primary methods for safely working with the map:
 *
 * 1. withMap: A functional approach to reference the map that automatically handles null checking.
 *    This is the recommended pattern for most map operations.
 *
 *    Example:
 *    ```
 *    // Get source data with a fallback if map or source doesn't exist
 *    const data = mapRef.current?.withMap(
 *      map => map.getSource('mySource')?.getData(),
 *      defaultData
 *    )
 *
 *    // Perform an operation with no return value
 *    mapRef.current?.withMap(map => {
 *      map.setPaintProperty('myLayer', 'fill-color', 'red');
 *    })
 *    ```
 *
 * 2. getMap: Direct access to the underlying Mapbox GL map instance.
 *    Use this when you need to store the map reference or check its existence.
 *
 *    Example:
 *    ```
 *    const map = mapRef.current?.getMap();
 *    if (map && map.isStyleLoaded()) {
 *      // Do something that requires style to be loaded
 *    }
 *    ```
 *
 * 3. flyTo: Convenience method for camera animations.
 *    Handles null checking internally, so it's safe to call directly.
 *
 *    Example:
 *    ```
 *    // Fly to San Francisco
 *    mapRef.current?.flyTo(-122.4194, 37.7749, 12)
 *    ```
 */
export interface MapboxMapRef {
  /**
   * Safely executes a callback function with the map instance if available.
   * If the map is not available, returns the provided fallback value instead.
   *
   * @param callback - Function to execute with the map instance
   * @param fallback - Optional value to return if map is unavailable
   * @returns The result of the callback, or the fallback value
   */
  withMap: <T>(callback: (map: MapRef) => T, fallback?: T) => T

  /**
   * Gets the underlying Mapbox GL map instance.
   * May return undefined if the map is not yet initialized.
   *
   * @returns The Mapbox map instance or undefined
   */
  getMap: () => MapRef | undefined

  /**
   * Animates the map to fly to a specified location.
   * Safe to call directly - handles null checking internally.
   *
   * @param longitude - Destination longitude
   * @param latitude - Destination latitude
   * @param zoom - Optional zoom level (defaults to 5)
   */
  flyTo: (
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
    bearing?: number,
  ) => void
}

// Props
export interface MapProps {
  mapboxToken: string
  viewState: ViewState
  onViewStateChange?: (newViewState: ViewState) => void
  style?: React.CSSProperties
  mapStyle?: string
  minZoom?: number
  attributionControl?: boolean
  scrollZoom?: boolean
  onLoad?: () => void
}

const MapboxMapBase: ForwardRefRenderFunction<MapboxMapRef, MapProps> = (
  {
    mapboxToken,
    viewState,
    onViewStateChange,
    style = { width: "100vw", height: "100vh", pointerEvents: "auto" },
    mapStyle = "mapbox://styles/digijill/cl122pj52001415qofin7bb1c",
    minZoom = 5.0,
    attributionControl = true,
    scrollZoom = false,
    onLoad,
  },
  ref,
) => {
  const internalMapRef = useRef<MapRef>(null)

  const handleMapLoad = useCallback(() => {
    console.log("Map loaded")
    onLoad?.() // Notify the parent component or context
  }, [onLoad])

  function flyTo(
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
    bearing?: number,
  ) {
    const mapInstance = internalMapRef.current?.getMap() as mapboxgl.Map
    if (mapInstance) {
      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: zoom ?? 5,
        pitch: pitch ?? 0,
        bearing: bearing ?? 0,
        duration: 2000,
      })
    }
  }

  function getMap(): MapRef | undefined {
    return internalMapRef.current ?? undefined
  }

  function withMap<T>(callback: (map: MapRef) => T, fallback?: T): T {
    const map = getMap()
    return map ? callback(map) : (fallback as T)
  }

  // Usage examples:
  // 1. Check if a layer exists with fallback:
  //    withMap(map => map.getLayer('layer-id') ? true : false, false)
  // 2. Get source data with fallback:
  //    withMap(map => map.getSource('source-id')?.getData(), { features: [] })
  // 3. Perform operations with no return value:
  //    withMap(map => { map.setPaintProperty('layer-id', 'opacity', 0.5) })

  useImperativeHandle(ref, () => ({
    flyTo,
    getMap,
    withMap,
  }))

  return (
    <Map
      ref={internalMapRef}
      reuseMaps
      mapboxAccessToken={mapboxToken}
      mapStyle={mapStyle}
      style={style}
      {...viewState}
      minZoom={minZoom}
      attributionControl={attributionControl}
      scrollZoom={scrollZoom}
      dragPan
      onMove={(evt: ViewStateChangeEvent) => {
        onViewStateChange?.(evt.viewState)
      }}
      onLoad={handleMapLoad}
    >
      <NavigationControl position="top-right" style={{ marginTop: "100px" }} />
    </Map>
  )
}

export const MapboxMap = forwardRef<MapboxMapRef, MapProps>(MapboxMapBase)
