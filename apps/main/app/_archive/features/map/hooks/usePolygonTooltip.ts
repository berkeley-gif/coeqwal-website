/**
 * Hook for managing polygon tooltip state and mouse events
 * 
 * Responsibilities:
 * - Track hovered feature (follows mouse)
 * - Track pinned feature (click to pin, click away to dismiss)
 * - Register/cleanup Mapbox mouse event handlers
 * - Build feature info from Mapbox events and API data
 */

import { useState, useEffect, useCallback } from "react"
import { useMap } from "@repo/map"
import { getTierLabel } from "../../../content/tiers"
import type { PolygonLayerConfig, LayerType } from "../config/polygonLayers"
import type { TierLocation } from "./useTierDataFetch"
import { getLayerIds } from "../config/polygonLayers"

// ============================================================================
// TYPES
// ============================================================================

/** Base feature info shared by all layer types */
interface BaseFeatureInfo {
  longitude: number
  latitude: number
  featureId: string
  tierLevel: number
  tierLabel: string
  locationName: string | null
  tierValue: number | null
}

/** Demand-units layer feature info */
export interface DemandUnitsFeatureInfo extends BaseFeatureInfo {
  layerType: "demand-units"
  urbName: string | null
  modName: string | null
  subName: string | null
  comments: string | null
  type: string | null
  classType: string | null
}

/** WBA layer feature info */
export interface WBAFeatureInfo extends BaseFeatureInfo {
  layerType: "wba"
  hydroRegion: string | null
  gisAcres: number | null
}

/** Discriminated union for feature info */
export type FeatureInfo = DemandUnitsFeatureInfo | WBAFeatureInfo

/** Legacy interface for backward compatibility */
export interface HoveredFeatureInfo {
  longitude: number
  latitude: number
  layerType: LayerType
  featureId: string
  tierLevel: number
  tierLabel: string
  locationName: string | null
  tierValue: number | null
  // Demand-units specific
  urbName: string | null
  modName: string | null
  subName: string | null
  comments: string | null
  type: string | null
  classType: string | null
  // WBA specific
  hydroRegion: string | null
  gisAcres: number | null
}

// ============================================================================
// HOOK
// ============================================================================

interface UsePolygonTooltipProps {
  /** Layer config from registry */
  config: PolygonLayerConfig | null
  /** Lookup: feature ID -> tier level */
  tierLookup: Record<string, number>
  /** Lookup: feature ID -> full location data */
  locationData: Record<string, TierLocation>
  /** Whether tooltip events should be enabled */
  enabled: boolean
}

interface UsePolygonTooltipResult {
  /** Currently hovered feature (null when not hovering) */
  hoveredFeature: HoveredFeatureInfo | null
  /** Pinned feature (null when not pinned) */
  pinnedFeature: HoveredFeatureInfo | null
  /** Clear the pinned tooltip */
  clearPinned: () => void
}

/**
 * Hook to manage polygon tooltip state and mouse events
 */
