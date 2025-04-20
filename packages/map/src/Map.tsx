"use client"

import { useRef, useEffect } from "react"
import { Map as ReactMapGL } from "react-map-gl/mapbox"
import { MapboxMapRef } from "./types"
import { useMap } from "../context/MapContext"

/**
 * A simple wrapper around ReactMapGL that connects to our MapContext.
 *
 * Features:
 * - Automatically registers with context for global access
 * - Supports all ReactMapGL props
 * - Provides consistent styling defaults
 */
export interface MapProps {
  /** Map style URL */
  mapStyle?: string
  /** Initial position */
  initialViewState?: {
    longitude: number
    latitude: number
    zoom: number
    pitch?: number
    bearing?: number
  }
  /** Map container width */
  width?: string | number
  /** Map container height */
  height?: string | number
  /** Map container style */
  style?: React.CSSProperties
  /** Map children (markers, popups, etc) */
  children?: React.ReactNode
  /** Called when map is loaded */
  onLoad?: () => void
  /** Any other ReactMapGL props */
  [key: string]: any
}

export function Map({
  mapStyle = "mapbox://styles/mapbox/streets-v12",
  initialViewState = {
    longitude: -98.5,
    latitude: 39.8,
    zoom: 3,
  },
  width = "100%",
  height = "100%",
  style,
  onLoad,
  children,
  ...rest
}: MapProps) {
  // Get the context ref and register this map instance
  const { mapRef: contextMapRef } = useMap()
  const internalMapRef = useRef<MapboxMapRef>(null)

  // Create a container style that includes width and height
  const containerStyle = {
    width,
    height,
    borderRadius: "4px",
    ...style,
  }

  // Connect internal ref to context ref
  useEffect(() => {
    if (internalMapRef.current) {
      // Provide custom methods for our MapboxMapRef
      internalMapRef.current.getMap = () => {
        // Access the internal mapbox instance
        return (internalMapRef.current as any)?._getMap() || null
      }

      // Store reference in context ref
      ;(contextMapRef as any).current = internalMapRef.current
    }

    // Cleanup
    return () => {
      if (contextMapRef) {
        ;(contextMapRef as any).current = null
      }
    }
  }, [contextMapRef])

  // Handle map load with extended functionality
  const handleLoad = () => {
    // Call user's onLoad handler if provided
    onLoad?.()
  }

  return (
    <ReactMapGL
      mapStyle={mapStyle}
      initialViewState={initialViewState}
      style={containerStyle}
      reuseMaps
      attributionControl={false}
      ref={internalMapRef as any}
      onLoad={handleLoad}
      {...rest}
    >
      {/* Attribution in consistent position */}
      <div
        style={{
          position: "absolute",
          bottom: "4px",
          right: "4px",
          fontSize: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          padding: "2px 5px",
          borderRadius: "3px",
        }}
      >
        © Mapbox © OpenStreetMap
      </div>

      {children}
    </ReactMapGL>
  )
}
