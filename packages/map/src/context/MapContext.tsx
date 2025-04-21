// packages/map/src/context/MapContext.tsx
"use client"

import { createContext, useContext, useRef, useState } from "react"
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
  const [motionChildren, setMotionChildren] = useState<ReactNode | null>(null)

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
    motionChildren,
    setMotionChildren,

    flyTo: (...args: any[]) => {
      if (!mapRef.current) return

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
        const [lng, lat, zoom, pitch = 0, bearing = 0, transitionOptions = {}] = args
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

    addSource: (id, source) => {
      const map = mapRef.current?.getMap()
      if (!map || map.getSource(id)) return
      try {
        map.addSource(id, source)
      } catch (error) {
        console.error(`Failed to add source '${id}':`, error)
      }
    },

    removeSource: (id) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getSource(id)) return
      try {
        map.getStyle().layers.forEach((layer) => {
          if (layer.source === id) map.removeLayer(layer.id)
        })
        map.removeSource(id)
      } catch (error) {
        console.error(`Failed to remove source '${id}':`, error)
      }
    },

    addLayer: (id, source, type, paint, layout) => {
      const map = mapRef.current?.getMap()
      if (!map || map.getLayer(id) || !map.getSource(source)) return

      try {
        const layer: any = { id, source, type }
        if (paint) layer.paint = paint
        if (layout) layer.layout = layout
        map.addLayer(layer)
      } catch (error) {
        console.error(`Failed to add layer '${id}':`, error)
      }
    },

    removeLayer: (id) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        map.removeLayer(id)
      } catch (error) {
        console.error(`Failed to remove layer '${id}':`, error)
      }
    },

    setLayerVisibility: (id, visible) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        map.setLayoutProperty(id, "visibility" as any, visible ? "visible" : "none")
      } catch (error) {
        console.error(`Failed to set visibility for layer '${id}':`, error)
      }
    },

    setLayerProperty: (id, property, value) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
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
        console.error(`Failed to set property '${property}' for layer '${id}':`, error)
      }
    },

    setPaintProperty: (id, property, value) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        map.setPaintProperty(id, property as any, value)
      } catch (error) {
        console.error(`Failed to set paint property '${property}' for layer '${id}':`, error)
      }
    },

    setLayoutProperty: (id, property, value) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        map.setLayoutProperty(id, property as any, value)
      } catch (error) {
        console.error(`Failed to set layout property '${property}' for layer '${id}':`, error)
      }
    },

    setMarkers: () => {
      throw new Error("setMarkers not implemented yet")
    },
  }

  return <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
}

export function useMap(): MapOperationsAPI {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
