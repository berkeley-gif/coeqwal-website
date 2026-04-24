"use client"

import { useCallback, useEffect } from "react"
import { preload } from "swr"
import { useScenarioExplorerStore } from "../../scenarioExplorer/store"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import { mapActions, useMapMode, useMapStore } from "../store"
import { OUTCOME_LAYER_REGISTRY } from "../config/outcomeLayerRegistry"
import { fetchTierLocationAssignmentsBatch } from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import { HYDROCLIMATE_ID_MAP } from "../../../content/scenarios"

const ALL_HYDROCLIMATES = Object.keys(HYDROCLIMATE_ID_MAP)

// Only multi-value outcomes need prefetching via /locations - single-value
// outcomes are served by SWR and shared with the glyph cache.
const PREFETCHABLE_TIER_CODES: string[] = Object.entries(OUTCOME_LAYER_REGISTRY)
  .filter(([, cfg]) => cfg.requiresIdMatching)
  .map(([, cfg]) => cfg.tierCode)

/**
 * Shared hook for driving map outcome visualizations from any context.
 *
 * Provides two entry points:
 *
 * - `showOnMap(outcomeCode, scenarioId)` - fixed-scenario call (Learn section).
 *   Uses the scenarioId as-is; no hydroclimate tracking.
 *
 * - `showOnMapForGroup(outcomeCode, siblingGroupId)` - hydroclimate-aware call
 *   (list view / explore tools). Resolves the sibling group ID to the current
 *   hydroclimate's scenario ID, and reactively re-resolves when the user
 *   switches hydroclimate. Also eagerly prefetches tier location data for all
 *   hydroclimate variants so subsequent switches are instant.
 */
export function useMapVisualizationAction() {
  const showMap = useScenarioExplorerStore((s) => s.showMap)
  const hydroclimate = useScenarioExplorerStore((s) => s.hydroclimate)
  const selectedScenarios = useScenarioExplorerStore((s) => s.selectedScenarios)
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
   * Warm the SWR cache for ALL outcomes x ALL hydroclimates of a given
   * scenario so subsequent glyph clicks are instant. One batched HTTP
   * request covers every multi-value outcome per scenario, and we preload
   * under the batch cache key so any useTierLocationAssignmentsBatch /
   * useTierLocationAssignments consumer shares the in-flight request.
   */
  const prefetchAllOutcomesForScenario = useCallback(
    (resolvedScenarioId: string, siblingGroupId: string) => {
      const ids = new Set<string>([resolvedScenarioId])
      for (const hc of ALL_HYDROCLIMATES) {
        const mapping = buildIdMapping(hc)
        const resolved = mapping[siblingGroupId]
        if (resolved) ids.add(resolved)
      }
      for (const id of ids) {
        preload(
          CACHE_KEYS.tierLocationsBatch(id, PREFETCHABLE_TIER_CODES),
          () => fetchTierLocationAssignmentsBatch(id, PREFETCHABLE_TIER_CODES),
        ).catch(() => {})
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

  // When the map becomes visible, eagerly prefetch tier location data for
  // all multi-value outcomes x selected scenarios (current hydroclimate
  // only) so the first glyph click is instant. One batched request per
  // scenario covers every multi-value outcome.
  useEffect(() => {
    if (!isMapVisible || selectedScenarios.length === 0) return

    const mapping = buildIdMapping(hydroclimate)
    for (const siblingGroupId of selectedScenarios) {
      const resolvedId = mapping[siblingGroupId] ?? siblingGroupId
      preload(
        CACHE_KEYS.tierLocationsBatch(resolvedId, PREFETCHABLE_TIER_CODES),
        () =>
          fetchTierLocationAssignmentsBatch(
            resolvedId,
            PREFETCHABLE_TIER_CODES,
          ),
      ).catch(() => {})
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
