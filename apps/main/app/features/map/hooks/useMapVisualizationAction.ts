"use client"

import { useCallback, useEffect } from "react"
import { useScenarioExplorerStore } from "../../scenarioExplorer/store"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import { mapActions, useMapMode, useMapStore } from "../store"
import { OUTCOME_LAYER_REGISTRY } from "../config/outcomeLayerRegistry"
import { fetchTierLocations } from "../visualizationLayers/hooks/useTierData"
import { HYDROCLIMATE_ID_MAP } from "../../../content/scenarios"

const ALL_HYDROCLIMATES = Object.keys(HYDROCLIMATE_ID_MAP)

// Only multi-value outcomes need prefetching via /locations — single-value
// outcomes are served by SWR and shared with the glyph cache.
const PREFETCHABLE_OUTCOMES = Object.entries(OUTCOME_LAYER_REGISTRY)
  .filter(([, cfg]) => cfg.requiresIdMatching)
  .map(([code, cfg]) => ({ code, tierCode: cfg.tierCode }))

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
  const selectedScenarios = useScenarioExplorerStore(
    (s) => s.selectedScenarios,
  )
  const mapMode = useMapMode()
  const isMapVisible =
    showMap || mapMode === "learn" || mapMode === "get-started"

  const { buildIdMapping } = useScenarioList()

  /** Fixed-scenario entry point (Learn section). */
  const showOnMap = useCallback(
    (outcomeCode: string, scenarioId: string) => {
      if (!isMapVisible) return
      const current = useMapStore.getState().activeOutcomeVisualization
      if (!current || current.outcomeCode !== outcomeCode) {
        mapActions.clearMapTooltips()
      }
      mapActions.toggleOutcomeVisualization(outcomeCode, scenarioId)
    },
    [isMapVisible],
  )

  /**
   * Warm the tierLocationCache for ALL outcomes × ALL hydroclimates of a
   * given scenario so that subsequent glyph clicks are instant.
   */
  const prefetchAllOutcomesForScenario = useCallback(
    (resolvedScenarioId: string, siblingGroupId: string) => {
      for (const { tierCode } of PREFETCHABLE_OUTCOMES) {
        fetchTierLocations(resolvedScenarioId, tierCode).catch(() => {})

        for (const hc of ALL_HYDROCLIMATES) {
          const mapping = buildIdMapping(hc)
          const resolvedId = mapping[siblingGroupId]
          if (resolvedId && resolvedId !== resolvedScenarioId) {
            fetchTierLocations(resolvedId, tierCode).catch(() => {})
          }
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

      // Only clear pinned tooltips when the outcome changes. When switching
      // scenarios within the same outcome, tooltips stay and update their
      // tier info reactively.
      const current = useMapStore.getState().activeOutcomeVisualization
      if (!current || current.outcomeCode !== outcomeCode) {
        mapActions.clearMapTooltips()
      }

      mapActions.toggleOutcomeVisualization(
        outcomeCode,
        resolvedId,
        siblingGroupId,
      )
      prefetchAllOutcomesForScenario(resolvedId, siblingGroupId)
    },
    [
      isMapVisible,
      buildIdMapping,
      hydroclimate,
      prefetchAllOutcomesForScenario,
    ],
  )

  const clearMap = useCallback(() => {
    mapActions.clearOutcomeVisualization()
    mapActions.clearMapTooltips()
  }, [])

  // When the map becomes visible, eagerly prefetch tier location data for all
  // multi-value outcomes × selected scenarios (current hydroclimate only) so
  // that the first glyph click is instant.
  useEffect(() => {
    if (!isMapVisible || selectedScenarios.length === 0) return

    const mapping = buildIdMapping(hydroclimate)
    for (const siblingGroupId of selectedScenarios) {
      const resolvedId = mapping[siblingGroupId] ?? siblingGroupId
      for (const { tierCode } of PREFETCHABLE_OUTCOMES) {
        fetchTierLocations(resolvedId, tierCode).catch(() => {})
      }
    }
  }, [isMapVisible, selectedScenarios, hydroclimate, buildIdMapping])

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
