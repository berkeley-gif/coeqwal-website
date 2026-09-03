"use client"

/**
 * EquityTourEffects. Mounted by the tour runner only while the equity
 * tour is active. Drives store-side demo behavior for steps that need
 * to preview a control: opening the map panel for the "map view" step.
 *
 * Snapshots the prior store value in a ref, applies the demo on enter,
 * and restores the prior value on cleanup. Mirrors RadarTourEffects.
 */

import { useEffect, useRef } from "react"
import { useExplorerStore, useWorkspaceSlice } from "../../../../store"
import type { TourEffectsProps } from "../../../tour/types"

export default function EquityTourEffects({ step }: TourEffectsProps) {
  const setShowMap = useWorkspaceSlice((s) => s.setShowMap)

  // ------------------------------------------------------------------
  // equity.step9.showMap: open the map panel.
  // ------------------------------------------------------------------

  const showMapDemoRef = useRef<{ prevShowMap: boolean } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "equity.step9.showMap") return
    const prevShowMap = useExplorerStore.getState().showMap
    showMapDemoRef.current = { prevShowMap }
    if (!prevShowMap) {
      setShowMap(true)
    }
    return () => {
      const snap = showMapDemoRef.current
      showMapDemoRef.current = null
      if (!snap) return
      if (!snap.prevShowMap) {
        setShowMap(false)
      }
    }
  }, [step, setShowMap])

  return null
}
