"use client"

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react"
import type { LayerSpecification, MapRef } from "react-map-gl/mapbox"
import type {
  MapOperationsAPI,
  MapLayerType,
  StyleValue,
  MarkerProperties,
} from "../types"

// Default transition to use when no transition is specified
const DEFAULT_TRANSITION = {
  duration: 2000,
  easing: (t: number) => t * (2 - t), // ease-out-quad
  essential: true,
}

type FlyToArgs =
  | [
      options: {
        longitude: number
        latitude: number
        zoom: number
        bearing?: number
        pitch?: number
        transitionOptions?: {
          duration?: number
          easing?: (t: number) => number
          essential?: boolean
        }
      },
    ]
  | [
      lng: number,
      lat: number,
      zoom: number,
      pitch?: number,
      bearing?: number,
      options?: {
        duration?: number
        easing?: (t: number) => number
        essential?: boolean
      },
    ]

const MapContext = createContext<MapOperationsAPI | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<MapRef | null>(null)
  const [markers, setMarkersState] = useState<MarkerProperties[]>([])
  const [motionChildren, setMotionChildrenState] = useState<ReactNode | null>(
    null,
  )
  const [motionChildrenStyle, setMotionChildrenStyle] = useState<
    CSSProperties | undefined
  >(undefined)

  const contextValue: MapOperationsAPI = {
    mapRef,
    markers,

    withMap: (callback) => {
      if (mapRef.current) callback(mapRef.current)
      else console.warn("withMap called but mapRef is null")
    },

    getStyle: () => {
      const map = mapRef.current?.getMap()
      if (!map) {
        console.warn("getStyle called but map is null")
        return { sources: {}, layers: [] }
      }
      try {
        return map.getStyle()
      } catch (err) {
        console.error("Failed to get map style:", err)
        return { sources: {}, layers: [] }
      }
    },

    hasSource: (id: string) => {
      const map = mapRef.current?.getMap()
      if (!map) return false
      try {
        return !!map.getSource(id)
      } catch (err) {
        console.error(`Failed to check if source '${id}' exists:`, err)
        return false
      }
    },

    hasLayer: (id: string) => {
      const map = mapRef.current?.getMap()
      if (!map) return false
      try {
        return !!map.getLayer(id)
      } catch (err) {
        console.error(`Failed to check if layer '${id}' exists:`, err)
        return false
      }
    },

    flyTo: (...args: FlyToArgs) => {
      if (!mapRef.current) return

      if (
        args.length === 1 &&
        typeof args[0] === "object" &&
        "longitude" in args[0] &&
        "latitude" in args[0] &&
        "zoom" in args[0]
      ) {
        const {
          longitude,
          latitude,
          zoom,
          bearing = 0,
          pitch = 0,
          transitionOptions = DEFAULT_TRANSITION,
        } = args[0]
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom,
          bearing,
          pitch,
          duration: transitionOptions.duration ?? DEFAULT_TRANSITION.duration,
          easing:
            typeof transitionOptions.easing === "function"
              ? transitionOptions.easing
              : DEFAULT_TRANSITION.easing,
          essential:
            transitionOptions.essential ?? DEFAULT_TRANSITION.essential,
        })
      } else if (
        args.length >= 3 &&
        typeof args[0] === "number" &&
        typeof args[1] === "number"
      ) {
        const lng = args[0]
        const lat = args[1]
        const zoom = args[2]
        const pitch = args[3] ?? 0
        const bearing = args[4] ?? 0
        const options = args[5] ?? DEFAULT_TRANSITION

        mapRef.current.flyTo({
          center: [lng, lat],
          zoom,
          pitch,
          bearing,
          duration: options.duration ?? DEFAULT_TRANSITION.duration,
          easing:
            typeof options.easing === "function"
              ? options.easing
              : DEFAULT_TRANSITION.easing,
          essential: options.essential ?? DEFAULT_TRANSITION.essential,
        })
      } else {
        console.warn("⚠️ flyTo was called with unexpected arguments", args)
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

    addLayer: (
      id: string,
      source: string,
      type: MapLayerType | string,
      paint?: Record<string, StyleValue>,
      layout?: Record<string, StyleValue>,
      others?: Record<string, StyleValue>,
    ) => {
      const map = mapRef.current?.getMap()
      if (!map || map.getLayer(id) || !map.getSource(source)) return
      try {
        const layer = {
          id,
          source,
          type,
          ...(paint ? { paint } : {}),
          ...(layout ? { layout } : {}),
          ...(others ? others : {}),
        } as LayerSpecification
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
          const paintProp = property.replace("paint-", "")
          // @ts-expect-error - Dynamic property name doesn't match Mapbox's specific string literal types
          map.setPaintProperty(id, paintProp, value)
        } else if (property.startsWith("layout-")) {
          const layoutProp = property.replace("layout-", "")
          // @ts-expect-error - Dynamic property name doesn't match Mapbox's specific string literal types
          map.setLayoutProperty(id, layoutProp, value)
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
        // @ts-expect-error - Dynamic property name doesn't match Mapbox's specific string literal types
        map.setPaintProperty(id, prop, value)
      } catch (err) {
        console.error(`Failed to set paint property '${prop}' on '${id}':`, err)
      }
    },

    setLayoutProperty: (id, prop, value) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return
      try {
        // @ts-expect-error - Dynamic property name doesn't match Mapbox's specific string literal types
        map.setLayoutProperty(id, prop, value)
      } catch (err) {
        console.error(
          `Failed to set layout property '${prop}' on '${id}':`,
          err,
        )
      }
    },

    setMarkers: (newMarkers) => {
      setMarkersState(newMarkers)
    },

    setMotionChildren: (element, style) => {
      setMotionChildrenState(element)
      setMotionChildrenStyle(style)
    },

    motionChildren,
    motionChildrenStyle,
  }

  return (
    <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
  )
}

export function useMap(): MapOperationsAPI {
  const context = useContext(MapContext)
  if (!context) {
    console.warn("⚠️ useMap was called outside of a MapProvider!")
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
