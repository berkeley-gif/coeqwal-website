"use client"

/**
 * ListTourEffects. Mounted by the tour runner only while the list tour
 * is active. Drives store-side demo behavior for steps that need to
 * preview an action: opening the key-operations column, opening the
 * map, and firing the same outcome visualization a bar-cell click would.
 *
 * Each effect snapshots prior store values in a ref, applies the demo
 * on enter, and restores the prior values on cleanup. Refs avoid
 * re-subscribing to any state the effect itself mutates.
 *
 * For tour-driven side effects that need component-local state (the
 * outcome info tooltip is a local hook inside `StrategyGrid`), see
 * `useListInfoTooltipSync` in this folder. That hook is called from
 * the panel rather than from this effects component.
 */

import { useEffect, useRef } from "react"
import { useExplorerStore, useWorkspaceSlice } from "../../../../store"
import {
  mapActions,
  useMapStore,
  type OutcomeVisualization,
} from "../../../../../../map/store"
import { useResolvedIdMapping } from "../../../../../../scenarios/hooks/useResolvedIdMapping"
import type { TourEffectsProps } from "../../../tour/types"

export default function ListTourEffects({ step, resolve }: TourEffectsProps) {
  const setShowKeyOperations = useWorkspaceSlice((s) => s.setShowKeyOperations)
  const setShowMap = useWorkspaceSlice((s) => s.setShowMap)
  const showMap = useWorkspaceSlice((s) => s.showMap)
  const { idMapping: hcIdMapping } = useResolvedIdMapping()

  // ------------------------------------------------------------------
  // list.step1.operations: ensure the key-operations column is visible
  // while the step is active; restore prior value on exit.
  // ------------------------------------------------------------------

  const opsDemoRef = useRef<{ prevShowKeyOperations: boolean } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "list.step1.operations") return
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
  // list.step4.map: open the map panel, then on next paint fire the
  // same outcome visualization a bar-chart cell click would produce.
  // On exit, restore the previously active visualization (if any) and
  // close the map if it wasn't open before.
  // ------------------------------------------------------------------

  const mapDemoRef = useRef<{
    prevShowMap: boolean
    prevActive: OutcomeVisualization | null
    demoFired: boolean
  } | null>(null)

  useEffect(() => {
    if (!step) return
    if (step.id !== "list.step4.map") return

    const prevShowMap = useExplorerStore.getState().showMap
    const prevActive = useMapStore.getState().activeOutcomeVisualization
    mapDemoRef.current = {
      prevShowMap,
      prevActive,
      demoFired: false,
    }
    if (!prevShowMap) {
      setShowMap(true)
    }

    return () => {
      const snap = mapDemoRef.current
      mapDemoRef.current = null
      if (!snap) return
      if (snap.demoFired) {
        if (snap.prevActive) {
          mapActions.setOutcomeVisualization(
            snap.prevActive.outcomeCode,
            snap.prevActive.scenarioId,
            snap.prevActive.siblingGroupId,
          )
        } else {
          mapActions.clearOutcomeVisualization()
        }
      }
      if (!snap.prevShowMap) {
        setShowMap(false)
      }
    }
  }, [step, setShowMap])

  useEffect(() => {
    if (!step) return
    if (step.id !== "list.step4.map") return
    if (!showMap) return
    if (mapDemoRef.current?.demoFired) return

    const raf = window.requestAnimationFrame(() => {
      if (mapDemoRef.current?.demoFired) return
      const el = resolve("list.outcome.barChart") as HTMLElement | null
      if (!el) return
      const scenarioId = el.dataset.tourScenarioId
      const outcomeCode = el.dataset.tourOutcomeCode
      if (!scenarioId || !outcomeCode) return
      const resolvedId = hcIdMapping[scenarioId]
      if (resolvedId == null) return
      const current = useMapStore.getState().activeOutcomeVisualization
      if (!current || current.outcomeCode !== outcomeCode) {
        mapActions.clearMapTooltips()
      }
      mapActions.setOutcomeVisualization(
        outcomeCode,
        String(resolvedId),
        scenarioId,
      )
      if (mapDemoRef.current) {
        mapDemoRef.current.demoFired = true
      }
    })

    return () => window.cancelAnimationFrame(raf)
  }, [step, showMap, resolve, hcIdMapping])

  return null
}
