"use client"

/**
 * ResilienceTourEffects. Mounted by the tour runner only while the
 * resilience tour is active. Opens the map for the "show map" step and
 * closes it again once the tour moves past that step or is dismissed,
 * matching the spec's "Highlight 'Show map' and open map panel"
 * operation.
 *
 * Same snapshot-in-a-ref/restore-on-cleanup shape as BarTourEffects'
 * map effect.
 */

import { useEffect, useRef } from "react"
import { useExplorerStore, useWorkspaceSlice } from "../../../../store"
import type { TourEffectsProps } from "../../../tour/types"

const MAP_STEP_ID = "resilience.step9.showMap"

export default function ResilienceTourEffects({ step }: TourEffectsProps) {
  const setShowMap = useWorkspaceSlice((s) => s.setShowMap)
  const mapDemoRef = useRef<{ prevShowMap: boolean } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== MAP_STEP_ID) return
    const prevShowMap = useExplorerStore.getState().showMap
    mapDemoRef.current = { prevShowMap }
    if (!prevShowMap) {
      setShowMap(true)
    }
    return () => {
      const snap = mapDemoRef.current
      mapDemoRef.current = null
      if (!snap) return
      if (!snap.prevShowMap) {
        setShowMap(false)
      }
    }
  }, [step, setShowMap])

  return null
}
