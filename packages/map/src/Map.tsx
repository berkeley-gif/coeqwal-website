"use client"

import { useRef, useEffect } from "react"
import { Map as ReactMapGL } from "react-map-gl/mapbox"
import { useMap } from "../context/MapContext"
import type { MapboxMapRef, MapProps, ViewState } from "./types"

/**
 * Map component that wraps ReactMapGL with context integration
 *
 * Features:
 * - Automatically connects to MapContext
 * - Supports both controlled and uncontrolled view state
 * - Passes through all ReactMapGL props
 * - Provides consistent styling defaults
 */
export function Map({
  mapboxAccessToken,
  mapStyle = "mapbox://styles/digijill/cl122pj52001415qofin7bb1c",
  initialViewState = {
    longitude: -126.037,
    latitude: 37.962,
    zoom: 5.83,
    bearing: 0,
    pitch: 0,
  },
  width = "100%",
  height = "100%",
  style,
  onLoad,
  children,
  ...rest
}: MapProps) {
  // Get the context ref to share map instance
  const { mapRef: contextMapRef } = useMap()

  // Internal ref for direct map access
  const internalMapRef = useRef<MapboxMapRef>(null)

  // Container style with defaults
  const containerStyle = {
    width,
    height,
    ...style,
  }

  // Connect internal ref to context ref
  useEffect(() => {
    if (internalMapRef.current) {
      // Extend with custom methods
      internalMapRef.current.getMap = () => {
        // Access the internal mapbox instance
        return (internalMapRef.current as any)?._getMap() || null
      }

      // Share with context
      ;(contextMapRef as any).current = internalMapRef.current
    }

    // Cleanup on unmount
    return () => {
      if (contextMapRef) {
        ;(contextMapRef as any).current = null
      }
    }
  }, [contextMapRef])

  // Handle map load with safety
  const handleLoad = () => {
    // Call user's onLoad handler if provided
    onLoad?.()
  }

  return (
    <ReactMapGL
      mapboxAccessToken={mapboxAccessToken}
      mapStyle={mapStyle}
      initialViewState={initialViewState}
      style={containerStyle}
      reuseMaps
      attributionControl={false}
      ref={internalMapRef as any}
      onLoad={handleLoad}
      {...rest}
    >
      {/* Consistent attribution positioning */}
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
