"use client"

import { useCallback } from "react"
import { useScenarioExplorerStore } from "../../scenarioExplorer/store"
import { mapActions, useMapMode } from "../store"

/**
 * Shared hook for driving map outcome visualizations from any context.
 *
 * Works in both Learn mode (map always visible) and Explore tool views
 * (map toggled via showMap). Encapsulates the toggle-outcome-on-map pattern
 * used by KeyOutcomesPanel, generalized for arbitrary scenario IDs.
 *
 * Usage:
 *   const { showOnMap, clearMap, isMapVisible } = useMapVisualizationAction()
 *   <OutcomeGlyphItem onGlyphClick={() => showOnMap(outcomeCode, scenarioId)} />
 */
export function useMapVisualizationAction() {
  const showMap = useScenarioExplorerStore((s) => s.showMap)
  const mapMode = useMapMode()
  const isMapVisible = showMap || mapMode === "learn" || mapMode === "get-started"

  const showOnMap = useCallback(
    (outcomeCode: string, scenarioId: string) => {
      if (!isMapVisible) return
      mapActions.clearMapTooltips()
      mapActions.toggleOutcomeVisualization(outcomeCode, scenarioId)
    },
    [isMapVisible],
  )

  const clearMap = useCallback(() => {
    mapActions.clearOutcomeVisualization()
    mapActions.clearMapTooltips()
  }, [])

  return { showOnMap, clearMap, isMapVisible }
}
