"use client"

/**
 * ListTourEffects. Mounted by the tour runner only while the list tour
 * is active. Drives store-side demo behavior for steps that need to
 * preview an action: opening the key-operations column.
 *
 * Each effect snapshots prior store values in a ref, applies the demo
 * on enter, and restores the prior values on cleanup. Refs avoid
 * re-subscribing to any state the effect itself mutates.
 */

import { useEffect, useRef } from "react"
import { useExplorerStore, useWorkspaceSlice } from "../../../../store"
import type { TourEffectsProps } from "../../../tour/types"

const KEY_OPERATIONS_STEP_IDS = ["list.step9.keyOperations", "list.step10.filterByOperation"]

export default function ListTourEffects({ step }: TourEffectsProps) {
  const setShowKeyOperations = useWorkspaceSlice((s) => s.setShowKeyOperations)
  const setShowDefinitions = useWorkspaceSlice((s) => s.setShowDefinitions)

  // ------------------------------------------------------------------
  // list.step1.operations: ensure the key-operations column is visible
  // while the step is active. Restore prior value on exit.
  // ------------------------------------------------------------------

  const opsDemoRef = useRef<{ prevShowKeyOperations: boolean } | null>(null)

  useEffect(() => {
    if (!step) return
    if (!KEY_OPERATIONS_STEP_IDS.includes(step.id)) return
    const prevShowKeyOperations = useExplorerStore.getState().showKeyOperations
    opsDemoRef.current = { prevShowKeyOperations }
    if (!prevShowKeyOperations) {
      setShowKeyOperations(true)
    }
    return () => {
      const snap = opsDemoRef.current
      opsDemoRef.current = null
      if (!snap) return
      if (!snap.prevShowKeyOperations) {
        setShowKeyOperations(false)
      }
    }
  }, [step, setShowKeyOperations])

  // ------------------------------------------------------------------
  // list.step5.definitions / list.step6.baselines: the spec's Operation
  // column says "Hide the detailed definition text" entering Step 5 and
  // "Show the detailed definition text again" entering Step 6 — a
  // two-step before/after demo of the same toggle, each with its own
  // target value (unlike the key-operations effect above, which forces
  // the same value across both of its steps).
  // ------------------------------------------------------------------

  const DEFINITIONS_STEP_TARGETS: Record<string, boolean> = {
    "list.step5.definitions": false,
    "list.step6.baselines": true,
  }

  const defsDemoRef = useRef<{ prevShowDefinitions: boolean } | null>(null)

  useEffect(() => {
    if (!step) return
    const target = DEFINITIONS_STEP_TARGETS[step.id]
    if (target === undefined) return
    const prevShowDefinitions = useExplorerStore.getState().showDefinitions
    defsDemoRef.current = { prevShowDefinitions }
    if (prevShowDefinitions !== target) {
      setShowDefinitions(target)
    }
    return () => {
      const snap = defsDemoRef.current
      defsDemoRef.current = null
      if (!snap) return
      if (snap.prevShowDefinitions !== target) {
        setShowDefinitions(snap.prevShowDefinitions)
      }
    }
  }, [step, setShowDefinitions])

  return null
}