export function usePolygonTooltip({
  config,
  tierLookup,
  locationData,
  enabled,
}: UsePolygonTooltipProps): UsePolygonTooltipResult {
  const mapAPI = useMap()
  const [hoveredFeature, setHoveredFeature] = useState<HoveredFeatureInfo | null>(null)
  const [pinnedFeature, setPinnedFeature] = useState<HoveredFeatureInfo | null>(null)

  const clearPinned = useCallback(() => {
    setPinnedFeature(null)
  }, [])

  // Clear pinned tooltip when config changes (switching outcomes)
  useEffect(() => {
    setPinnedFeature(null)
  }, [config])

  // Set up mouse event handlers
  useEffect(() => {
    if (!enabled || !config) {
      setHoveredFeature(null)
      return
    }

    const { fill: layerId } = getLayerIds(config.layerType)
    const { idProperty, layerType } = config

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mouseEnterHandler: ((e: any) => void) | null = null
    let mouseLeaveHandler: (() => void) | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mouseMoveHandler: ((e: any) => void) | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let clickHandler: ((e: any) => void) | null = null
    let mapClickHandler: (() => void) | null = null

    // Track if we clicked on a polygon
    let clickedOnPolygon = false

    // Build feature info from Mapbox event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildFeatureInfo = (e: any): HoveredFeatureInfo | null => {
      if (!e.features || e.features.length === 0) return null

      const feature = e.features[0]
      const props = feature.properties || {}
      const featureId = props[idProperty]
      const tierLevel = tierLookup[featureId] || 0
      const locationInfo = locationData[featureId]

      if (!featureId || tierLevel === 0) return null

      const [lng, lat] = e.lngLat.toArray()

      if (layerType === "wba") {
        return {
          longitude: lng,
          latitude: lat,
          layerType: "wba",
          featureId,
          tierLevel,
          tierLabel: getTierLabel(tierLevel),
          locationName: locationInfo?.location_name || null,
          tierValue: locationInfo?.tier_value ?? null,
          hydroRegion: props.HydroRegion || null,
          gisAcres: props.GIS_Acres ? Number(props.GIS_Acres) : null,
          // Null out demand-units fields
          urbName: null,
          modName: null,
          subName: null,
          comments: null,
          type: null,
          classType: null,
        }
      } else {
        return {
          longitude: lng,
          latitude: lat,
          layerType: "demand-units",
          featureId,
          tierLevel,
          tierLabel: getTierLabel(tierLevel),
          locationName: locationInfo?.location_name || null,
          tierValue: locationInfo?.tier_value ?? null,
          urbName: props.Urb_Name || null,
          modName: props.Mod_Name || null,
          subName: props.Sub_Name || null,
          comments: props.Comments || null,
          type: props.Type || null,
          classType: props.Class || null,
          // Null out WBA fields
          hydroRegion: null,
          gisAcres: null,
        }
      }
    }

    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      if (!map.getLayer(layerId)) return

      // Mouse enter - change cursor
      mouseEnterHandler = () => {
        map.getCanvas().style.cursor = "pointer"
      }

      // Mouse leave - reset cursor and clear hover
      mouseLeaveHandler = () => {
        map.getCanvas().style.cursor = ""
        setHoveredFeature(null)
      }

      // Mouse move - update hovered feature
      mouseMoveHandler = (e) => {
        const info = buildFeatureInfo(e)
        setHoveredFeature(info)
      }

      // Click on polygon - pin the tooltip
      clickHandler = (e) => {
        clickedOnPolygon = true
        const info = buildFeatureInfo(e)
        if (info) {
          setPinnedFeature(info)
        }
        setTimeout(() => {
          clickedOnPolygon = false
        }, 100)
      }

      // Click on map - clear pinned if not clicking polygon
      mapClickHandler = () => {
        if (!clickedOnPolygon) {
          setPinnedFeature(null)
        }
      }

      map.on("mouseenter", layerId, mouseEnterHandler)
      map.on("mouseleave", layerId, mouseLeaveHandler)
      map.on("mousemove", layerId, mouseMoveHandler)
      map.on("click", layerId, clickHandler)
      map.on("click", mapClickHandler)
    })

    return () => {
      mapAPI.withMap((mapRef) => {
        const map = mapRef.getMap()
        if (mouseEnterHandler) map.off("mouseenter", layerId, mouseEnterHandler)
        if (mouseLeaveHandler) map.off("mouseleave", layerId, mouseLeaveHandler)
        if (mouseMoveHandler) map.off("mousemove", layerId, mouseMoveHandler)
        if (clickHandler) map.off("click", layerId, clickHandler)
        if (mapClickHandler) map.off("click", mapClickHandler)
      })
      setHoveredFeature(null)
      setPinnedFeature(null)
    }
  }, [enabled, config, tierLookup, locationData, mapAPI])

  return {
    hoveredFeature,
    pinnedFeature,
    clearPinned,
  }
}
