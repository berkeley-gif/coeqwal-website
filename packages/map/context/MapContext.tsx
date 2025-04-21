// packages/map/context/MapContext.tsx
"use client"

import { createContext, useContext, useRef } from "react"
import type { ReactNode } from "react"
import type { MapRef } from "react-map-gl/mapbox"
import type { MapOperationsAPI } from "../src/types"

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
    addSource: () => {
      throw new Error("addSource not implemented yet")
    },
    removeSource: () => {
      throw new Error("removeSource not implemented yet")
    },
    addLayer: () => {
      throw new Error("addLayer not implemented yet")
    },
    removeLayer: () => {
      throw new Error("removeLayer not implemented yet")
    },
    setLayerVisibility: () => {
      throw new Error("setLayerVisibility not implemented yet")
    },
    setLayerProperty: () => {
      throw new Error("setLayerProperty not implemented yet")
    },
    setPaintProperty: () => {
      throw new Error("setPaintProperty not implemented yet")
    },
    setLayoutProperty: () => {
      throw new Error("setLayoutProperty not implemented yet")
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
