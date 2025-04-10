"use client" // necessary for mapbox-gl

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useState,
} from "react"
import Map, { NavigationControl, Marker, Popup } from "react-map-gl/mapbox"
import type { MapRef } from "react-map-gl/mapbox"
import type { ViewStateChangeEvent } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { ViewState } from "./types.js" // TODO: this responsive plan for the map needs refinement

// Re-export any components and types that should be available to consumers
export { Marker, Popup }

export interface MarkerProperties {
  longitude: number
  latitude: number
  id?: string | number
  color?: string
  size?: number
  title?: string
  description?: string
  // Additional properties for tooltips
  Comment?: string
  nodeCode?: string
  properties?: {
    Comment?: string
    "node-code"?: string
    [key: string]: unknown
  }
}

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
  withMap: <T = void>(callback: (map: MapRef) => T, fallback?: T) => T

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
   * @param pitch - Optional pitch angle in degrees (0-60)
   * @param bearing - Optional bearing angle in degrees
   */
  flyTo: (
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
    bearing?: number,
  ) => void

  /**
   * Sets the markers to be displayed on the map.
   *
   * @param markers - Array of marker properties
   */
  setMarkers: (markers: Array<MarkerProperties>) => void
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
  navigationControl?: boolean
  interactive?: boolean
  dragPan?: boolean
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
    navigationControl = true,
    interactive = true,
    dragPan = true,
    onLoad,
  },
  ref,
) => {
  const internalMapRef = useRef<MapRef>(null)
  const [markers, setMarkersState] = useState<Array<MarkerProperties>>([])
  const [selectedMarker, setSelectedMarker] = useState<MarkerProperties | null>(
    null,
  )

  // Calculate marker size based on zoom level
  const getScaledMarkerSize = useCallback((baseSize: number, zoom: number) => {
    // Define zoom bounds
    const minZoom = 4
    const maxZoom = 12
    const minScale = 0.8 // Keep small at low zoom
    const maxScale = 1.2 // remember: adjust size here

    // Clamp zoom to defined range
    const clampedZoom = Math.max(minZoom, Math.min(zoom, maxZoom))

    // Calculate scale factor (linear interpolation between minScale and maxScale)
    const zoomRatio = (clampedZoom - minZoom) / (maxZoom - minZoom)
    const scaleFactor = minScale + zoomRatio * (maxScale - minScale)

    // Apply scale to base size
    return Math.round(baseSize * scaleFactor)
  }, [])

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
    // Simplified for react-map-gl v8
    const mapInstance = internalMapRef.current
    if (!mapInstance) return

    mapInstance.flyTo({
      center: [longitude, latitude],
      zoom: zoom ?? 5,
      pitch: pitch ?? 0,
      bearing: bearing ?? 0,
      duration: 3000,
      easing: (t) => t, // Linear easing - constant speed
    })
  }

  function getMap(): MapRef | undefined {
    return internalMapRef.current ?? undefined
  }

  function withMap<T = void>(callback: (map: MapRef) => T, fallback?: T): T {
    const map = getMap()
    return map ? callback(map) : (fallback as T)
  }

  function setMarkers(newMarkers: Array<MarkerProperties>) {
    setMarkersState(newMarkers)
  }

  useImperativeHandle(ref, () => ({
    flyTo,
    getMap,
    withMap,
    setMarkers,
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
      dragPan={dragPan}
      interactive={interactive}
      onClick={() => setSelectedMarker(null)}
      onMove={(evt: ViewStateChangeEvent) => {
        onViewStateChange?.(evt.viewState)
      }}
      onLoad={handleMapLoad}
    >
      {(navigationControl) && <NavigationControl position="top-right" style={{ marginTop: "100px" }} />}
      {markers.map((marker, index) => {
        // Calculate scaled size based on current zoom level
        const currentZoom = viewState.zoom || 5
        const baseSize = marker.size || 10
        const scaledSize = getScaledMarkerSize(baseSize, currentZoom)

        // Create tooltip content from marker properties
        const tooltipId = marker.id || ""
        const tooltipComment =
          marker.Comment || marker.properties?.Comment || ""
        const tooltipNodeCode =
          marker.nodeCode || marker.properties?.["node-code"] || ""

        // Create tooltip content
        const tooltipContent = `ID: ${tooltipId}
Comment: ${tooltipComment}
Node Code: ${tooltipNodeCode}`

        return (
          <Marker
            key={index}
            longitude={marker.longitude}
            latitude={marker.latitude}
          >
            <div
              style={{
                backgroundColor: "rgba(239, 152, 39, 0.8)",
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                borderRadius: "50%",
                border: "1px solid white",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.8)", // To enhance white outline
                cursor: "pointer", // Add pointer cursor
              }}
              title={tooltipContent}
              onClick={(e) => {
                e.stopPropagation() // Prevent map click from firing
                // Toggle marker selection
                setSelectedMarker(
                  selectedMarker?.id === marker.id ? null : marker,
                )
              }}
            />
          </Marker>
        )
      })}
      {selectedMarker && (
        <Popup
          longitude={selectedMarker.longitude}
          latitude={selectedMarker.latitude}
          closeButton={true}
          closeOnClick={false}
          onClose={() => setSelectedMarker(null)}
          anchor="bottom"
          offset={15} // Add offset to accommodate the triangle pointer
          style={{ zIndex: 10 }}
        >
          <div style={{ padding: "5px", fontFamily: "Arial, sans-serif" }}>
            <h3
              style={{
                margin: "0 0 8px 0",
                color: "#154F89",
                fontSize: "16px",
              }}
            >
              {selectedMarker.id}
            </h3>
            {selectedMarker.Comment && (
              <div style={{ margin: "4px 0", fontSize: "13px" }}>
                <strong>Comment:</strong>{" "}
                {selectedMarker.Comment || selectedMarker.properties?.Comment}
              </div>
            )}
            {(selectedMarker.nodeCode ||
              selectedMarker.properties?.["node-code"]) && (
              <div style={{ margin: "4px 0", fontSize: "13px" }}>
                <strong>Node Type:</strong>{" "}
                {selectedMarker.nodeCode ||
                  selectedMarker.properties?.["node-code"]}
              </div>
            )}
          </div>
        </Popup>
      )}
    </Map>
  )
}

export const MapboxMap = forwardRef<MapboxMapRef, MapProps>(MapboxMapBase)
