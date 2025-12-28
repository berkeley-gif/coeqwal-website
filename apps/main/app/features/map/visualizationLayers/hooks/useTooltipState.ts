"use client"

/**
 * Shared tooltip state: hover, pinned array, and suppression logic.
 * Used by usePolygonTooltip and useMapTooltips.
 */

import { useState, useCallback, useRef } from "react"
import type { HoveredFeatureInfo } from "../types"

export interface UseTooltipStateResult {
  hoveredFeature: HoveredFeatureInfo | null
  pinnedFeatures: HoveredFeatureInfo[]
  setHovered: (feature: HoveredFeatureInfo | null) => void
  togglePinned: (feature: HoveredFeatureInfo) => void
  clearPinned: (featureId: string) => void
  clearAllPinned: () => void
  clearSuppression: () => void
  isSuppressed: (featureId: string) => boolean
}

export function useTooltipState(): UseTooltipStateResult {
  const [hoveredFeature, setHoveredFeature] =
    useState<HoveredFeatureInfo | null>(null)
  const [pinnedFeatures, setPinnedFeatures] = useState<HoveredFeatureInfo[]>([])
  const suppressedFeaturesRef = useRef<Set<string>>(new Set())

  const setHovered = useCallback((feature: HoveredFeatureInfo | null) => {
    if (feature === null) {
      suppressedFeaturesRef.current.clear()
      setHoveredFeature(null)
    } else if (suppressedFeaturesRef.current.has(feature.featureId)) {
      setHoveredFeature(null)
    } else {
      setHoveredFeature(feature)
    }
  }, [])

  const togglePinned = useCallback((feature: HoveredFeatureInfo) => {
    setPinnedFeatures((prev) => {
      const existingIndex = prev.findIndex(
        (f) => f.featureId === feature.featureId,
      )
      if (existingIndex >= 0) {
        // Unpinning: suppress and clear hover to hide tooltip immediately
        suppressedFeaturesRef.current.add(feature.featureId)
        setHoveredFeature(null)
        return prev.filter((_, i) => i !== existingIndex)
      } else {
        suppressedFeaturesRef.current.delete(feature.featureId)
        return [...prev, feature]
      }
    })
  }, [])

  const clearPinned = useCallback((featureId: string) => {
    suppressedFeaturesRef.current.add(featureId)
    setHoveredFeature((prev) => (prev?.featureId === featureId ? null : prev))
    setPinnedFeatures((prev) => prev.filter((f) => f.featureId !== featureId))
  }, [])

  const clearAllPinned = useCallback(() => {
    setPinnedFeatures([])
    suppressedFeaturesRef.current.clear()
  }, [])

  const clearSuppression = useCallback(() => {
    suppressedFeaturesRef.current.clear()
  }, [])

  const isSuppressed = useCallback((featureId: string) => {
    return suppressedFeaturesRef.current.has(featureId)
  }, [])

  return {
    hoveredFeature,
    pinnedFeatures,
    setHovered,
    togglePinned,
    clearPinned,
    clearAllPinned,
    clearSuppression,
    isSuppressed,
  }
}
