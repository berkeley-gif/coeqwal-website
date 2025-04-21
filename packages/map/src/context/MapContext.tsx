// packages/map/context/MapContext.tsx
"use client"

import { createContext, useContext, useRef } from "react"
import type { ReactNode } from "react"
import type { MapRef } from "react-map-gl/mapbox"
import type {
  MapOperationsAPI,
  StyleValue,
  MapLayerType,
  SourceSpecification,
} from "../types"

const MapContext = createContext<MapOperationsAPI | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  // ✅ This ref is now directly a MapRef from react-map-gl
  const mapRef = useRef<MapRef | null>(null)

  const withMap = (callback: (map: MapRef) => void) => {
    if (mapRef.current) {
      callback(mapRef.current)
    } else {
      console.warn("withMap called but mapRef is null")
    }
  }

  const contextValue: MapOperationsAPI = {
    mapRef,
    withMap,
    flyTo: (...args: any[]) => {
      if (!mapRef.current) {
        console.warn("flyTo called but mapRef is null")
        return
      }

      if (typeof args[0] === "object") {
        const viewState = args[0]
        mapRef.current.flyTo({
          center: [viewState.longitude, viewState.latitude],
          zoom: viewState.zoom,
          bearing: viewState.bearing ?? 0,
          pitch: viewState.pitch ?? 0,
          duration: viewState.transitionOptions?.duration ?? 4000,
          easing: viewState.transitionOptions?.easing,
          essential: viewState.transitionOptions?.essential ?? true,
        })
      } else {
        const [lng, lat, zoom, pitch = 0, bearing = 0, transitionOptions = {}] =
          args
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom,
          pitch,
          bearing,
          duration: transitionOptions.duration ?? 2000,
          easing: transitionOptions.easing,
          essential: transitionOptions.essential ?? true,
        })
      }
    },
    fitBounds: () => {
      throw new Error("fitBounds not implemented yet")
    },
    addSource: (id: string, source: SourceSpecification) => {
      if (!mapRef.current) {
        console.warn("addSource called but mapRef is null")
        return
      }

      const map = mapRef.current.getMap()

      try {
        // Check if source already exists
        if (map.getSource(id)) {
          console.warn(`Source '${id}' already exists`)
          return
        }

        // Add the source
        map.addSource(id, source)
        console.log(`Source '${id}' added successfully`)
      } catch (error) {
        console.error(`Failed to add source '${id}':`, error)
      }
    },
    removeSource: (id: string) => {
      if (!mapRef.current) {
        console.warn("removeSource called but mapRef is null")
        return
      }

      const map = mapRef.current.getMap()

      try {
        // Check if source exists
        if (!map.getSource(id)) {
          console.warn(`Source '${id}' does not exist`)
          return
        }

        // Remove any layers that use this source first
        map.getStyle().layers.forEach((layer) => {
          if (layer.source === id) {
            map.removeLayer(layer.id)
          }
        })

        // Remove the source
        map.removeSource(id)
        console.log(`Source '${id}' removed successfully`)
      } catch (error) {
        console.error(`Failed to remove source '${id}':`, error)
      }
    },
    addLayer: (
      id: string,
      source: string,
      type: MapLayerType,
      paint?: Record<string, StyleValue>,
      layout?: Record<string, StyleValue>,
    ) => {
      if (!mapRef.current) {
        console.warn("addLayer called but mapRef is null")
        return
      }

      const map = mapRef.current.getMap()

      try {
        // Check if layer already exists
        if (map.getLayer(id)) {
          console.warn(`Layer '${id}' already exists`)
          return
        }

        // Check if source exists
        if (!map.getSource(source)) {
          console.warn(`Source '${source}' does not exist`)
          return
        }

        // Add the layer
        map.addLayer({
          id,
          source,
          type,
          paint,
          layout,
        })
        console.log(`Layer '${id}' added successfully`)
      } catch (error) {
        console.error(`Failed to add layer '${id}':`, error)
      }
    },
    removeLayer: (id: string) => {
      if (!mapRef.current) {
        console.warn("removeLayer called but mapRef is null")
        return
      }

      const map = mapRef.current.getMap()

      try {
        // Check if layer exists
        if (!map.getLayer(id)) {
          console.warn(`Layer '${id}' does not exist`)
          return
        }

        // Remove the layer
        map.removeLayer(id)
        console.log(`Layer '${id}' removed successfully`)
      } catch (error) {
        console.error(`Failed to remove layer '${id}':`, error)
      }
    },
    setLayerVisibility: (id: string, visible: boolean) => {
      if (!mapRef.current) {
        console.warn("setLayerVisibility called but mapRef is null")
        return
      }

      const map = mapRef.current.getMap()

      try {
        // Check if layer exists
        if (!map.getLayer(id)) {
          console.warn(`Layer '${id}' does not exist`)
          return
        }

        // Set layer visibility
        map.setLayoutProperty(
          id,
          "visibility" as any,
          visible ? "visible" : "none",
        )
        console.log(
          `Layer '${id}' visibility set to ${visible ? "visible" : "none"}`,
        )
      } catch (error) {
        console.error(`Failed to set visibility for layer '${id}':`, error)
      }
    },
    setLayerProperty: (id: string, property: string, value: StyleValue) => {
      if (!mapRef.current) {
        console.warn("setLayerProperty called but mapRef is null")
        return
      }

      const map = mapRef.current.getMap()

      try {
        // Check if layer exists
        if (!map.getLayer(id)) {
          console.warn(`Layer '${id}' does not exist`)
          return
        }

        // Determine if it's a paint or layout property based on property name
        if (property.startsWith("paint-")) {
          const paintProp = property.replace("paint-", "")
          map.setPaintProperty(id, paintProp as any, value)
          console.log(`Paint property '${paintProp}' set for layer '${id}'`)
        } else if (property.startsWith("layout-")) {
          const layoutProp = property.replace("layout-", "")
          map.setLayoutProperty(id, layoutProp as any, value)
          console.log(`Layout property '${layoutProp}' set for layer '${id}'`)
        } else {
          console.warn(`Unknown property type: ${property}`)
        }
      } catch (error) {
        console.error(
          `Failed to set property '${property}' for layer '${id}':`,
          error,
        )
      }
    },
    setPaintProperty: (id: string, property: string, value: StyleValue) => {
      if (!mapRef.current) {
        console.warn("setPaintProperty called but mapRef is null")
        return
      }

      const map = mapRef.current.getMap()

      try {
        // Check if layer exists
        if (!map.getLayer(id)) {
          console.warn(`Layer '${id}' does not exist`)
          return
        }

        // Set paint property
        map.setPaintProperty(id, property as any, value)
        console.log(`Paint property '${property}' set for layer '${id}'`)
      } catch (error) {
        console.error(
          `Failed to set paint property '${property}' for layer '${id}':`,
          error,
        )
      }
    },
    setLayoutProperty: (id: string, property: string, value: StyleValue) => {
      if (!mapRef.current) {
        console.warn("setLayoutProperty called but mapRef is null")
        return
      }

      const map = mapRef.current.getMap()

      try {
        // Check if layer exists
        if (!map.getLayer(id)) {
          console.warn(`Layer '${id}' does not exist`)
          return
        }

        // Set layout property
        map.setLayoutProperty(id, property as any, value)
        console.log(`Layout property '${property}' set for layer '${id}'`)
      } catch (error) {
        console.error(
          `Failed to set layout property '${property}' for layer '${id}':`,
          error,
        )
      }
    },
    setMarkers: () => {
      throw new Error("setMarkers not implemented yet")
    },
    setMotionChildren: () => {
      throw new Error("setMotionChildren not implemented yet")
    },
  }

  console.log("🟢 MapProvider mounted")

  return (
    <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
  )
}

export function useMap(): MapOperationsAPI {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
