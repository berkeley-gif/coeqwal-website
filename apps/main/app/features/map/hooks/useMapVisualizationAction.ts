"use client"

import { useCallback, useEffect } from "react"
import { useScenarioExplorerStore } from "../../scenarioExplorer/store"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import { mapActions, useMapMode, useMapStore } from "../store"
import { getOutcomeConfig } from "../config/outcomeLayerRegistry"
import { fetchTierLocations } from "../visualizationLayers/hooks/useTierData"
import { HYDROCLIMATE_ID_MAP } from "../../../content/scenarios"

const ALL_HYDROCLIMATES = Object.keys(HYDROCLIMATE_ID_MAP)

/**
 * Shared hook for driving map outcome visualizations from any context.
 *
 * Provides two entry points:
 *
 * - `showOnMap(outcomeCode, scenarioId)` — fixed-scenario call (Learn section).
 *   Uses the scenarioId as-is; no hydroclimate tracking.
 *
 * - `showOnMapForGroup(outcomeCode, siblingGroupId)` — hydroclimate-aware call
 *   (list view / explore tools). Resolves the sibling group ID to the current
 *   hydroclimate's scenario ID, and reactively re-resolves when the user
 *   switches hydroclimate. Also eagerly prefetches tier location data for all
 *   hydroclimate variants so subsequent switches are instant.
 */
export function useMapVisualizationAction() {
  const showMap = useScenarioExplorerStore((s) => s.showMap)
  const hydroclimate = useScenarioExplorerStore((s) => s.hydroclimate)
  const mapMode = useMapMode()
  const isMapVisible =
    showMap || mapMode === "learn" || mapMode === "get-started"

  const { buildIdMapping } = useScenarioList()

  /** Fixed-scenario entry point (Learn section). */
  const showOnMap = useCallback(
    (outcomeCode: string, scenarioId: string) => {
      if (!isMapVisible) return
      mapActions.clearMapTooltips()
      mapActions.toggleOutcomeVisualization(outcomeCode, scenarioId)
    },
    [isMapVisible],
  )

  /**
   * Warm the tierLocationCache for every hydroclimate variant of the given
   * sibling group + outcome so that future hydroclimate switches are instant.
   */
  const prefetchSiblingVariants = useCallback(
    (outcomeCode: string, siblingGroupId: string) => {
      const config = getOutcomeConfig(outcomeCode)
      if (!config) return

      for (const hc of ALL_HYDROCLIMATES) {
        const mapping = buildIdMapping(hc)
        const resolvedId = mapping[siblingGroupId]
        if (resolvedId) {
          fetchTierLocations(resolvedId, config.tierCode).catch(() => {})
        }
      }
    },
    [buildIdMapping],
  )

  /** Hydroclimate-aware entry point (list view / explore tools). */
  const showOnMapForGroup = useCallback(
    (outcomeCode: string, siblingGroupId: string) => {
      if (!isMapVisible) return
      const mapping = buildIdMapping(hydroclimate)
      const resolvedId = mapping[siblingGroupId] ?? siblingGroupId
      mapActions.clearMapTooltips()
      mapActions.toggleOutcomeVisualization(
        outcomeCode,
        resolvedId,
        siblingGroupId,
      )
      prefetchSiblingVariants(outcomeCode, siblingGroupId)
    },
    [isMapVisible, buildIdMapping, hydroclimate, prefetchSiblingVariants],
  )

  const clearMap = useCallback(() => {
    mapActions.clearOutcomeVisualization()
    mapActions.clearMapTooltips()
  }, [])

  // Re-resolve the stored scenarioId when hydroclimate changes.
  const activeVisualization = useMapStore((s) => s.activeOutcomeVisualization)

  useEffect(() => {
    if (!activeVisualization?.siblingGroupId) return

    const mapping = buildIdMapping(hydroclimate)
    const newResolvedId = mapping[activeVisualization.siblingGroupId]
    if (newResolvedId && newResolvedId !== activeVisualization.scenarioId) {
      mapActions.setOutcomeVisualization(
        activeVisualization.outcomeCode,
        newResolvedId,
        activeVisualization.siblingGroupId,
      )
    }
  }, [hydroclimate, activeVisualization, buildIdMapping])

  return { showOnMap, showOnMapForGroup, clearMap, isMapVisible }
}
