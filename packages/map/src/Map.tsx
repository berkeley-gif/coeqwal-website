"use client"

import { useRef, useEffect } from "react"
import { Map as ReactMapGL, MapRef } from "react-map-gl/mapbox"
import { useMap } from "../context/MapContext"
import type { MapboxMapRef, MapProps } from "./types"

// Create a proper interface that extends the expected MapRef type
interface InternalMapRef extends MapRef, MapboxMapRef {}

// Custom props for ReactMapGL that include our custom prop
type ReactMapGLProps = React.ComponentProps<typeof ReactMapGL> & {
  mapboxToken?: string
}

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
  mapboxToken,
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
  const internalMapRef = useRef<InternalMapRef>(null)

  // Container style with defaults
  const containerStyle = {
    width,
    height,
    ...style,
  }

  // Connect internal ref to context ref
  useEffect(() => {
    if (internalMapRef.current) {
      // MapRef already has getMap() that returns the Mapbox instance
      // We just need to ensure it's available before assigning to context
      const mapInstance = internalMapRef.current

      // Share with context
      contextMapRef.current = {
        getMap: () => {
          if (!mapInstance) {
            throw new Error("Map instance not available")
          }
          return mapInstance.getMap()
        },
      }
    }

    // Cleanup on unmount
    return () => {
      if (contextMapRef) {
        contextMapRef.current = null
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
      mapboxToken={mapboxToken}
      mapStyle={mapStyle}
      initialViewState={initialViewState}
      style={containerStyle}
      reuseMaps
      attributionControl={false}
      ref={internalMapRef as React.RefObject<MapRef>}
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
