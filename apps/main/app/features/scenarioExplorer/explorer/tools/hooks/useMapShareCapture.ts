"use client"

/**
 * useMapShareCapture - saves what the Explore map panel shows to the Share
 * tray as a `map` item, described exactly as the map caption describes it
 * (getMapSaveRequest). Saving is offered only once the map has finished
 * drawing what is requested. Fails closed: when capture fails, nothing is
 * staged and `error` says why. Side effects: one map repaint per save;
 * appends one share item on success.
 */

import { useCallback, useState } from "react"
import { useMap } from "@repo/map"
import {
  useActiveOutcomeVisualization,
  useDistributionMapSnapshot,
  useMapStore,
  usePaintedVisualization,
} from "../../../../map/store"
import { useExplorerStore, useWorkspaceSlice } from "../../store"
import { captureMapImage } from "../../share/capture/captureMapImage"
import { useScenarioList } from "../../../../scenarios/hooks"
import {
  getMapSaveRequest,
  type MapScenarioInfo,
} from "../chrome/layout/mapFigureSpec"

/** The save request for the stores' current state. Reads the stores. */
function readMapRequest(scenarios: readonly MapScenarioInfo[]) {
  const map = useMapStore.getState()
  return getMapSaveRequest({
    mode: useExplorerStore.getState().exploreMode,
    active: map.activeOutcomeVisualization,
    distribution: map.distributionMapSnapshot,
    scenarios,
  })
}

export function useMapShareCapture(): {
  saveMap: () => Promise<void>
  canSave: boolean
  saving: boolean
  error: string | null
  clearError: () => void
} {
  const { mapRef } = useMap()
  const mapReady = useMapStore((s) => s.mapReady)
  const mode = useWorkspaceSlice((s) => s.exploreMode)
  const addShareItem = useWorkspaceSlice((s) => s.addShareItem)
  const active = useActiveOutcomeVisualization()
  const distribution = useDistributionMapSnapshot()
  const painted = usePaintedVisualization()
  const { scenarios } = useScenarioList()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Gates the button only; the handler re-reads the stores so a stale
  // render can never start or label a capture.
  const request = getMapSaveRequest({ mode, active, distribution, scenarios })
  const canSave =
    mapReady &&
    request.key !== "" &&
    request.hydroclimate !== null &&
    painted?.key === request.key &&
    !saving

  const saveMap = useCallback(async () => {
    const map = mapRef?.current?.getMap()
    const panel = document.querySelector<HTMLElement>(
      "[data-explore-map-panel]",
    )
    if (!map || !panel) {
      setError("The map is not ready yet. Try again in a moment.")
      return
    }
    const request = readMapRequest(scenarios)
    const paintedAtStart = useMapStore.getState().paintedVisualization
    const revisionAtStart = useMapStore.getState().paintRevision
    if (
      !request.key ||
      request.hydroclimate === null ||
      paintedAtStart?.key !== request.key
    ) {
      setError("The map is still drawing. Try again in a moment.")
      return
    }
    const hydroclimate = request.hydroclimate
    setSaving(true)
    try {
      const image = await captureMapImage(map, panel, request.captionText)
      // Anything that changed during the capture (paint, tool, outcome,
      // strategy, hydroclimate, comparison) voids it.
      if (
        useMapStore.getState().paintRevision !== revisionAtStart ||
        useMapStore.getState().paintedVisualization?.key !==
          paintedAtStart.key ||
        JSON.stringify(readMapRequest(scenarios)) !== JSON.stringify(request)
      ) {
        throw new Error("the map changed while saving; try again")
      }
      const id = `map-${crypto.randomUUID()}`
      const drawerWasOpen = useExplorerStore.getState().showShareDrawer
      addShareItem({
        id,
        type: "map",
        tool: request.tool,
        outcomeCodes: request.outcomeCodes,
        scenarioId: request.scenarioId,
        ...(request.scenarioLabel
          ? { scenarioLabel: request.scenarioLabel }
          : {}),
        hydroclimate,
        comparedWithBaseline: request.comparedWithBaseline,
        imageAspect: image.width / image.height,
        capturedAt: new Date().toISOString(),
        cachedImageDataUrl: image.dataUrl,
      })
      // The share tray persists synchronously in a store subscriber. If the
      // browser refused to store it, take the map back out rather than
      // show a card that disappears on reload.
      if (useExplorerStore.getState().sharePersistFailed) {
        useExplorerStore.getState().removeShareItem(id)
        // Adding opened the drawer over the map; put it back so the error
        // below the map caption is seen.
        useExplorerStore.getState().setShowShareDrawer(drawerWasOpen)
        throw new Error(
          "the share tray is full in this browser; remove some cards and try again",
        )
      }
      setError(null)
    } catch (err) {
      // warn, not error: the failure is shown to the user through `error`.
      console.warn("[Share] map capture failed:", err)
      const reason = err instanceof Error ? err.message : "unknown error"
      setError(`Could not save the map image: ${reason}.`)
    } finally {
      setSaving(false)
    }
  }, [mapRef, addShareItem, scenarios])

  const clearError = useCallback(() => setError(null), [])

  return { saveMap, canSave, saving, error, clearError }
}
