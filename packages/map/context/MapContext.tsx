"use client"

import React, { createContext, useContext, useRef, useState } from "react"
import type { MapRef } from "react-map-gl/mapbox"
import { ViewState } from "../src/types.js"
import type { Map as MapboxGLMap, AnyLayer, AnySourceData } from "mapbox-gl"

interface MapContextValue {
  mapRef: React.RefObject<MapRef | null>
  viewState: ViewState
  setViewState: (viewState: ViewState) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  })

  return (
    <MapContext.Provider value={{ mapRef, viewState, setViewState }}>
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
  const getMapInstance = (): MapboxGLMap | null => {
    if (!mapRef.current) return null
    return mapRef.current.getMap()
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
      zoom: number,
      pitch?: number,
      bearing?: number,
    ) => {
      if (!mapRef.current) return

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: zoom,
        pitch: pitch ?? viewState.pitch,
        bearing: bearing ?? viewState.bearing,
        duration: 2000,
      })
    },

    // Add/remove layers
    addLayer: (
      layerId: string,
      source: string,
      type: string,
      paint: Record<string, any>,
      layout?: Record<string, any>,
    ) => {
      const map = getMapInstance()
      if (!map) return

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source,
          type: type as any,
          paint,
          layout,
        } as AnyLayer)
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
    addSource: (sourceId: string, source: AnySourceData) => {
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
    setPaintProperty: (layerId: string, property: string, value: any) => {
      const map = getMapInstance()
      if (!map) return

      map.setPaintProperty(layerId, property as any, value)
    },

    setLayoutProperty: (layerId: string, property: string, value: any) => {
      const map = getMapInstance()
      if (!map) return

      map.setLayoutProperty(layerId, property as any, value)
    },
  }
}
