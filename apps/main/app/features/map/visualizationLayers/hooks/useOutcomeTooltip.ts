"use client"

/**
 * useOutcomeTooltip - Tooltip local hook state management for outcome visualizations
 * State is ephemeral and clears when outcome changes.
 *
 * Handles mouse events on Mapbox layers and provides tooltip state.
 * 
 * TODO: handle // eslint-disable-next-line @typescript-eslint/no-explicit-any (or is it worth it?)
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useMap } from "@repo/map"
import { getTierLabel } from "../../../../content/tiers"
import type {
  HoveredFeatureInfo,
  TierLocation,
  OutcomeLayerConfig,
  GeometryType,
  LayerType,
} from "../types"

// ============================================================================
// HOOK PROPS & RESULT
// ============================================================================

interface UseOutcomeTooltipProps {
  /** Layer config from registry */
  config: OutcomeLayerConfig | null
  /** Map from feature ID to tier level */
  tierLevelMap: Record<string, number>
  /** Map from feature ID to location data */
  locationData: Record<string, TierLocation>
  /** Whether tooltip events should be enabled */
  enabled: boolean
}

export interface UseOutcomeTooltipResult {
  /** Currently hovered feature */
  hoveredFeature: HoveredFeatureInfo | null
  /** Array of pinned features (click toggles) */
  pinnedFeatures: HoveredFeatureInfo[]
  /** Clear a specific pinned tooltip by featureId */
  clearPinned: (featureId: string) => void
  /** Clear all pinned tooltips */
  clearAllPinned: () => void
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to manage tooltip state for outcome layer interactions
 */
export function useOutcomeTooltip({
  config,
  tierLevelMap,
  locationData,
  enabled,
}: UseOutcomeTooltipProps): UseOutcomeTooltipResult {
  const { mapRef } = useMap()
  const [hoveredFeature, setHoveredFeature] = useState<HoveredFeatureInfo | null>(null)
  const [pinnedFeatures, setPinnedFeatures] = useState<HoveredFeatureInfo[]>([])
  
  // Track recently unpinned features to suppress hover tooltip
  const suppressedFeaturesRef = useRef<Set<string>>(new Set())

  const clearPinned = useCallback((featureId: string) => {
    // Suppress hover tooltip when closing via X button
    suppressedFeaturesRef.current.add(featureId)
    setPinnedFeatures(prev => prev.filter(f => f.featureId !== featureId))
  }, [])

  const clearAllPinned = useCallback(() => {
    setPinnedFeatures([])
  }, [])

  // Clear all pinned when config changes
  useEffect(() => {
    setPinnedFeatures([])
  }, [config])

  // Set up mouse events
  useEffect(() => {
    if (!enabled || !config || !config.mapboxLayerId || !mapRef?.current) {
      setHoveredFeature(null)
      return
    }

    const map = mapRef.current.getMap()
    const {
      mapboxLayerId,
      idProperty,
      geometryType,
      layerType,
      requiresIdMatching,
    } = config

    if (!map.getLayer(mapboxLayerId)) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mouseEnterHandler: ((e: any) => void) | null = null
    let mouseLeaveHandler: (() => void) | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mouseMoveHandler: ((e: any) => void) | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let clickHandler: ((e: any) => void) | null = null
    let mapClickHandler: (() => void) | null = null
    let clickedOnFeature = false

    // Build feature info from event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildFeatureInfo = (e: any): HoveredFeatureInfo | null => {
      if (!e.features || e.features.length === 0) return null

      const feature = e.features[0]
      const props = feature.properties || {}

      // Get feature ID
      const featureId = idProperty ? props[idProperty] : "single-feature"

      // Get tier level
      let tierLevel = 3 // Default for single-feature layers
      if (requiresIdMatching && featureId) {
        tierLevel = tierLevelMap[featureId] || 0
        if (tierLevel === 0) return null // No tier data for this feature
      } else if (Object.keys(tierLevelMap).length > 0) {
        // For single-feature outcomes, use the first (only) tier value
        const firstTier = Object.values(tierLevelMap)[0]
        if (firstTier !== undefined) tierLevel = firstTier
      }

      const locationInfo = featureId ? locationData[featureId] : null
      const [lng, lat] = e.lngLat.toArray()

      return {
        longitude: lng,
        latitude: lat,
        geometryType: geometryType as GeometryType,
        layerType: layerType as LayerType,
        featureId: featureId || "unknown",
        tierLevel,
        tierLabel: getTierLabel(tierLevel),
        locationName: locationInfo?.location_name || props.name || props.Name || null,
        tierValue: locationInfo?.tier_value ?? null,
        properties: props,
        // Demand-units specific fields
        urbName: props.Urb_Name || null,
        modName: props.Mod_Name || null,
        subName: props.Sub_Name || null,
        comments: props.Comments || null,
        type: props.Type || null,
        classType: props.Class || null,
        // WBA specific fields
        hydroRegion: props.HydroRegion || null,
        gisAcres: typeof props.GIS_Acres === "number" ? props.GIS_Acres : null,
      }
    }

    mouseEnterHandler = () => {
      map.getCanvas().style.cursor = "pointer"
    }

    mouseLeaveHandler = () => {
      map.getCanvas().style.cursor = ""
      setHoveredFeature(null)
      // Clear suppression when mouse leaves
      suppressedFeaturesRef.current.clear()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mouseMoveHandler = (e: any) => {
      const info = buildFeatureInfo(e)
      // Don't show hover if feature was just unpinned
      if (info && suppressedFeaturesRef.current.has(info.featureId)) {
        setHoveredFeature(null)
      } else {
        setHoveredFeature(info)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clickHandler = (e: any) => {
      clickedOnFeature = true
      const info = buildFeatureInfo(e)
      if (info) {
        // Toggle: if already pinned, remove it; otherwise add it
        setPinnedFeatures(prev => {
          const existingIndex = prev.findIndex(f => f.featureId === info.featureId)
          if (existingIndex >= 0) {
            // Unpinning: suppress hover tooltip for this feature
            suppressedFeaturesRef.current.add(info.featureId)
            return prev.filter((_, i) => i !== existingIndex)
          } else {
            // Pinning: remove from suppression if it was there
            suppressedFeaturesRef.current.delete(info.featureId)
            return [...prev, info]
          }
        })
      }
      setTimeout(() => {
        clickedOnFeature = false
      }, 100)
    }

    // Clicking on empty map area no longer clears all pinned - user must click X
    mapClickHandler = () => {
      // No-op: tooltips stay pinned until explicitly closed
    }

    map.on("mouseenter", mapboxLayerId, mouseEnterHandler)
    map.on("mouseleave", mapboxLayerId, mouseLeaveHandler)
    map.on("mousemove", mapboxLayerId, mouseMoveHandler)
    map.on("click", mapboxLayerId, clickHandler)
    map.on("click", mapClickHandler)

    return () => {
      if (mouseEnterHandler) map.off("mouseenter", mapboxLayerId, mouseEnterHandler)
      if (mouseLeaveHandler) map.off("mouseleave", mapboxLayerId, mouseLeaveHandler)
      if (mouseMoveHandler) map.off("mousemove", mapboxLayerId, mouseMoveHandler)
      if (clickHandler) map.off("click", mapboxLayerId, clickHandler)
      if (mapClickHandler) map.off("click", mapClickHandler)
      setHoveredFeature(null)
      setPinnedFeatures([])
    }
  }, [enabled, config, tierLevelMap, locationData, mapRef])

  return {
    hoveredFeature,
    pinnedFeatures,
    clearPinned,
    clearAllPinned,
  }
}

