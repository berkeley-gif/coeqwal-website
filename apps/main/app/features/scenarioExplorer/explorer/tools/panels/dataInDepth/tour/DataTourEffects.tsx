"use client"

/**
 * DataTourEffects. Mounted by the tour runner only while the Data in Depth
 * tour is active. Expands the variables rail for the step that points at it,
 * so the anchored card never lands on a collapsed strip, and restores the
 * user's own collapsed state when the step ends.
 *
 * Follows the radar effects pattern: snapshot prior state in a ref on enter,
 * restore from the ref on cleanup, and read current values through
 * `getState()` so the effect does not re-run on the value it just set.
 */

import { useEffect, useRef } from "react"
import { useDataSlice, useExplorerStore } from "../../../../store"
import type { TourEffectsProps } from "../../../tour/types"

const RAIL_STEP_ID = "data.step0.rail"

export default function DataTourEffects({ step }: TourEffectsProps) {
  const setVariableRailCollapsed = useDataSlice(
    (s) => s.setVariableRailCollapsed,
  )
  const railDemoRef = useRef<{ prevCollapsed: boolean } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== RAIL_STEP_ID) return
    const prevCollapsed = useExplorerStore.getState().variableRailCollapsed
    railDemoRef.current = { prevCollapsed }
    if (prevCollapsed) setVariableRailCollapsed(false)
    return () => {
      const snap = railDemoRef.current
      railDemoRef.current = null
      if (snap?.prevCollapsed) setVariableRailCollapsed(true)
    }
  }, [step, setVariableRailCollapsed])

  return null
}
