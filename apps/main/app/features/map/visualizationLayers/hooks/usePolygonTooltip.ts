"use client"

/**
 * Tooltip management for Mapbox polygon layers (demand-units, WBA, etc.).
 * Sets up mouse event handlers and uses useTooltipState for state.
 */

import { useEffect } from "react"
import { useMap } from "@repo/map"
import { getTierLabel } from "../../../../content/tiers"
import { useTooltipState } from "./useTooltipState"
import type {
  HoveredFeatureInfo,
  TierLocation,
  OutcomeLayerConfig,
  GeometryType,
  LayerType,
} from "../types"

interface UsePolygonTooltipProps {
  config: OutcomeLayerConfig | null
  tierLevelMap: Record<string, number>
  locationData: Record<string, TierLocation>
  enabled: boolean
}

export interface UsePolygonTooltipResult {
  hoveredFeature: HoveredFeatureInfo | null
  pinnedFeatures: HoveredFeatureInfo[]
  clearPinned: (featureId: string) => void
  clearAllPinned: () => void
}

export function usePolygonTooltip({
  config,
  tierLevelMap,
  locationData,
  enabled,
}: UsePolygonTooltipProps): UsePolygonTooltipResult {
  const { mapRef } = useMap()
  const {
    hoveredFeature,
    pinnedFeatures,
    setHovered,
    togglePinned,
    clearPinned,
    clearAllPinned,
    clearSuppression,
    isSuppressed,
  } = useTooltipState()

  useEffect(() => {
    clearAllPinned()
  }, [config, clearAllPinned])

  useEffect(() => {
    if (!enabled || !config || !config.mapboxLayerId || !mapRef?.current) {
      setHovered(null)
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

    /* eslint-disable @typescript-eslint/no-explicit-any */
    let mouseEnterHandler: ((e: any) => void) | null = null
    let mouseLeaveHandler: (() => void) | null = null
    let mouseMoveHandler: ((e: any) => void) | null = null
    let clickHandler: ((e: any) => void) | null = null

    const buildFeatureInfo = (e: any): HoveredFeatureInfo | null => {
      if (!e.features || e.features.length === 0) return null

      const feature = e.features[0]
      const props = feature.properties || {}
      const featureId = idProperty ? props[idProperty] : "single-feature"

      let tierLevel = 3
      if (requiresIdMatching && featureId) {
        tierLevel = tierLevelMap[featureId] || 0
        if (tierLevel === 0) return null
      } else if (Object.keys(tierLevelMap).length > 0) {
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
        urbName: props.Urb_Name || null,
        modName: props.Mod_Name || null,
        subName: props.Sub_Name || null,
        comments: props.Comments || null,
        type: props.Type || null,
        classType: props.Class || null,
        hydroRegion: props.HydroRegion || null,
        gisAcres: typeof props.GIS_Acres === "number" ? props.GIS_Acres : null,
      }
    }

    mouseEnterHandler = () => {
      map.getCanvas().style.cursor = "pointer"
    }

    mouseLeaveHandler = () => {
      map.getCanvas().style.cursor = ""
      setHovered(null)
    }

    mouseMoveHandler = (e: any) => {
      const info = buildFeatureInfo(e)
      setHovered(info)
    }

    clickHandler = (e: any) => {
      const info = buildFeatureInfo(e)
      if (info) togglePinned(info)
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    map.on("mouseenter", mapboxLayerId, mouseEnterHandler)
    map.on("mouseleave", mapboxLayerId, mouseLeaveHandler)
    map.on("mousemove", mapboxLayerId, mouseMoveHandler)
    map.on("click", mapboxLayerId, clickHandler)

    return () => {
      if (mouseEnterHandler) map.off("mouseenter", mapboxLayerId, mouseEnterHandler)
      if (mouseLeaveHandler) map.off("mouseleave", mapboxLayerId, mouseLeaveHandler)
      if (mouseMoveHandler) map.off("mousemove", mapboxLayerId, mouseMoveHandler)
      if (clickHandler) map.off("click", mapboxLayerId, clickHandler)
      clearAllPinned()
    }
  }, [enabled, config, tierLevelMap, locationData, mapRef, setHovered, togglePinned, clearAllPinned])

  return {
    hoveredFeature,
    pinnedFeatures,
    clearPinned,
    clearAllPinned,
  }
}

