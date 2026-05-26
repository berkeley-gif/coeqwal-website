"use client"

/**
 * RadarTourEffects. Mounted by the tour runner only while the radar
 * tour is active. Drives store-side demo behavior for steps that need
 * to preview a control: opening the axis chooser, flipping the
 * highlight-baseline chip, and flipping the library-range chip.
 *
 * Each effect snapshots prior store values in a ref, applies the demo
 * on enter, and restores the prior values on cleanup. Refs avoid
 * re-subscribing to any state the effect itself mutates.
 *
 * For tour-driven side effects that need component-local state (the
 * outcome info popover is local to `RadarPanel`), see
 * `useRadarInfoIconSync` in this folder. That hook is called from the
 * panel rather than from this effects component.
 */

import { useEffect, useRef } from "react"
import {
  useExplorerStore,
  useRadarSlice,
  useWorkspaceSlice,
} from "../../../../store"
import type { TourEffectsProps } from "../../../tour/types"

export default function RadarTourEffects({ step }: TourEffectsProps) {
  const setShowAxisSelector = useRadarSlice((s) => s.setShowAxisSelector)
  const setShowRadarRange = useRadarSlice((s) => s.setShowRadarRange)
  const setHighlightBaseline = useWorkspaceSlice((s) => s.setHighlightBaseline)

  // ------------------------------------------------------------------
  // radar.step1.axisChooser: open the axis chooser panel.
  // ------------------------------------------------------------------

  const axisSelectorDemoRef = useRef<{
    prevShowAxisSelector: boolean
  } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "radar.step1.axisChooser") return
    const prevShowAxisSelector = useExplorerStore.getState().showAxisSelector
    axisSelectorDemoRef.current = { prevShowAxisSelector }
    if (!prevShowAxisSelector) {
      setShowAxisSelector(true)
    }
    return () => {
      const snap = axisSelectorDemoRef.current
      axisSelectorDemoRef.current = null
      if (!snap) return
      if (!snap.prevShowAxisSelector) {
        setShowAxisSelector(false)
      }
    }
  }, [step, setShowAxisSelector])

  // ------------------------------------------------------------------
  // radar.step1.highlightBaseline: overlay the current-operations
  // baseline scenario.
  // ------------------------------------------------------------------

  const highlightBaselineDemoRef = useRef<{
    prevHighlightBaseline: boolean
  } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "radar.step1.highlightBaseline") return
    const prevHighlightBaseline = useExplorerStore.getState().highlightBaseline
    highlightBaselineDemoRef.current = { prevHighlightBaseline }
    if (!prevHighlightBaseline) {
      setHighlightBaseline(true)
    }
    return () => {
      const snap = highlightBaselineDemoRef.current
      highlightBaselineDemoRef.current = null
      if (!snap) return
      if (!snap.prevHighlightBaseline) {
        setHighlightBaseline(false)
      }
    }
  }, [step, setHighlightBaseline])

  // ------------------------------------------------------------------
  // radar.step1.libraryRange: overlay the library range band.
  // ------------------------------------------------------------------

  const radarRangeDemoRef = useRef<{ prevShowRadarRange: boolean } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "radar.step1.libraryRange") return
    const prevShowRadarRange = useExplorerStore.getState().showRadarRange
    radarRangeDemoRef.current = { prevShowRadarRange }
    if (!prevShowRadarRange) {
      setShowRadarRange(true)
    }
    return () => {
      const snap = radarRangeDemoRef.current
      radarRangeDemoRef.current = null
      if (!snap) return
      if (!snap.prevShowRadarRange) {
        setShowRadarRange(false)
      }
    }
  }, [step, setShowRadarRange])

  return null
}
