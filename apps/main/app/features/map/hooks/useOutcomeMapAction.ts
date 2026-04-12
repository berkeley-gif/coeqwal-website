"use client"

import { useCallback } from "react"
import { useMapVisualizationAction } from "./useMapVisualizationAction"
import { useActiveMapOutcome } from "./useActiveMapOutcome"
import { getOutcomeCode } from "../../../content/outcomes"
import type { OutcomeVisualization } from "../store"

/**
 * Unified hook for triggering map outcome visualizations and checking
 * active-outcome state from any explore tool (list view, radar, etc.).
 *
 * Composes useMapVisualizationAction + useActiveMapOutcome into a single
 * clean API so consumers don't need to wire multiple hooks or duplicate
 * the siblingGroupId fallback logic.
 */
export function useOutcomeMapAction() {
  const { showOnMapForGroup, isMapVisible } = useMapVisualizationAction()
  const activeOutcome = useActiveMapOutcome()

  /**
   * Trigger (or toggle off) a map visualization for an outcome + scenario.
   * Accepts either an outcome short code ("CWS_DEL") or a display name
   * ("Community water system deliveries") — the display name is resolved
   * to a code automatically.
   */
  const showOutcomeOnMap = useCallback(
    (outcomeCodeOrName: string, scenarioId: string) => {
      if (!isMapVisible) return
      const code = getOutcomeCode(outcomeCodeOrName) ?? outcomeCodeOrName
      showOnMapForGroup(code, scenarioId)
    },
    [isMapVisible, showOnMapForGroup],
  )

  /**
   * Check whether a specific outcome + scenario pair is the currently
   * active map visualization. Uses siblingGroupId when available so the
   * match stays stable across hydroclimate changes.
   */
  const isOutcomeActive = useCallback(
    (outcomeCode: string, scenarioId: string): boolean => {
      if (!isMapVisible || !activeOutcome) return false
      const identity = activeOutcome.siblingGroupId ?? activeOutcome.scenarioId
      return (
        activeOutcome.outcomeCode === outcomeCode && identity === scenarioId
      )
    },
    [isMapVisible, activeOutcome],
  )

  return {
    showOutcomeOnMap,
    isOutcomeActive,
    isMapVisible,
    activeOutcome,
  } satisfies {
    showOutcomeOnMap: (outcomeCodeOrName: string, scenarioId: string) => void
    isOutcomeActive: (outcomeCode: string, scenarioId: string) => boolean
    isMapVisible: boolean
    activeOutcome: OutcomeVisualization | null
  }
}
