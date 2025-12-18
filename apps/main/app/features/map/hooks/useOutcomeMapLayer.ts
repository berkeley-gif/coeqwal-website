/**
 * Hook for displaying outcome data on polygon layers
 *
 * This is the main composition hook that orchestrates:
 * - Data fetching (useTierDataFetch)
 * - Layer styling (useLayerStyling)  
 * - Tooltip state (usePolygonTooltip)
 *
 * It provides a clean interface for map components while delegating
 * specific responsibilities to focused sub-hooks.
 */

import { useEffect } from "react"
import { useMap } from "@repo/map"
import type { MapMode } from "../store"
import {
  getLayerConfig,
  outcomeUsesPolygons as registryOutcomeUsesPolygons,
  type PolygonLayerConfig,
} from "../config/polygonLayers"
import { useTierDataFetch } from "./useTierDataFetch"
import { useLayerStyling } from "./useLayerStyling"
import { usePolygonTooltip, type HoveredFeatureInfo } from "./usePolygonTooltip"

// Re-export types for backward compatibility
export type { HoveredFeatureInfo } from "./usePolygonTooltip"
export type { TierLocationsResponse, TierLocation } from "./useTierDataFetch"

// Re-export fetchTierLocations for components that need direct access
export { fetchTierLocations } from "./useTierDataFetch"

// ============================================================================
// HOOK
// ============================================================================

interface UseOutcomeMapLayerProps {
  /** Learn mode outcome display name (e.g., "Community deliveries") */
  learnOutcome: string | null
  /** Learn mode strategy value (e.g., "current-ops") */
  learnStrategy: string
  /** Explore mode outcome display name */
  exploreOutcome: string | null
  /** Explore mode strategy value */
  exploreStrategy: string
  /** Current map mode - determines which outcome to display */
  mapMode: MapMode
}

interface UseOutcomeMapLayerResult {
  isLoading: boolean
  error: string | null
  featureCount: number
  hoveredFeature: HoveredFeatureInfo | null
  pinnedFeature: HoveredFeatureInfo | null
  clearPinned: () => void
  clear: () => void
}

/**
 * Main hook for polygon layer visualization
 * 
 * Composes useTierDataFetch, useLayerStyling, and usePolygonTooltip
 * to provide a complete solution for polygon-based outcome visualization.
 */
export function useOutcomeMapLayer({
  learnOutcome,
  learnStrategy,
  exploreOutcome,
  exploreStrategy,
  mapMode,
}: UseOutcomeMapLayerProps): UseOutcomeMapLayerResult {
  const mapAPI = useMap()

  // Derive active outcome and strategy based on mapMode
  const outcome = mapMode === "learn" ? learnOutcome 
                : mapMode === "explore" ? exploreOutcome 
                : null
  
  const strategy = mapMode === "learn" ? learnStrategy 
                 : mapMode === "explore" ? exploreStrategy 
                 : "current-ops"

  // Get config from registry (single source of truth)
  const config: PolygonLayerConfig | null = outcome ? getLayerConfig(outcome) : null

  // Whether visualization should be active
  const enabled = !!outcome && !!config && (mapMode === "learn" || mapMode === "explore")

  // Skip camera control in Explore mode (useTierMapData handles it there)
  const skipCameraControl = mapMode === "explore"

  // 1. Fetch tier data
  const {
    tierLookup,
    locationData,
    featureIds,
    featureCount,
    isLoading,
    error,
  } = useTierDataFetch({
    strategy,
    tierCode: config?.tierCode || null,
    enabled,
  })

  // 2. Apply layer styling
  const { clear } = useLayerStyling({
    config,
    tierLookup,
    featureIds,
    enabled: enabled && featureIds.length > 0,
  })

  // 3. Handle tooltip state
  const {
    hoveredFeature,
    pinnedFeature,
    clearPinned,
  } = usePolygonTooltip({
    config,
    tierLookup,
    locationData,
    enabled: enabled && featureIds.length > 0,
  })

  // Camera control for Learn mode (zoom to appropriate level)
  useEffect(() => {
    if (!enabled || skipCameraControl || featureIds.length === 0) return

    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()
      const currentCenter = map.getCenter()
      const targetZoom = 6.5

      console.log(
        `[useOutcomeMapLayer] Zooming to level ${targetZoom} for "${outcome}" (keeping current center)`,
      )
      
      map.easeTo({
        zoom: targetZoom,
        center: currentCenter,
        duration: 1000,
      })
    })
  }, [enabled, skipCameraControl, featureIds.length, outcome, mapAPI])

  return {
    isLoading,
    error,
    featureCount,
    hoveredFeature,
    pinnedFeature,
    clearPinned,
    clear,
  }
}

/**
 * Check if an outcome uses polygon visualization
 * 
 * Re-export from registry for backward compatibility.
 */
export function outcomeUsesPolygons(outcome: string): boolean {
  return registryOutcomeUsesPolygons(outcome)
}
