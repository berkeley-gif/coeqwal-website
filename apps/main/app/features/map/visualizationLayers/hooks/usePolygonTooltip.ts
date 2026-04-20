"use client"

/**
 * Tooltip management for Mapbox polygon layers (demand-units, WBA, etc.).
 * Sets up mouse event handlers and uses useTooltipState for state.
 */

import { useEffect, useMemo, useRef } from "react"
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
  } = useTooltipState()

  // Clear pinned tooltips when the outcome changes (different layer config).
  // Scenario/hydroclimate changes keep tooltips - tier info updates reactively.
  useEffect(() => {
    clearAllPinned()
  }, [config, clearAllPinned])

  // Refs so mouse event handlers always read the latest tier data without
  // the effect needing to re-run (which would tear down and clear tooltips).
  const tierLevelMapRef = useRef(tierLevelMap)
  tierLevelMapRef.current = tierLevelMap
  const locationDataRef = useRef(locationData)
  locationDataRef.current = locationData

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
    const buildFeatureInfo = (e: any): HoveredFeatureInfo | null => {
      if (!e.features || e.features.length === 0) return null

      const feature = e.features[0]
      const props = feature.properties || {}
      const featureId = idProperty ? props[idProperty] : "single-feature"
      const currentTierMap = tierLevelMapRef.current
      const currentLocationData = locationDataRef.current

      let tierLevel = 3
      if (requiresIdMatching && featureId) {
        tierLevel = currentTierMap[featureId] || 0
        if (tierLevel === 0) return null
      } else if (Object.keys(currentTierMap).length > 0) {
        const firstTier = Object.values(currentTierMap)[0]
        if (firstTier !== undefined) tierLevel = firstTier
      }

      const locationInfo = featureId ? currentLocationData[featureId] : null
      const [lng, lat] = e.lngLat.toArray()

      return {
        longitude: lng,
        latitude: lat,
        geometryType: geometryType as GeometryType,
        layerType: layerType as LayerType,
        featureId: featureId || "unknown",
        tierLevel,
        tierLabel: getTierLabel(tierLevel),
        locationName:
          locationInfo?.location_name || props.name || props.Name || null,
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

    const mouseEnterHandler = () => {
      map.getCanvas().style.cursor = "pointer"
    }

    const mouseLeaveHandler = () => {
      map.getCanvas().style.cursor = ""
      setHovered(null)
    }

    const mouseMoveHandler = (e: any) => {
      const info = buildFeatureInfo(e)
      setHovered(info)
    }

    const clickHandler = (e: any) => {
      const info = buildFeatureInfo(e)
      if (info) togglePinned(info)
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    map.on("mouseenter", mapboxLayerId, mouseEnterHandler)
    map.on("mouseleave", mapboxLayerId, mouseLeaveHandler)
    map.on("mousemove", mapboxLayerId, mouseMoveHandler)
    map.on("click", mapboxLayerId, clickHandler)

    return () => {
      map.off("mouseenter", mapboxLayerId, mouseEnterHandler)
      map.off("mouseleave", mapboxLayerId, mouseLeaveHandler)
      map.off("mousemove", mapboxLayerId, mouseMoveHandler)
      map.off("click", mapboxLayerId, clickHandler)
    }
  }, [enabled, config, mapRef, setHovered, togglePinned])

  // Recompute tier info for pinned features whenever tierLevelMap changes
  // (e.g. scenario or hydroclimate switch) so tooltips stay current.
  const livePinnedFeatures = useMemo(
    () =>
      pinnedFeatures.map((feature) => {
        const currentTier = tierLevelMap[feature.featureId]
        if (currentTier !== undefined && currentTier !== feature.tierLevel) {
          return {
            ...feature,
            tierLevel: currentTier,
            tierLabel: getTierLabel(currentTier),
          }
        }
        return feature
      }),
    [pinnedFeatures, tierLevelMap],
  )

  return {
    hoveredFeature,
    pinnedFeatures: livePinnedFeatures,
    clearPinned,
    clearAllPinned,
  }
}
