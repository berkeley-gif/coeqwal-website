"use client"

import { useEffect, useRef } from "react"
import { useExplorerStore, useRadarSlice, useWorkspaceSlice } from "../../store"
import { mapActions, useMapStore } from "../../../../map/store"
import type { OutcomeVisualization } from "../../../../map/store"
import type { TourStep } from "./types"

/**
 * Temporarily mutates explorer UI for tour demo steps, restoring prior
 * store values on step exit.
 */
export function useToolTourDemoEffects(
  step: TourStep | null,
  resolve: (id: string) => Element | null,
  version: number,
  hcIdMapping: Record<string, string | number | null | undefined>,
): void {
  const setShowMap = useWorkspaceSlice((s) => s.setShowMap)
  const showMap = useWorkspaceSlice((s) => s.showMap)
  const setShowKeyOperations = useWorkspaceSlice((s) => s.setShowKeyOperations)
  const setHighlightBaseline = useWorkspaceSlice((s) => s.setHighlightBaseline)
  const setShowAxisSelector = useRadarSlice((s) => s.setShowAxisSelector)
  const setShowRadarRange = useRadarSlice((s) => s.setShowRadarRange)

  const mapDemoRef = useRef<{
    prevShowMap: boolean
    prevActive: OutcomeVisualization | null
    demoFired: boolean
  } | null>(null)

  const opsDemoRef = useRef<{
    prevShowKeyOperations: boolean
  } | null>(null)

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

  const radarRangeDemoRef = useRef<{
    prevShowRadarRange: boolean
  } | null>(null)

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
  }, [step, showMap, resolve, version, hcIdMapping])
}
