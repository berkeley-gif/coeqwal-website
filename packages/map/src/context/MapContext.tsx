"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react"
import type { LayerSpecification, MapRef } from "react-map-gl/mapbox"
import type {
  MapOperationsAPI,
  ViewState,
  ViewStateTransitionOptions,
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

  // All callbacks below read from mapRef.current (stable ref) and mutate
  // the map imperatively, so they're wrapped in useCallback with empty
  // deps. Memoizing the context value below keeps every useMap() consumer
  // from re-rendering whenever any part of the MapProvider tree renders.
  const withStyleLoaded = useCallback((operation: () => void) => {
    const map = mapRef.current?.getMap()
    if (!map) return

    if (!map.isStyleLoaded()) {
      map.once("styledata", operation)
      return
    }

    operation()
  }, [])

  const withMap = useCallback<MapOperationsAPI["withMap"]>((callback) => {
    if (mapRef.current) callback(mapRef.current)
    else console.warn("withMap called but mapRef is null")
  }, [])

  const getStyle = useCallback<MapOperationsAPI["getStyle"]>(() => {
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
  }, [])

  const hasSource = useCallback<MapOperationsAPI["hasSource"]>((id) => {
    const map = mapRef.current?.getMap()
    if (!map) return false
    try {
      return !!map.getSource(id)
    } catch (err) {
      console.error(`Failed to check if source '${id}' exists:`, err)
      return false
    }
  }, [])

  const hasLayer = useCallback<MapOperationsAPI["hasLayer"]>((id) => {
    const map = mapRef.current?.getMap()
    if (!map) return false
    try {
      return !!map.getLayer(id)
    } catch (err) {
      console.error(`Failed to check if layer '${id}' exists:`, err)
      return false
    }
  }, [])

  const flyTo = useCallback((...args: FlyToArgs) => {
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
        essential: transitionOptions.essential ?? DEFAULT_TRANSITION.essential,
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
  }, [])

  const fitBounds = useCallback(
    (
      boundsOrViewState:
        | [[number, number], [number, number]]
        | Pick<ViewState, "bounds" | "pitch" | "bearing" | "transitionOptions">,
      pitch?: number,
      bearing?: number,
      padding?:
        | number
        | { top: number; bottom: number; left: number; right: number },
      transitionOptions?: ViewStateTransitionOptions,
    ) => {
      const map = mapRef.current?.getMap()
      if (!map) return

      try {
        if (Array.isArray(boundsOrViewState)) {
          map.fitBounds(boundsOrViewState, {
            pitch: pitch ?? 0,
            bearing: bearing ?? 0,
            padding: padding ?? 50,
            duration:
              transitionOptions?.duration ?? DEFAULT_TRANSITION.duration,
            easing: transitionOptions?.easing ?? DEFAULT_TRANSITION.easing,
            essential:
              transitionOptions?.essential ?? DEFAULT_TRANSITION.essential,
          })
        } else {
          const viewState = boundsOrViewState
          map.fitBounds(viewState.bounds!, {
            pitch: viewState.pitch ?? 0,
            bearing: viewState.bearing ?? 0,
            padding: padding ?? 50,
            duration:
              viewState.transitionOptions?.duration ??
              DEFAULT_TRANSITION.duration,
            easing:
              viewState.transitionOptions?.easing ?? DEFAULT_TRANSITION.easing,
            essential:
              viewState.transitionOptions?.essential ??
              DEFAULT_TRANSITION.essential,
          })
        }
      } catch (err) {
        console.error("Failed to fit bounds:", err)
      }
    },
    [],
  )

  const addSource = useCallback<MapOperationsAPI["addSource"]>(
    (id, source) => {
      const map = mapRef.current?.getMap()
      if (!map || map.getSource(id)) return

      withStyleLoaded(() => {
        try {
          if (map.getSource(id)) return
          map.addSource(id, source)
        } catch (err) {
          console.error(`Failed to add source '${id}':`, err)
        }
      })
    },
    [withStyleLoaded],
  )

  const removeSource = useCallback<MapOperationsAPI["removeSource"]>((id) => {
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
  }, [])

  const addLayer = useCallback<MapOperationsAPI["addLayer"]>(
    (id, source, type, paint, layout, others) => {
      const map = mapRef.current?.getMap()
      if (!map || map.getLayer(id) || !map.getSource(source)) return

      withStyleLoaded(() => {
        try {
          if (map.getLayer(id) || !map.getSource(source)) return

          const { beforeId, ...otherProps } = others || {}
          const layer = {
            id,
            source,
            type,
            ...(paint ? { paint } : {}),
            ...(layout ? { layout } : {}),
            ...otherProps,
          } as LayerSpecification

          if (beforeId && typeof beforeId === "string") {
            map.addLayer(layer, beforeId)
          } else {
            map.addLayer(layer)
          }
        } catch (err) {
          console.error(`Failed to add layer '${id}':`, err)
        }
      })
    },
    [withStyleLoaded],
  )

  const removeLayer = useCallback<MapOperationsAPI["removeLayer"]>((id) => {
    const map = mapRef.current?.getMap()
    if (!map || !map.getLayer(id)) return
    try {
      map.removeLayer(id)
    } catch (err) {
      console.error(`Failed to remove layer '${id}':`, err)
    }
  }, [])

  const setLayerVisibility = useCallback<
    MapOperationsAPI["setLayerVisibility"]
  >((id, visible) => {
    const map = mapRef.current?.getMap()
    if (!map || !map.getLayer(id)) return
    try {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none")
    } catch (err) {
      console.error(`Failed to set visibility for layer '${id}':`, err)
    }
  }, [])

  const setLayerProperty = useCallback<MapOperationsAPI["setLayerProperty"]>(
    (id, property, value) => {
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
    [],
  )

  const setPaintProperty = useCallback<MapOperationsAPI["setPaintProperty"]>(
    (id, prop, value) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return

      if (value === null || value === undefined) {
        console.warn(
          `setPaintProperty called with null/undefined value for property '${prop}' on layer '${id}'`,
        )
        return
      }

      try {
        // @ts-expect-error - Dynamic property name doesn't match Mapbox's specific string literal types
        map.setPaintProperty(id, prop, value)
      } catch (err) {
        console.error(`Failed to set paint property '${prop}' on '${id}':`, err)
      }
    },
    [],
  )

  const setLayoutProperty = useCallback<MapOperationsAPI["setLayoutProperty"]>(
    (id, prop, value) => {
      const map = mapRef.current?.getMap()
      if (!map || !map.getLayer(id)) return

      if (value === null || value === undefined) {
        console.warn(
          `setLayoutProperty called with null/undefined value for property '${prop}' on layer '${id}'`,
        )
        return
      }

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
    [],
  )

  const setFilter = useCallback<MapOperationsAPI["setFilter"]>((id, filter) => {
    const map = mapRef.current?.getMap()
    if (!map || !map.getLayer(id)) return
    try {
      // @ts-expect-error - Dynamic property name doesn't match Mapbox's specific string literal types
      map.setFilter(id, filter)
    } catch (err) {
      console.error(`Failed to set filter for layer '${id}':`, err)
    }
  }, [])

  const project = useCallback<MapOperationsAPI["project"]>((lng, lat) => {
    const map = mapRef.current?.getMap()
    if (!map) {
      console.warn("project called but mapRef is null")
      return null
    }
    try {
      return map.project([lng, lat])
    } catch (err) {
      console.error(`Failed to project coordinates (${lng}, ${lat}):`, err)
      return null
    }
  }, [])

  const setMarkers = useCallback((newMarkers: MarkerProperties[]) => {
    setMarkersState(newMarkers)
  }, [])

  const setMotionChildren = useCallback(
    (element: ReactNode | null, style?: CSSProperties) => {
      setMotionChildrenState(element)
      setMotionChildrenStyle(style)
    },
    [],
  )

  const contextValue = useMemo<MapOperationsAPI>(
    () => ({
      mapRef,
      markers,
      withMap,
      getStyle,
      hasSource,
      hasLayer,
      flyTo,
      fitBounds,
      addSource,
      removeSource,
      addLayer,
      removeLayer,
      setLayerVisibility,
      setLayerProperty,
      setPaintProperty,
      setLayoutProperty,
      setFilter,
      project,
      setMarkers,
      setMotionChildren,
      motionChildren,
      motionChildrenStyle,
    }),
    [
      markers,
      motionChildren,
      motionChildrenStyle,
      withMap,
      getStyle,
      hasSource,
      hasLayer,
      flyTo,
      fitBounds,
      addSource,
      removeSource,
      addLayer,
      removeLayer,
      setLayerVisibility,
      setLayerProperty,
      setPaintProperty,
      setLayoutProperty,
      setFilter,
      project,
      setMarkers,
      setMotionChildren,
    ],
  )

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
