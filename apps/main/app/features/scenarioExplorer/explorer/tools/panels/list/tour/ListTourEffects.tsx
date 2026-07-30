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

const KEY_OPERATIONS_STEP_IDS = [
  "list.step1.operations",
  "list.step1.operationsIcons",
]

export default function ListTourEffects({ step }: TourEffectsProps) {
  const setShowKeyOperations = useWorkspaceSlice((s) => s.setShowKeyOperations)

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

  return null
}
