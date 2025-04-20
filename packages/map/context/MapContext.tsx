"use client"

import { createContext, useContext, useRef, useCallback } from "react"
import type { Map as MapboxMap } from "mapbox-gl"
import {
  MapboxMapRef,
  ViewState,
  MapLayerType,
  MapSource,
  StyleValue,
  MapOperationsAPI,
  ViewStateTransitionOptions,
} from "../src/types"

// Default value for the context (used for type safety)
const defaultValue: MapOperationsAPI = {
  mapRef: { current: null as unknown as MapboxMapRef }, // Cast to satisfy type check
  withMap: () => {},
  flyTo: (() => {}) as any, // Cast to satisfy overloaded function type
  addSource: () => {},
  removeSource: () => {},
  addLayer: () => {},
  removeLayer: () => {},
  setLayerVisibility: () => {},
  setLayerProperty: () => {},
  setPaintProperty: () => {},
  setLayoutProperty: () => {},
}

// Create the context
const MapContext = createContext<MapOperationsAPI>(defaultValue)

/**
 * Provider component for the Map context
 * Wraps map-related components and provides access to map operations
 */
export function MapProvider({ children }: { children: React.ReactNode }) {
  // Create a ref to store the map instance
  const mapRef = useRef<MapboxMapRef | null>(null)

  // Helper to safely execute operations with the map instance
  const withMap = useCallback((callback: (map: MapboxMap) => void) => {
    const map = mapRef.current?.getMap()
    if (map) {
      callback(map)
    } else {
      console.warn("Map operation attempted before map was loaded")
    }
  }, [])

  // Flyto with overload (because we can either use a ViewState object or individual coordinates and values)
  const flyTo = useCallback(
    function flyTo(
      longitudeOrViewState: number | ViewState,
      latitude?: number,
      zoom?: number,
      transitionOptions?: ViewStateTransitionOptions,
    ): void {
      withMap((map) => {
        // Check if first argument is a ViewState object
        if (typeof longitudeOrViewState === "object") {
          const viewState = longitudeOrViewState
          const options = viewState.transitionOptions || {}

          // Apply common transition options with defaults
          const commonOptions = {
            duration: options.duration || 2000,
            easing: options.easing,
            essential: options.essential ?? true,
            // Common camera settings from ViewState
            bearing: viewState.bearing,
            pitch: viewState.pitch,
          }

          // Check if bounds are specified instead of center point
          if (viewState.bounds) {
            // Use fitBounds instead of flyTo when bounds are specified
            map.fitBounds(viewState.bounds, {
              ...commonOptions,
              padding: 50, // Add some padding around the bounds
              linear: false, // Use non-linear interpolation
              offset: [0, 0], // No offset from center
              maxZoom: viewState.zoom, // Optional constraint on max zoom
            })
          } else {
            // Use standard flyTo when center point is specified
            map.flyTo({
              ...commonOptions,
              center: [viewState.longitude, viewState.latitude],
              zoom: viewState.zoom,
            })
          }
        }
        // Handle coordinates version
        else if (typeof latitude === "number" && typeof zoom === "number") {
          const options = transitionOptions || {}

          map.flyTo({
            center: [longitudeOrViewState, latitude],
            zoom: zoom,
            duration: options.duration || 2000,
            easing: options.easing,
            essential: options.essential ?? true,
          })
        } else {
          console.warn("Invalid arguments to flyTo method")
        }
      })
    },
    [withMap],
  )

  // Source operations
  const addSource = useCallback(
    (id: string, source: Omit<MapSource, "id">) => {
      withMap((map) => {
        if (!map.getSource(id)) {
          map.addSource(id, { id, ...source } as any)
        }
      })
    },
    [withMap],
  )

  const removeSource = useCallback(
    (id: string) => {
      withMap((map) => {
        // Check if source exists
        if (map.getSource(id)) {
          // Remove all layers that use this source
          map.getStyle().layers.forEach((layer) => {
            if (layer.source === id) {
              map.removeLayer(layer.id)
            }
          })
          // Then remove the source
          map.removeSource(id)
        }
      })
    },
    [withMap],
  )

  // Layer operations
  const addLayer = useCallback(
    (
      id: string,
      source: string,
      type: MapLayerType,
      paint?: Record<string, StyleValue>,
      layout?: Record<string, StyleValue>,
    ) => {
      withMap((map) => {
        if (!map.getLayer(id)) {
          map.addLayer({
            id,
            source,
            type,
            paint,
            layout,
          })
        }
      })
    },
    [withMap],
  )

  const removeLayer = useCallback(
    (id: string) => {
      withMap((map) => {
        if (map.getLayer(id)) {
          map.removeLayer(id)
        }
      })
    },
    [withMap],
  )

  // Styling operations
  const setLayerVisibility = useCallback(
    (id: string, visible: boolean) => {
      withMap((map) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", visible ? "visible" : "none")
        }
      })
    },
    [withMap],
  )

  const setLayerProperty = useCallback(
    (id: string, property: string, value: StyleValue) => {
      withMap((map) => {
        if (map.getLayer(id)) {
          // Determine if this is a paint or layout property
          const isPaint = property.startsWith("paint.")
          const isLayout = property.startsWith("layout.")

          if (isPaint) {
            const paintProp = property.replace("paint.", "")
            map.setPaintProperty(id, paintProp as any, value)
          } else if (isLayout) {
            const layoutProp = property.replace("layout.", "")
            map.setLayoutProperty(id, layoutProp as any, value)
          } else {
            console.warn(
              `Unknown property type for ${property}. Use paint.* or layout.* prefix.`,
            )
          }
        }
      })
    },
    [withMap],
  )

  const setPaintProperty = useCallback(
    (id: string, property: string, value: StyleValue) => {
      withMap((map) => {
        if (map.getLayer(id)) {
          map.setPaintProperty(id, property as any, value)
        }
      })
    },
    [withMap],
  )

  const setLayoutProperty = useCallback(
    (id: string, property: string, value: StyleValue) => {
      withMap((map) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, property as any, value)
        }
      })
    },
    [withMap],
  )

  // Construct the context value
  const mapOperationsAPI: MapOperationsAPI = {
    mapRef: mapRef as React.RefObject<MapboxMapRef>,
    withMap,
    flyTo,
    addSource,
    removeSource,
    addLayer,
    removeLayer,
    setLayerVisibility,
    setLayerProperty,
    setPaintProperty,
    setLayoutProperty,
  }

  return (
    <MapContext.Provider value={mapOperationsAPI}>
      {children}
    </MapContext.Provider>
  )
}

/**
 * Hook to access map operations anywhere in the component tree
 * Must be used within a MapProvider
 */
export function useMap(): MapOperationsAPI {
  const context = useContext(MapContext)

  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }

  return context
}
