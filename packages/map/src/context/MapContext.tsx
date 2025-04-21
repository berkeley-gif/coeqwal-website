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
        if (map.getSource(id)) return
        map.addSource(id, source)
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
        if (!map.getSource(id)) return
        map.getStyle().layers.forEach((layer) => {
          if (layer.source === id) {
            map.removeLayer(layer.id)
          }
        })
        map.removeSource(id)
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
        if (map.getLayer(id)) return
        if (!map.getSource(source)) return

        const layer: any = { id, source, type }
        if (paint) layer.paint = paint
        if (layout) layer.layout = layout

        map.addLayer(layer)
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
        if (!map.getLayer(id)) return
        map.removeLayer(id)
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
        if (!map.getLayer(id)) return
        map.setLayoutProperty(
          id,
          "visibility" as any,
          visible ? "visible" : "none",
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
        if (!map.getLayer(id)) return
        if (property.startsWith("paint-")) {
          const paintProp = property.replace("paint-", "")
          map.setPaintProperty(id, paintProp as any, value)
        } else if (property.startsWith("layout-")) {
          const layoutProp = property.replace("layout-", "")
          map.setLayoutProperty(id, layoutProp as any, value)
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
        if (!map.getLayer(id)) return
        map.setPaintProperty(id, property as any, value)
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
        if (!map.getLayer(id)) return
        map.setLayoutProperty(id, property as any, value)
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

  return (
    <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
  )
}

/**
 * useMap()
 *
 * This is the preferred way to interact with the map.
 * All methods in the context wrap the raw Mapbox map API and include safety checks.
 *
 * Avoid accessing `mapRef.current?.getMap()?.addSource(...)` directly unless absolutely necessary.
 * Instead, use `useMap().addSource(...)` for better safety, logging, and future flexibility.
 */
export function useMap(): MapOperationsAPI {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
