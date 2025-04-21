// packages/map/src/context/MapContext.tsx
"use client"

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { MapRef } from "react-map-gl/mapbox"
import type {
  MapOperationsAPI,
  MapLayerType,
  SourceSpecification,
  StyleValue,
  OverlayEntry,
} from "../types"

const MapContext = createContext<MapOperationsAPI | undefined>(undefined)

export function MapProvider({
  children,
  initialOverlays = {},
}: {
  children: ReactNode
  initialOverlays?: Record<string, ReactNode>
}) {
  // Stores the map instance
  const mapRef = useRef<MapRef | null>(null)

  // Stores custom overlay ReactNodes, like Framer Motion markers or tooltips
  const overlays = useRef<Record<string, OverlayEntry>>(
    Object.entries(initialOverlays).reduce((acc, [k, el]) => {
      acc[k] = { element: el }
      return acc
    }, {} as Record<string, OverlayEntry>),
  )

  const [, forceUpdate] = useState(0) // Used to re-render when overlays change

  // Universal overlay setter
  const setOverlay = useCallback(
    (key: string, element: ReactNode | null, style?: React.CSSProperties) => {
      if (element === null) {
        delete overlays.current[key]
      } else {
        overlays.current[key] = { element, style }
      }
      forceUpdate((n) => n + 1)
    },
    [],
  )

  // Shorthand for Framer Motion users
  const setMotionChildren = useCallback(
    (element: ReactNode | null, style?: React.CSSProperties) => {
      setOverlay("motion", element, style)
    },
    [setOverlay],
  )

  // Safely run map operations after checking map is loaded
  const withMap = (callback: (map: MapRef) => void) => {
    if (mapRef.current) callback(mapRef.current)
    else console.warn("withMap called but mapRef is null")
  }

  const contextValue: MapOperationsAPI = {
    mapRef,
    withMap,
    overlays,
    setOverlay,
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
        const [lng, lat, zoom, pitch = 0, bearing = 0, options = {}] = args
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom,
          pitch,
          bearing,
          duration: options.duration ?? 2000,
          easing: options.easing,
          essential: options.essential ?? true,
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
      } catch (err) {
        console.error(`Failed to add source '${id}':`, err)
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
      } catch (err) {
        console.error(`Failed to remove source '${id}':`, err)
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
      } catch (err) {
        console.error(`Failed to add layer '${id}':`, err)
      }
    },

    removeLayer: (id) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        map.removeLayer(id)
      } catch (err) {
        console.error(`Failed to remove layer '${id}':`, err)
      }
    },

    setLayerVisibility: (id, visible) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none")
      } catch (err) {
        console.error(`Failed to set visibility for layer '${id}':`, err)
      }
    },

    setLayerProperty: (id, property, value) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        if (property.startsWith("paint-")) {
          map.setPaintProperty(id, property.replace("paint-", ""), value)
        } else if (property.startsWith("layout-")) {
          map.setLayoutProperty(id, property.replace("layout-", ""), value)
        } else {
          console.warn(`Unknown property type: ${property}`)
        }
      } catch (err) {
        console.error(`Failed to set property '${property}' on '${id}':`, err)
      }
    },

    setPaintProperty: (id, prop, value) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        map.setPaintProperty(id, prop, value)
      } catch (err) {
        console.error(`Failed to set paint property '${prop}' on '${id}':`, err)
      }
    },

    setLayoutProperty: (id, prop, value) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        map.setLayoutProperty(id, prop, value)
      } catch (err) {
        console.error(`Failed to set layout property '${prop}' on '${id}':`, err)
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