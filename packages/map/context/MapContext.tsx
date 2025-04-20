"use client"

import { createContext, useContext, useRef, useMemo, useCallback } from "react"
import { MapOperationsAPI, MapboxMapRef } from "../src/types"

/**
 * MapContext provides access to map operations from any component in the tree.
 *
 * It exposes:
 * - Direct map access via mapRef
 * - Helper methods for common operations
 *
 * Usage:
 * const { flyTo, addLayer } = useMap();
 */
const MapContext = createContext<MapOperationsAPI | null>(null)

export interface MapProviderProps {
  children: React.ReactNode
}

export function MapProvider({ children }: MapProviderProps) {
  // Create a ref to store the map instance
  const mapRef = useRef<MapboxMapRef>(null)

  // Navigation helpers
  const flyTo = useCallback(
    (
      longitude: number,
      latitude: number,
      zoom: number,
      options?: { pitch?: number; bearing?: number; duration?: number },
    ) => {
      if (!mapRef.current?.getMap()) return

      const map = mapRef.current.getMap()
      map?.flyTo({
        center: [longitude, latitude],
        zoom,
        pitch: options?.pitch,
        bearing: options?.bearing,
        duration: options?.duration,
      })
    },
    [],
  )

  // Layer and source helpers
  const addSource = useCallback(
    (id: string, source: { type: string; [key: string]: any }) => {
      if (!mapRef.current?.getMap()) return

      const map = mapRef.current.getMap()
      if (map && !map.getSource(id)) {
        map.addSource(id, { ...source, id })
      }
    },
    [],
  )

  const removeSource = useCallback((id: string) => {
    if (!mapRef.current?.getMap()) return

    const map = mapRef.current.getMap()
    if (map && map.getSource(id)) {
      // Remove any layers using this source first
      map.getStyle().layers.forEach((layer: any) => {
        if (layer.source === id) {
          map.removeLayer(layer.id)
        }
      })
      map.removeSource(id)
    }
  }, [])

  const addLayer = useCallback(
    (
      id: string,
      source: string,
      type: string,
      paint?: Record<string, any>,
      layout?: Record<string, any>,
    ) => {
      if (!mapRef.current?.getMap()) return

      const map = mapRef.current.getMap()
      if (map && !map.getLayer(id)) {
        map.addLayer({
          id,
          source,
          type: type as any,
          paint,
          layout,
        })
      }
    },
    [],
  )

  const removeLayer = useCallback((id: string) => {
    if (!mapRef.current?.getMap()) return

    const map = mapRef.current.getMap()
    if (map && map.getLayer(id)) {
      map.removeLayer(id)
    }
  }, [])

  // Styling helpers
  const setLayerVisibility = useCallback((id: string, visible: boolean) => {
    if (!mapRef.current?.getMap()) return

    const map = mapRef.current.getMap()
    if (map && map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none")
    }
  }, [])

  const setLayerProperty = useCallback(
    (id: string, property: string, value: any) => {
      if (!mapRef.current?.getMap()) return

      const map = mapRef.current.getMap()
      if (map && map.getLayer(id)) {
        // Determine if it's a paint or layout property
        if (property.startsWith("paint.")) {
          map.setPaintProperty(id, property.substring(6), value)
        } else if (property.startsWith("layout.")) {
          map.setLayoutProperty(id, property.substring(7), value)
        }
      }
    },
    [],
  )

  // Memoize all operations to prevent unnecessary re-renders
  const mapOperations = useMemo<MapOperationsAPI>(
    () => ({
      mapRef,
      flyTo,
      addSource,
      removeSource,
      addLayer,
      removeLayer,
      setLayerVisibility,
      setLayerProperty,
    }),
    [
      flyTo,
      addSource,
      removeSource,
      addLayer,
      removeLayer,
      setLayerVisibility,
      setLayerProperty,
    ],
  )

  return (
    <MapContext.Provider value={mapOperations}>{children}</MapContext.Provider>
  )
}

// Hook to use the map anywhere in the component tree
export function useMap() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
