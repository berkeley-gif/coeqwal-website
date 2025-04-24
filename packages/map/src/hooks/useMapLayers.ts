import { useEffect, useRef } from "react"
import { useMap } from "../context/MapContext"
import type { MapLayerType, StyleValue, SourceSpecification } from "../types"

interface LayerConfig {
  id: string
  source: string
  type: string | MapLayerType
  paint?: Record<string, StyleValue>
  layout?: Record<string, StyleValue>
}

interface SourceConfig {
  id: string
  type: "geojson" | "vector" | "raster" | "image" | "video"
  // Additional properties allowed by the SourceSpecification
  [key: string]: unknown
}

/**
 * Hook for declarative layer management
 *
 * @param layers - Array of layer configurations
 * @param dependencies - Array of dependencies for when to update layers
 * @example
 * ```jsx
 * // Define layers declaratively
 * useMapLayers([
 *   {
 *     id: "rivers-layer",
 *     source: "rivers",
 *     type: "line",
 *     paint: {
 *       "line-color": "#0088cc",
 *       "line-width": 3,
 *       "line-opacity": visible ? 1 : 0
 *     }
 *   }
 * ], [visible]);
 * ```
 */
export function useMapLayers(
  layers: LayerConfig[],
  dependencies: React.DependencyList = [],
) {
  const {
    addLayer,
    removeLayer,
    setPaintProperty,
    setLayoutProperty,
    hasLayer,
  } = useMap()
  const layerIds = useRef<string[]>([])
  
  // Store dependencies in a ref to avoid the ESLint warning
  const depsRef = useRef(dependencies)
  // Update ref when dependencies change
  depsRef.current = dependencies
  
  // Create a stable dependency value that changes when dependencies change
  const depsString = JSON.stringify(depsRef.current)

  useEffect(() => {
    // Track added layers for cleanup
    const addedLayers: string[] = []

    // Add layers
    layers.forEach((layer) => {
      if (!hasLayer(layer.id)) {
        // Add the layer
        addLayer(layer.id, layer.source, layer.type, layer.paint, layer.layout)

        // Track for cleanup
        addedLayers.push(layer.id)
      } else {
        // Update existing layer
        if (layer.paint) {
          Object.entries(layer.paint).forEach(([key, value]) => {
            setPaintProperty(layer.id, key, value)
          })
        }

        if (layer.layout) {
          Object.entries(layer.layout).forEach(([key, value]) => {
            setLayoutProperty(layer.id, key, value)
          })
        }
      }
    })

    // Store all tracked layers
    layerIds.current = [...layerIds.current, ...addedLayers]

    // Cleanup on unmount or dependencies change
    return () => {
      addedLayers.forEach((id) => {
        removeLayer(id)

        // Remove from tracking
        layerIds.current = layerIds.current.filter((layerId) => layerId !== id)
      })
    }
  }, [
    layers,
    addLayer,
    removeLayer,
    setPaintProperty,
    setLayoutProperty,
    hasLayer,
    // Use a dependency that changes when any of the external dependencies change
    depsString
  ])

  return layerIds.current
}

/**
 * Hook for declarative source management
 *
 * @param sources - Array of source configurations
 * @param dependencies - Array of dependencies for when to update sources
 * @example
 * ```jsx
 * // Define sources declaratively
 * useMapSources([
 *   {
 *     id: "rivers",
 *     type: "geojson",
 *     data: "/data/rivers.json"
 *   }
 * ], []);
 * ```
 */
export function useMapSources(
  sources: SourceConfig[],
  dependencies: React.DependencyList = [],
) {
  const { addSource, removeSource, hasSource } = useMap()
  const sourceIds = useRef<string[]>([])
  
  // Store dependencies in a ref to avoid the ESLint warning
  const depsRef = useRef(dependencies)
  // Update ref when dependencies change
  depsRef.current = dependencies
  
  // Create a stable dependency value that changes when dependencies change
  const depsString = JSON.stringify(depsRef.current)

  useEffect(() => {
    // Track added sources for cleanup
    const addedSources: string[] = []

    // Add sources
    sources.forEach((source) => {
      if (!hasSource(source.id)) {
        // Extract relevant properties for the source configuration
        const { id, ...sourceConfig } = source

        // Add the source
        addSource(id, sourceConfig as SourceSpecification)

        // Track for cleanup
        addedSources.push(id)
      }
    })

    // Store all tracked sources
    sourceIds.current = [...sourceIds.current, ...addedSources]

    // Cleanup on unmount or dependencies change
    return () => {
      // We must remove sources in reverse order of how they were added
      // to avoid dependency issues (layers using sources)
      ;[...addedSources].reverse().forEach((id) => {
        removeSource(id)

        // Remove from tracking
        sourceIds.current = sourceIds.current.filter(
          (sourceId) => sourceId !== id,
        )
      })
    }
  }, [sources, addSource, removeSource, hasSource, depsString])

  return sourceIds.current
}
