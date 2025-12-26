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
  outcomeUsesMapboxLayers as registryOutcomeUsesMapboxLayers,
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
  /** Tier data for custom rendering (e.g., ReservoirLabels) */
  tierLookup: Record<string, number>
  locationData: Record<
    string,
    { longitude?: number; latitude?: number; location_name?: string }
  >
  /** Current layer type (e.g., "reservoir", "demand-units") */
  layerType: string | null
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
  const outcome =
    mapMode === "learn"
      ? learnOutcome
      : mapMode === "explore"
        ? exploreOutcome
        : null

  const strategy =
    mapMode === "learn"
      ? learnStrategy
      : mapMode === "explore"
        ? exploreStrategy
        : "current-ops"

  // Get config from registry (single source of truth for ALL outcomes)
  const config: OutcomeLayerConfig | null = outcome
    ? getOutcomeConfig(outcome)
    : null

  // Only enable for Mapbox-based outcomes (not react-marker)
  const isMapboxBased = config ? config.geometryType !== "react-marker" : false

  // Whether visualization should be active
  const enabled =
    !!outcome &&
    !!config &&
    isMapboxBased &&
    (mapMode === "learn" || mapMode === "explore")

  // Skip camera control in Explore mode ONLY for multi-feature outcomes
  // (useTierMapData handles camera for those via TierMarkers)
  // For single-feature Mapbox outcomes (requiresIdMatching: false), we handle camera here
  const skipCameraControl =
    mapMode === "explore" && config?.requiresIdMatching !== false

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

  // For single-feature outcomes (requiresIdMatching: false), don't require featureIds
  const hasDataOrSingleFeature =
    featureIds.length > 0 || config?.requiresIdMatching === false

  // 2. Apply layer styling (using the new unified styling hook)
  const { clear } = useMapboxLayerStyling({
    config: enabled ? config : null,
    tierLookup,
    featureIds,
    enabled: enabled && hasDataOrSingleFeature,
  })

  // 3. Handle tooltip state (using the new unified tooltip hook)
  const { hoveredFeature, pinnedFeature, clearPinned } = useLayerTooltip({
    config: enabled ? config : null,
    tierLookup,
    locationData,
    enabled: enabled && hasDataOrSingleFeature,
  })

  // Camera control (zoom to appropriate level)
  // Works in Learn mode for all outcomes, and in Explore mode for single-feature outcomes
  useEffect(() => {
    if (!enabled || skipCameraControl || !hasDataOrSingleFeature) return

    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()
      // Use config's defaultZoom if specified, otherwise default to 6.5
      const targetZoom = config?.defaultZoom ?? 6.5
      // Use config's defaultCenter if specified, otherwise keep current center
      const targetCenter = config?.defaultCenter
        ? { lng: config.defaultCenter[0], lat: config.defaultCenter[1] }
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
  }, [enabled, skipCameraControl, hasDataOrSingleFeature, outcome, config, mapAPI, mapMode])

  return {
    isLoading,
    error,
    featureCount,
    hoveredFeature,
    pinnedFeature,
    clearPinned,
    clear,
    tierLookup,
    locationData,
    layerType: config?.layerType || null,
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

/**
 * Check if an outcome uses Mapbox layers (polygon, line, or point)
 * as opposed to React-rendered markers
 */
export function outcomeUsesMapboxLayers(outcome: string): boolean {
  return registryOutcomeUsesMapboxLayers(outcome)
}
