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
  /** Currently selected strategy */
  strategy: string
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

  // Extract outcome and strategy from store
  const outcome = activeVisualization?.outcome ?? null
  const strategy = activeVisualization?.strategy ?? "current-ops"

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
  const tierDataResult = useTierData(isActive ? outcome : null, strategy)

  // Camera control - zoom to outcome when active
  useEffect(() => {
    if (!isActive || !config) return
    if (!tierDataResult.featureIds.length && config.requiresIdMatching) return

    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      const targetZoom = config.cameraPreset?.zoom ?? 6.5
      const targetCenter = config.cameraPreset
        ? { lng: config.cameraPreset.longitude, lat: config.cameraPreset.latitude }
        : map.getCenter()

      // In Explore mode, account for the left panel (50% of viewport)
      const isExplore = mapMode === "explore"
      const leftPadding = isExplore ? window.innerWidth / 2 : 0

      map.easeTo({
        zoom: targetZoom,
        center: targetCenter,
        duration: 1000,
        padding: isExplore
          ? { left: leftPadding + 100, top: 100, right: 50, bottom: 50 }
          : undefined,
      })
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
    strategy,
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

