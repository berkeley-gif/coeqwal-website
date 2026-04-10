"use client"

import { useCallback, useEffect } from "react"
import { useScenarioExplorerStore } from "../../scenarioExplorer/store"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import { mapActions, useMapMode, useMapStore } from "../store"

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
 *   switches hydroclimate.
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
    },
    [isMapVisible, buildIdMapping, hydroclimate],
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
