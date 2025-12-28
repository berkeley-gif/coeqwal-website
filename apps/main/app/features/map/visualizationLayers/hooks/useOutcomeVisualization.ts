"use client"

/**
 * useOutcomeVisualization - Main hook for outcome visualization
 *
 * Provides all data needed to render outcome visualizations on the map.
 * This is the primary public API for the visualizations module.
 *
 * Usage:
 * ```tsx
 * const {
 *   outcome,
 *   tierColorMap,
 *   layerType,
 *   geometryType,
 *   isActive,
 *   isLoading,
 * } = useOutcomeVisualization()
 *
 * {isActive && geometryType === "polygon" && (
 *   <OutcomePolygonLayer tierColorMap={tierColorMap} layerType={layerType} ... />
 * )}
 * ```
 */

import { useEffect, useMemo } from "react"
import { useMap } from "@repo/map"
import { useMapMode, useActiveOutcomeVisualization } from "../../store"
import { useTierData, type UseTierDataResult } from "./useTierData"
import { getOutcomeConfig } from "../../config/outcomeLayerRegistry"
import type { GeometryType, LayerType, OutcomeLayerConfig } from "../types"

// ============================================================================
// HOOK RESULT TYPE
// ============================================================================

export interface UseOutcomeVisualizationResult extends UseTierDataResult {
  /** Currently selected outcome name */
  outcome: string | null
  /** Currently selected scenario ID */
  scenarioId: string
  /** Layer configuration from registry */
  config: OutcomeLayerConfig | null
  /** Geometry type for this outcome */
  geometryType: GeometryType | null
  /** Layer type identifier */
  layerType: LayerType | null
  /** Whether visualization is currently active (outcome selected and map visible) */
  isActive: boolean
  /** Whether this outcome uses Mapbox layers (vs React markers) */
  usesMapboxLayers: boolean
  /** Mapbox layer ID for tooltip interactions */
  mapboxLayerId: string | null
  /** Property name for feature ID matching */
  idProperty: string | null
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Main hook for outcome visualization
 *
 * Reads from the store, fetches tier data, and provides all information
 * needed to render the visualization.
 */
export function useOutcomeVisualization(): UseOutcomeVisualizationResult {
  const mapAPI = useMap()
  const mapMode = useMapMode()
  const activeVisualization = useActiveOutcomeVisualization()

  // Extract outcome and scenarioId from store
  const outcome = activeVisualization?.outcome ?? null
  const scenarioId = activeVisualization?.scenarioId ?? "s0020"

  // Get configuration from registry
  const config = useMemo(
    () => (outcome ? getOutcomeConfig(outcome) : null),
    [outcome],
  )

  // Derived values from config
  const geometryType = config?.geometryType ?? null
  const layerType = config?.layerType ?? null
  const usesMapboxLayers = config ? config.geometryType !== "react-marker" : false
  const mapboxLayerId = config?.mapboxLayerId ?? null
  const idProperty = config?.idProperty ?? null

  // Whether visualization should be active
  const isActive =
    !!outcome &&
    !!config &&
    (mapMode === "learn" || mapMode === "explore")

  // Fetch tier data
  const tierDataResult = useTierData(isActive ? outcome : null, scenarioId)

  // Camera control - zoom to outcome when active
  useEffect(() => {
    if (!isActive || !config) return
    if (!tierDataResult.featureIds.length && config.requiresIdMatching) return

    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      const targetZoom = config.cameraPreset?.zoom ?? 6.5
      const targetLng = config.cameraPreset?.longitude ?? map.getCenter().lng
      const targetLat = config.cameraPreset?.latitude ?? map.getCenter().lat

      // In Explore mode, shift center to account for left panel (50% of viewport)
      const isExplore = mapMode === "explore"

      if (isExplore) {
        // In explore mode: use same camera presets as Learn mode, but zoomed out
        // and with left padding to account for scenario panel
        const exploreZoomOffset = -1 // Zoom out by 1 level for explore view
        const defaultZoom = 5.5
        const defaultCenter = { lng: -120.5, lat: 38.0 } // Central Valley fallback

        // Use camera preset if available, otherwise use defaults
        const zoom = config.cameraPreset
          ? config.cameraPreset.zoom + exploreZoomOffset
          : defaultZoom
        const center = config.cameraPreset
          ? { lng: config.cameraPreset.longitude, lat: config.cameraPreset.latitude }
          : defaultCenter

        // Use padding to account for left panel (same approach as MapInstance.tsx)
        const leftPadding = window.innerWidth / 2
        map.easeTo({
          zoom,
          center,
          padding: { left: leftPadding, top: 100, right: 0, bottom: 20 },
          duration: 1000,
        })
      } else {
        // Learn mode - use preset zoom and center
        map.easeTo({
          zoom: targetZoom,
          center: { lng: targetLng, lat: targetLat },
          duration: 1000,
        })
      }
    })
  }, [
    isActive,
    config,
    tierDataResult.featureIds.length,
    mapAPI,
    mapMode,
    outcome,
  ])

  return {
    outcome,
    scenarioId,
    config,
    geometryType,
    layerType,
    isActive,
    usesMapboxLayers,
    mapboxLayerId,
    idProperty,
    ...tierDataResult,
  }
}

