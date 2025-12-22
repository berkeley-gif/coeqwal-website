/**
 * Hook for managing layer tooltip state and mouse events
 *
 * Handles all Mapbox layer types:
 * - Polygons (demand-units, WBA, delta)
 * - Points (salinity compliance points, flow monitoring points)
 * - Lines (rivers)
 */

import { useState, useEffect, useCallback } from "react"
import { useMap } from "@repo/map"
import { getTierLabel } from "../../../content/tiers"
import type { OutcomeLayerConfig } from "../config/outcomeLayerRegistry"
import type { TierLocation } from "./useTierDataFetch"

// ============================================================================
// TYPES
// ============================================================================

/** Feature info for tooltips - supports all layer types */
export interface HoveredFeatureInfo {
  longitude: number
  latitude: number
  /** Geometry type of the source layer */
  geometryType: "polygon" | "point" | "line" | "react-marker"
  /** Layer type identifier */
  layerType: string
  /** Feature ID */
  featureId: string
  /** Tier level (1-5) */
  tierLevel: number
  /** Human-readable tier label */
  tierLabel: string
  /** Location name from API */
  locationName: string | null
  /** Tier value from API */
  tierValue: number | null
  /** Raw Mapbox feature properties */
  properties: Record<string, unknown>

  // Demand-units specific fields
  /** Urban name (from Urb_Name property) */
  urbName?: string | null
  /** Model name (from Mod_Name property) */
  modName?: string | null
  /** Sub name (from Sub_Name property) */
  subName?: string | null
  /** Comments (from Comments property) */
  comments?: string | null
  /** Type (from Type property) */
  type?: string | null
  /** Class type (from Class property) */
  classType?: string | null

  // WBA specific fields
  /** Hydrologic region (from HydroRegion property) */
  hydroRegion?: string | null
  /** GIS area in acres (from GIS_Acres property) */
  gisAcres?: number | null
}

// ============================================================================
// HOOK
// ============================================================================

interface UseLayerTooltipProps {
  /** Layer config from registry */
  config: OutcomeLayerConfig | null
  /** Lookup: feature ID -> tier level */
  tierLookup: Record<string, number>
  /** Lookup: feature ID -> full location data */
  locationData: Record<string, TierLocation>
  /** Whether tooltip events should be enabled */
  enabled: boolean
}

interface UseLayerTooltipResult {
  /** Currently hovered feature */
  hoveredFeature: HoveredFeatureInfo | null
  /** Pinned feature (click-to-pin) */
  pinnedFeature: HoveredFeatureInfo | null
  /** Clear pinned tooltip */
  clearPinned: () => void
}

/**
 * Hook to manage layer tooltip state and mouse events
 */
export function useLayerTooltip({
  config,
  tierLookup,
  locationData,
  enabled,
}: UseLayerTooltipProps): UseLayerTooltipResult {
  const mapAPI = useMap()
  const [hoveredFeature, setHoveredFeature] =
    useState<HoveredFeatureInfo | null>(null)
  const [pinnedFeature, setPinnedFeature] = useState<HoveredFeatureInfo | null>(
    null,
  )

  const clearPinned = useCallback(() => {
    setPinnedFeature(null)
  }, [])

  // Clear pinned when config changes
  useEffect(() => {
    setPinnedFeature(null)
  }, [config])

  // Set up mouse events
  useEffect(() => {
    if (!enabled || !config || !config.mapboxLayerId) {
      setHoveredFeature(null)
      return
    }

    const {
      mapboxLayerId,
      idProperty,
      geometryType,
      layerType,
      requiresIdMatching,
    } = config

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
        tierLevel = tierLookup[featureId] || 0
        if (tierLevel === 0) return null // No tier data for this feature
      }

      const locationInfo = featureId ? locationData[featureId] : null
      const [lng, lat] = e.lngLat.toArray()

      return {
        longitude: lng,
        latitude: lat,
        geometryType,
        layerType,
        featureId: featureId || "unknown",
        tierLevel,
        tierLabel: getTierLabel(tierLevel),
        locationName:
          locationInfo?.location_name || props.name || props.Name || null,
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

    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      if (!map.getLayer(mapboxLayerId)) return

      mouseEnterHandler = () => {
        map.getCanvas().style.cursor = "pointer"
      }

      mouseLeaveHandler = () => {
        map.getCanvas().style.cursor = ""
        setHoveredFeature(null)
      }

      mouseMoveHandler = (e) => {
        const info = buildFeatureInfo(e)
        setHoveredFeature(info)
      }

      clickHandler = (e) => {
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
    })

    return () => {
      mapAPI.withMap((mapRef) => {
        const map = mapRef.getMap()
        if (mouseEnterHandler)
          map.off("mouseenter", mapboxLayerId, mouseEnterHandler)
        if (mouseLeaveHandler)
          map.off("mouseleave", mapboxLayerId, mouseLeaveHandler)
        if (mouseMoveHandler)
          map.off("mousemove", mapboxLayerId, mouseMoveHandler)
        if (clickHandler) map.off("click", mapboxLayerId, clickHandler)
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
