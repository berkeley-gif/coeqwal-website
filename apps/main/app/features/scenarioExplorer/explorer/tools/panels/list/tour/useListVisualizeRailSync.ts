"use client"

/**
 * useListVisualizeRailSync - Tour-driven scenario selection for the
 * VisualizeRail step.
 *
 * VisualizeRail's `active` prop is driven directly by
 * `selectedScenarios.length > 0` (see ListView), not by a flag the tour
 * can override, so highlighting the rail mid-tour requires a real
 * selection rather than a fake "look active" prop. This hook lives next
 * to the rest of the list tour code but is called from `ListView`
 * directly, since that's where `orderedScenarios` and `selectScenarios`
 * already live locally. Mirrors the radar tour's info-icon sync.
 *
 * When the list tour reaches the "visualize data" step, it selects the
 * first ordered scenario if nothing is already selected. It clears that
 * selection again when the step ends or the tour is dismissed. If the
 * user had already selected something for real, this hook never touches
 * it either way.
 */

import { useEffect, useRef } from "react"
import { useWorkspaceSlice } from "../../../../store"
import { LIST_TOUR } from "./steps"

const VISUALIZE_RAIL_STEP_ID = "list.journey"

export function useListVisualizeRailSync(
  firstScenarioId: string | undefined,
  selectedScenarios: string[],
  selectScenarios: (scenarioIds: string[]) => void,
) {
  const listTourStepId = useWorkspaceSlice((s) => {
    if (s.tour.tool !== "list") return null
    return LIST_TOUR[s.tour.step]?.id ?? null
  })
  const selectedByTourRef = useRef(false)

  useEffect(() => {
    const isVisualizeStep = listTourStepId === VISUALIZE_RAIL_STEP_ID
    if (isVisualizeStep) {
      if (selectedScenarios.length === 0 && firstScenarioId) {
        selectScenarios([firstScenarioId])
        selectedByTourRef.current = true
      }
      return
    }
    if (selectedByTourRef.current) {
      selectedByTourRef.current = false
      selectScenarios([])
    }
  }, [listTourStepId, firstScenarioId, selectScenarios, selectedScenarios.length])
}
