"use client"

import React, { createContext, useContext, useRef, useState } from "react"
import type { MapboxMapRef } from "../src/MapboxMap"
import { ViewState } from "../src/types.js"
// Import proper types from mapbox-gl
import type {
  Map as MapboxGLMap,
  LayerSpecification,
  SourceSpecification,
} from "mapbox-gl"

// Types for paint and layout properties
type PaintProperty = string | number | boolean | object
type LayoutProperty = string | number | boolean | object

interface MapContextValue {
  mapRef: React.RefObject<MapboxMapRef | null>
  viewState: ViewState
  setViewState: (viewState: ViewState) => void
  flyTo: (longitude: number, latitude: number, zoom?: number, pitch?: number, bearing?: number) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<MapboxMapRef>(null)
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  })

  return (
    <MapContext.Provider
      value={{
        mapRef,
        viewState,
        setViewState,
        flyTo: (longitude, latitude, zoom, pitch, bearing) => {
          mapRef.current?.flyTo(longitude, latitude, zoom, pitch, bearing)
        },
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export const useMap = () => {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }

  const { mapRef, viewState, setViewState } = context

  // Helper to get the underlying Mapbox GL map instance
  // Simplified for react-map-gl v8
  const getMapInstance = (): MapboxGLMap | null => {
    if (!mapRef.current) return null
    // In react-map-gl v8, we need to cast through unknown first to avoid type errors
    return mapRef.current.getMap() as unknown as MapboxGLMap
  }

  return {
    // Expose the map ref for direct access
    mapRef,

    // View state management
    viewState,
    setViewState,

    // Direct map access with safety
    withMap: <T = void,>(
      callback: (map: MapboxGLMap) => T,
      fallback?: T,
    ): T => {
      const map = getMapInstance()
      return map ? callback(map) : (fallback as T)
    },

    // Common map operations
    flyTo: (
      longitude: number,
      latitude: number,
      zoom?: number,
      pitch?: number,
      bearing?: number,
    ) => {
      if (!mapRef.current) return

      // Call flyTo directly with the separate parameters
      mapRef.current.flyTo(longitude, latitude, zoom, pitch, bearing)
    },

    // Add/remove layers
    addLayer: (
      layerId: string,
      source: string,
      type: string,
      paint: Record<string, PaintProperty>,
      layout?: Record<string, LayoutProperty>,
    ) => {
      const map = getMapInstance()
      if (!map) return

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source,
          type: type as LayerSpecification["type"],
          paint,
          layout,
        } as LayerSpecification)
      }
    },

    removeLayer: (layerId: string) => {
      const map = getMapInstance()
      if (!map) return

      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
    },

    // Source management
    addSource: (sourceId: string, source: SourceSpecification) => {
      const map = getMapInstance()
      if (!map) return

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, source)
      }
    },

    removeSource: (sourceId: string) => {
      const map = getMapInstance()
      if (!map) return

      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    },

    // Style properties
    setPaintProperty: (
      layerId: string,
      property: string,
      value: PaintProperty,
    ) => {
      const map = getMapInstance()
      if (!map) return

      // Use type assertion for the property name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setPaintProperty(layerId, property as any, value)
    },

    setLayoutProperty: (
      layerId: string,
      property: string,
      value: LayoutProperty,
    ) => {
      const map = getMapInstance()
      if (!map) return

      // Use type assertion for the property name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setLayoutProperty(layerId, property as any, value)
    },

    // Get direct access to the map
    getMap: getMapInstance,
  }
}
