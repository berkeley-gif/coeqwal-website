"use client"

/**
 * DataTourEffects. Mounted by the tour runner only while the Data in Depth
 * tour is active. Two demo effects, both restoring the user's own state
 * when their step ends:
 *
 *  - Expands the variables rail for the step that points at it, so the
 *    anchored card never lands on a collapsed strip.
 *  - Switches the compare axis for the three per-axis selector steps
 *    (select location / select scenario and location / select locations),
 *    so the selector each step highlights is actually on screen.
 *
 * Follows the radar effects pattern: snapshot prior state in a ref on enter,
 * restore from the ref on cleanup, and read current values through
 * `getState()` so the effect does not re-run on the value it just set.
 */

import { useEffect, useRef } from "react"
import { useDataSlice, useExplorerStore } from "../../../../store"
import type { DataCompareBy } from "../../../../store"
import type { TourEffectsProps } from "../../../tour/types"

const RAIL_STEP_ID = "data.step0.rail"

/** Compare axis each selector step demonstrates. */
const AXIS_BY_STEP_ID: Record<string, DataCompareBy> = {
  "data.step1.selectLocation": "scenarios",
  "data.step1.selectScenarioLocation": "climates",
  "data.step1.selectLocations": "locations",
}

export default function DataTourEffects({ step }: TourEffectsProps) {
  const setVariableRailCollapsed = useDataSlice(
    (s) => s.setVariableRailCollapsed,
  )
  const setCompareBy = useDataSlice((s) => s.setCompareBy)
  const railDemoRef = useRef<{ prevCollapsed: boolean } | null>(null)
  const axisDemoRef = useRef<{ prevCompareBy: DataCompareBy } | null>(null)

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

  useEffect(() => {
    if (!step) return
    const axis = AXIS_BY_STEP_ID[step.id]
    if (!axis) return
    const prevCompareBy = useExplorerStore.getState().compareBy
    axisDemoRef.current = { prevCompareBy }
    if (prevCompareBy !== axis) setCompareBy(axis)
    return () => {
      const snap = axisDemoRef.current
      axisDemoRef.current = null
      if (snap && snap.prevCompareBy !== axis) setCompareBy(snap.prevCompareBy)
    }
  }, [step, setCompareBy])

  return null
}
