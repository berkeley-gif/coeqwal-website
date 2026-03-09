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
import { CALIFORNIA_CENTERED_VIEW } from "../../config/cameraPresets"
import { getOutcomeName } from "../../../../content/outcomes"
import type { GeometryType, LayerType, OutcomeLayerConfig } from "../types"

// ============================================================================
// HOOK RESULT TYPE
// ============================================================================

export interface UseOutcomeVisualizationResult extends UseTierDataResult {
  /** Currently selected outcome code (canonical identifier) */
  outcomeCode: string | null
  /** Currently selected outcome display name */
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

  // Extract outcomeCode and scenarioId from store
  const outcomeCode = activeVisualization?.outcomeCode ?? null
  const scenarioId = activeVisualization?.scenarioId ?? "s0020"

  // Derive display name from code (for UI display purposes)
  const outcome = outcomeCode ? getOutcomeName(outcomeCode) : null

  // Get configuration from registry by code
  const config = useMemo(
    () => (outcomeCode ? getOutcomeConfig(outcomeCode) : null),
    [outcomeCode],
  )

  // Derived values from config
  const geometryType = config?.geometryType ?? null
  const layerType = config?.layerType ?? null
  const usesMapboxLayers = config
    ? config.geometryType !== "react-marker"
    : false
  const mapboxLayerId = config?.mapboxLayerId ?? null
  const idProperty = config?.idProperty ?? null

  // Whether visualization should be active
  const isActive =
    !!outcome && !!config && (mapMode === "learn" || mapMode === "explore")

  // Fetch tier data (using outcomeCode)
  const tierDataResult = useTierData(isActive ? outcomeCode : null, scenarioId)

  // Camera control - zoom to camera preset (e.g., Delta views) or return to
  // overview when switching to an outcome without a preset.
  useEffect(() => {
    if (!isActive || !config) return
    if (!tierDataResult.featureIds.length && config.requiresIdMatching) return

    const target = config.cameraPreset ?? CALIFORNIA_CENTERED_VIEW

    if (mapMode === "explore") return

    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()
      map.easeTo({
        zoom: target.zoom,
        center: { lng: target.longitude, lat: target.latitude },
        duration: 1000,
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
    outcomeCode,
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
