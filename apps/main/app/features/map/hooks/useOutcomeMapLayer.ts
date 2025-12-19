/**
 * Hook for displaying outcome data on map layers
 *
 * TODO: This hook maintains backward compatibility with existing callers.
 * Consider migrating callers to use the unified system directly:
 * - getOutcomeConfig() from outcomeLayerRegistry
 * - useMapboxLayerStyling for styling
 * - useLayerTooltip for tooltips
 */

import { useEffect } from "react"
import { useMap } from "@repo/map"
import type { MapMode } from "../store"
import {
  getOutcomeConfig,
  outcomeUsesPolygons as registryOutcomeUsesPolygons,
  type OutcomeLayerConfig,
} from "../config/outcomeLayerRegistry"
import { useTierDataFetch } from "./useTierDataFetch"
import { useMapboxLayerStyling } from "./useMapboxLayerStyling"
import { useLayerTooltip, type HoveredFeatureInfo } from "./useLayerTooltip"

// TODO: These re-exports maintain backward compatibility - callers should import directly from source
export type { HoveredFeatureInfo } from "./useLayerTooltip"
export type { TierLocationsResponse, TierLocation } from "./useTierDataFetch"
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
 * Hook for outcome visualization on map layers
 * 
 * TODO: Migrate callers to use the new registry and sub-hooks directly
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

  // Get config from registry (single source of truth for ALL outcomes)
  const config: OutcomeLayerConfig | null = outcome ? getOutcomeConfig(outcome) : null

  // Only enable for Mapbox-based outcomes (not react-marker)
  const isMapboxBased = config && config.geometryType !== "react-marker"
  
  // Whether visualization should be active
  const enabled = !!outcome && !!config && isMapboxBased && (mapMode === "learn" || mapMode === "explore")

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

  // 2. Apply layer styling (using the new unified styling hook)
  const { clear } = useMapboxLayerStyling({
    config: enabled ? config : null,
    tierLookup,
    featureIds,
    enabled: enabled && featureIds.length > 0,
  })

  // 3. Handle tooltip state (using the new unified tooltip hook)
  const {
    hoveredFeature,
    pinnedFeature,
    clearPinned,
  } = useLayerTooltip({
    config: enabled ? config : null,
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
 * TODO: Callers should use getOutcomeConfig(outcome)?.geometryType === "polygon" directly
 */
export function outcomeUsesPolygons(outcome: string): boolean {
  return registryOutcomeUsesPolygons(outcome)
}
