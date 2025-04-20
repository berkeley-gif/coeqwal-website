import React, {
  createContext,
  useContext,
  useRef,
  useMemo,
  ReactNode,
} from "react"
import {
  MapboxMapRef,
  MapOperationsAPI,
  ViewState,
  MapSource,
  MapLayerType,
  StyleValue,
  ViewStateTransitionOptions,
} from "../types"

// Create a reusable no-op function
const noop = () => {}

/**
 * Default no-op implementations for the context. These satisfy TypeScript's type requirements
 * while doing nothing when called, which is appropriate since they should only be used
 * through a Provider.
 */
const defaultMapOperations: MapOperationsAPI = {
  mapRef: { current: null as unknown as MapboxMapRef },
  withMap: noop,
  flyTo: noop as MapOperationsAPI["flyTo"],
  fitBounds: noop as MapOperationsAPI["fitBounds"],
  addSource: noop,
  removeSource: noop,
  addLayer: noop,
  removeLayer: noop,
  setLayerVisibility: noop,
  setLayerProperty: noop,
  setPaintProperty: noop,
  setLayoutProperty: noop,
}

// Create context with default values
const MapContext = createContext<MapOperationsAPI>(defaultMapOperations)

interface MapProviderProps {
  children: ReactNode
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const mapRef = useRef<MapboxMapRef>(null as unknown as MapboxMapRef)

