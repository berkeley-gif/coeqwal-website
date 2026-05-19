"use client"

/**
 * Keeps resilience view aligned with sidebar selection.
 * Runs when selectedScenarios changes, not when the user picks a view manually.
 */

import { useEffect } from "react"
import { useExplorerStore, useResilienceSlice, useWorkspaceSlice } from "../../../store"

export function useResilienceSelectionSync(): void {
  const selectedScenarios = useWorkspaceSlice((s) => s.selectedScenarios)
  const setResilienceView = useResilienceSlice((s) => s.setResilienceView)

  useEffect(() => {
    const hasSelected = selectedScenarios.length > 0
    const view = useExplorerStore.getState().resilienceView
    if (hasSelected && view === "aggregate") {
      setResilienceView("scenario")
    } else if (!hasSelected && view === "scenario") {
      setResilienceView("aggregate")
    }
  }, [selectedScenarios, setResilienceView])
}
