"use client"

/**
 * Unified tooltip management combining polygon and point marker sources.
 * Main entry point for VisualizationLayers.
 */

import { useCallback, useMemo } from "react"
import { usePolygonTooltip } from "./usePolygonTooltip"
import { useTooltipState } from "./useTooltipState"
import type {
  HoveredFeatureInfo,
  OutcomeLayerConfig,
  TierLocation,
} from "../types"

interface UseMapTooltipsProps {
  polygonConfig: OutcomeLayerConfig | null
  tierLevelMap: Record<string, number>
  locationData: Record<string, TierLocation>
  polygonEnabled: boolean
}

export interface UseMapTooltipsResult {
  hoveredFeature: HoveredFeatureInfo | null
  pinnedFeatures: HoveredFeatureInfo[]
  isHoveredAlreadyPinned: boolean
  handlePointHover: (feature: HoveredFeatureInfo | null) => void
  handlePointClick: (feature: HoveredFeatureInfo) => void
  clearPinned: (feature: HoveredFeatureInfo) => void
  clearAllPinned: () => void
}

export function useMapTooltips({
  polygonConfig,
  tierLevelMap,
  locationData,
  polygonEnabled,
}: UseMapTooltipsProps): UseMapTooltipsResult {
  const polygon = usePolygonTooltip({
    config: polygonConfig,
    tierLevelMap,
    locationData,
    enabled: polygonEnabled,
  })
  const point = useTooltipState()

  const hoveredFeature = point.hoveredFeature || polygon.hoveredFeature
  const pinnedFeatures = useMemo(
    () => [...point.pinnedFeatures, ...polygon.pinnedFeatures],
    [point.pinnedFeatures, polygon.pinnedFeatures],
  )
  const isHoveredAlreadyPinned = useMemo(
    () =>
      hoveredFeature
        ? pinnedFeatures.some((f) => f.featureId === hoveredFeature.featureId)
        : false,
    [hoveredFeature, pinnedFeatures],
  )

  const handlePointHover = useCallback(
    (feature: HoveredFeatureInfo | null) => point.setHovered(feature),
    [point],
  )
  const handlePointClick = useCallback(
    (feature: HoveredFeatureInfo) => point.togglePinned(feature),
    [point],
  )
  const clearPinned = useCallback(
    (feature: HoveredFeatureInfo) => {
      if (feature.geometryType === "point") {
        point.clearPinned(feature.featureId)
      } else {
        polygon.clearPinned(feature.featureId)
      }
    },
    [point, polygon],
  )
  const clearAllPinned = useCallback(() => {
    point.clearAllPinned()
    polygon.clearAllPinned()
  }, [point, polygon])

  return {
    hoveredFeature,
    pinnedFeatures,
    isHoveredAlreadyPinned,
    handlePointHover,
    handlePointClick,
    clearPinned,
    clearAllPinned,
  }
}
