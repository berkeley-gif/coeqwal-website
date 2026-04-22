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

import { useEffect, useMemo, useRef } from "react"
import { useMap } from "@repo/map"
import {
  useMapMode,
  useActiveOutcomeVisualization,
  useExplorePanelWidth,
} from "../../store"
import { useTierData, type UseTierDataResult } from "./useTierData"
import { getOutcomeConfig } from "../../config/outcomeLayerRegistry"
import { EXPLORE_BOUNDS } from "../../MapInstance"
import { resolveOutcomeCamera } from "../../config/resolveOutcomeCamera"
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
  const explorePanelWidth = useExplorePanelWidth()

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
    !!outcome &&
    !!config &&
    (mapMode === "learn" || mapMode === "explore" || mapMode === "get-started")

  // Fetch tier data (using outcomeCode)
  const tierDataResult = useTierData(isActive ? outcomeCode : null, scenarioId)

  // Track whether we previously had an active visualization so we can
  // return to the overview when the user deselects an outcome.
  const wasActiveRef = useRef(false)

  // Camera control - zoom to camera preset on outcome click, return to
  // overview on deselect. In explore mode, all easeTo/fitBounds calls
  // include left padding so the camera centers within the visible strip.
  useEffect(() => {
    if (mapMode === "get-started") return

    const isExplore = mapMode === "explore"
    const leftPadding = isExplore
      ? window.innerWidth * (explorePanelWidth / 100) + 10
      : 0
    const explorePad = {
      left: leftPadding,
      top: isExplore ? 20 : 0,
      right: isExplore ? 10 : 0,
      bottom: isExplore ? 60 : 0,
    }

    // Visualization just deactivated → return to overview
    if (!isActive && wasActiveRef.current) {
      wasActiveRef.current = false
      if (isExplore) {
        mapAPI.withMap((mapRef) => {
          mapRef.fitBounds(EXPLORE_BOUNDS, {
            padding: explorePad,
            maxZoom: 10,
            duration: 1000,
          })
        })
      }
      return
    }

    if (!isActive || !config) return
    if (!tierDataResult.featureIds.length && config.requiresIdMatching) return

    wasActiveRef.current = true

    const action = resolveOutcomeCamera(outcomeCode!, mapMode, explorePad)

    mapAPI.withMap((mapRef) => {
      if (action.type === "fitBounds") {
        mapRef.fitBounds(action.bounds, {
          padding: action.padding,
          maxZoom: action.maxZoom,
          duration: action.duration,
        })
      } else {
        mapRef.getMap().easeTo({
          center: action.center,
          zoom: action.zoom,
          padding: action.padding,
          duration: action.duration,
        })
      }
    })
  }, [
    isActive,
    config,
    tierDataResult.featureIds.length,
    mapAPI,
    mapMode,
    outcomeCode,
    outcome,
    explorePanelWidth,
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
