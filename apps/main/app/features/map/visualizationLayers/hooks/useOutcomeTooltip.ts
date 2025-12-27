"use client"

/**
 * useOutcomeTooltip - Tooltip local hook state management for outcome visualizations
 * State is ephemeral and clears when outcome changes.
 *
 * Handles mouse events on Mapbox layers and provides tooltip state.
 * 
 * TODO: handle // eslint-disable-next-line @typescript-eslint/no-explicit-any (or is it worth it?)
 */

import { useState, useEffect, useCallback } from "react"
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
  /** Pinned feature (click-to-pin) */
  pinnedFeature: HoveredFeatureInfo | null
  /** Clear pinned tooltip */
  clearPinned: () => void
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
  const [pinnedFeature, setPinnedFeature] = useState<HoveredFeatureInfo | null>(null)

  const clearPinned = useCallback(() => {
    setPinnedFeature(null)
  }, [])

  // Clear pinned when config changes
  useEffect(() => {
    setPinnedFeature(null)
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
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mouseMoveHandler = (e: any) => {
      const info = buildFeatureInfo(e)
      setHoveredFeature(info)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clickHandler = (e: any) => {
      clickedOnFeature = true
      const info = buildFeatureInfo(e)
      if (info) {
        setPinnedFeature(info)
      }
      setTimeout(() => {
        clickedOnFeature = false
      }, 100)
    }

    mapClickHandler = () => {
      if (!clickedOnFeature) {
        setPinnedFeature(null)
      }
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
      setPinnedFeature(null)
    }
  }, [enabled, config, tierLevelMap, locationData, mapRef])

  return {
    hoveredFeature,
    pinnedFeature,
    clearPinned,
  }
}