  const mapOperations: MapOperationsAPI = useMemo(() => {
    return {
      mapRef,
      withMap: (callback) => {
        if (mapRef.current) {
          try {
            callback(mapRef.current.getMap())
          } catch (error) {
            console.error("Error executing map callback:", error)
          }
        } else {
          console.warn("Map is not initialized")
        }
      },

      /**
       * Implementation of the flyTo method that supports two calling patterns:
       * - With coordinates: flyTo(longitude, latitude, zoom, pitch?, bearing?, transitionOptions?)
       * - With ViewState: flyTo(viewState) - without bounds
       */
      flyTo: (function () {
        // Implementation for coordinates-based flyTo
        function flyToCoordinates(
          longitude: number,
          latitude: number,
          zoom: number,
          pitch?: number,
          bearing?: number,
          transitionOptions?: ViewStateTransitionOptions,
        ): void {
          if (mapRef.current) {
            const map = mapRef.current.getMap()

            map.flyTo({
              center: [longitude, latitude],
              zoom,
              pitch,
              bearing,
              duration: transitionOptions?.duration,
              easing: transitionOptions?.easing,
              essential: transitionOptions?.essential,
            })
          }
        }

        // Implementation for ViewState-based flyTo
        function flyToViewState(viewState: Omit<ViewState, "bounds">): void {
          if (mapRef.current) {
            const map = mapRef.current.getMap()
            const options = viewState.transitionOptions || {}

            map.flyTo({
              center: [viewState.longitude, viewState.latitude],
              zoom: viewState.zoom,
              pitch: viewState.pitch,
              bearing: viewState.bearing,
              duration: options.duration,
              easing: options.easing,
              essential: options.essential,
            })
          }
        }

        // Router function that dispatches to the appropriate implementation
        return function (
          arg1: number | Omit<ViewState, "bounds">,
          arg2?: number,
          arg3?: number,
          arg4?: number | ViewStateTransitionOptions,
          arg5?: number,
          arg6?: ViewStateTransitionOptions,
        ) {
          // ViewState pattern
          if (typeof arg1 === "object") {
            return flyToViewState(arg1)
          }
          // Coordinates pattern
          else if (
            typeof arg1 === "number" &&
            typeof arg2 === "number" &&
            typeof arg3 === "number"
          ) {
            // Handle different signature variations
            if (typeof arg4 === "number") {
              // Case where arg4 is pitch, arg5 is bearing, arg6 is transitionOptions
              return flyToCoordinates(arg1, arg2, arg3, arg4, arg5, arg6)
            } else {
              // Case where arg4 is transitionOptions (pitch/bearing skipped)
              return flyToCoordinates(
                arg1,
                arg2,
                arg3,
                undefined,
                undefined,
                arg4,
              )
            }
          }
        }
      })() as MapOperationsAPI["flyTo"],

      /**
       * Implementation of the fitBounds method that supports two calling patterns:
       * - With bounds array: fitBounds(bounds, pitch?, bearing?, padding?, transitionOptions?)
       * - With ViewState: fitBounds(viewState) - must include bounds
       */
      fitBounds: (function () {
        // Implementation for bounds array-based fitBounds
        function fitBoundsArray(
          bounds: [[number, number], [number, number]],
          pitch?: number,
          bearing?: number,
          padding?:
            | number
            | { top: number; bottom: number; left: number; right: number },
          transitionOptions?: ViewStateTransitionOptions,
        ): void {
          if (mapRef.current) {
            const map = mapRef.current.getMap()

            map.fitBounds(bounds, {
              padding: padding ?? 50,
              pitch,
              bearing,
              duration: transitionOptions?.duration,
              easing: transitionOptions?.easing,
              essential: transitionOptions?.essential,
            })
          }
        }

        // Implementation for ViewState-based fitBounds
        function fitBoundsViewState(
          viewState: Pick<
            ViewState,
            "bounds" | "pitch" | "bearing" | "transitionOptions"
          >,
        ): void {
          if (mapRef.current && viewState.bounds) {
            const map = mapRef.current.getMap()
            const options = viewState.transitionOptions || {}

            map.fitBounds(viewState.bounds, {
              padding: 50,
              pitch: viewState.pitch,
              bearing: viewState.bearing,
              duration: options.duration,
              easing: options.easing,
              essential: options.essential,
            })
          }
        }

        // Router function that dispatches to the appropriate implementation
        return function (
          arg1:
            | [[number, number], [number, number]]
            | Pick<
                ViewState,
                "bounds" | "pitch" | "bearing" | "transitionOptions"
              >,
          arg2?: number,
          arg3?: number,
          arg4?:
            | number
            | { top: number; bottom: number; left: number; right: number }
            | ViewStateTransitionOptions,
          arg5?: ViewStateTransitionOptions,
        ) {
          // ViewState pattern with bounds
          if (typeof arg1 === "object" && !Array.isArray(arg1)) {
            return fitBoundsViewState(arg1)
          }
          // Bounds array pattern
          else if (
            Array.isArray(arg1) &&
            arg1.length === 2 &&
            Array.isArray(arg1[0]) &&
            Array.isArray(arg1[1])
          ) {
            // Handle different signature variations
            if (
              typeof arg4 === "object" &&
              !Array.isArray(arg4) &&
              arg4 !== null &&
              ("duration" in arg4 || "easing" in arg4 || "essential" in arg4)
            ) {
              // Case where arg4 is transitionOptions (padding skipped)
              return fitBoundsArray(arg1, arg2, arg3, undefined, arg4)
            } else {
              // Standard case or case where arg4 is padding, arg5 is transitionOptions
              return fitBoundsArray(arg1, arg2, arg3, arg4 as any, arg5)
            }
          }
        }
      })() as MapOperationsAPI["fitBounds"],

      addSource: (id, source) => {
        if (mapRef.current) {
          const map = mapRef.current.getMap()
          if (!map.getSource(id)) {
            map.addSource(id, { id, ...source } as any)
          }
        }
      },

      removeSource: (id) => {
        if (mapRef.current) {
          const map = mapRef.current.getMap()
          if (map.getSource(id)) {
            // Remove all layers that use this source first
            map.getStyle().layers.forEach((layer) => {
              if (layer.source === id) {
                map.removeLayer(layer.id)
              }
            })
            map.removeSource(id)
          }
        }
      },

      addLayer: (id, source, type, paint = {}, layout = {}) => {
        if (mapRef.current) {
          const map = mapRef.current.getMap()
          if (!map.getLayer(id)) {
            map.addLayer({
              id,
              type,
              source,
              paint,
              layout,
            } as any)
          }
        }
      },

      removeLayer: (id) => {
        if (mapRef.current) {
          const map = mapRef.current.getMap()
          if (map.getLayer(id)) {
            map.removeLayer(id)
          }
        }
      },

      setLayerVisibility: (id, visible) => {
        if (mapRef.current) {
          const map = mapRef.current.getMap()
          if (map.getLayer(id)) {
            map.setLayoutProperty(
              id,
              "visibility",
              visible ? "visible" : "none",
            )
          }
        }
      },

      setLayerProperty: (id, property, value) => {
        if (mapRef.current) {
          const map = mapRef.current.getMap()
          if (map.getLayer(id)) {
            try {
              // Try setting as a paint property first
              map.setPaintProperty(id, property as any, value)
            } catch (e) {
              try {
                // If that fails, try as a layout property
                map.setLayoutProperty(id, property as any, value)
              } catch (error) {
                console.error(
                  `Failed to set property ${property} on layer ${id}:`,
                  error,
                )
              }
            }
          }
        }
      },

      setPaintProperty: (id, property, value) => {
        if (mapRef.current) {
          const map = mapRef.current.getMap()
          if (map.getLayer(id)) {
            map.setPaintProperty(id, property as any, value)
          }
        }
      },

      setLayoutProperty: (id, property, value) => {
        if (mapRef.current) {
          const map = mapRef.current.getMap()
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, property as any, value)
          }
        }
      },
    }
  }, [])

  return (
    <MapContext.Provider value={mapOperations}>{children}</MapContext.Provider>
  )
}

// Custom hook for accessing map operations
export const useMapContext = (): MapOperationsAPI => {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider")
  }
  return context
}

export default MapContext
