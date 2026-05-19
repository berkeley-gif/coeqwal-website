"use client"

/**
 * Resilience share capture: panel ref registration, toolbar/tile/sidebar share.
 */

import { useCallback, useMemo } from "react"
import { useCaptureRef } from "../../../../share/useCaptureRef"
import {
  useExplorerStore,
  useResilienceSlice,
  useWorkspaceSlice,
  selectResilienceControls,
} from "../../../../store"
import type {
  ResilienceCaptureFn,
  ResilienceScenarioSoloCaptureFn,
  ResilienceTileCaptureFn,
} from "../../../../share/capture/types"
import { buildResilienceShareItem } from "../buildResilienceShareItem"

export type ResilienceShareCapture = {
  panelProps: {
    onCaptureReady: (capture: ResilienceCaptureFn) => void
    onCaptureTileReady: (capture: ResilienceTileCaptureFn) => void
    onCaptureScenarioSoloReady: (
      capture: ResilienceScenarioSoloCaptureFn,
    ) => void
    onTileShare: (
      tileId: string,
      options?: { scenarioIdsForShare?: string[] },
    ) => Promise<boolean>
  }
  sidebarProps: {
    onResilienceScenarioShare: (scenarioId: string) => Promise<void>
  }
  chartControlsProps: {
    onSaveSnapshot: () => void
  }
}

export function useResilienceShareCapture(): ResilienceShareCapture {
  const { selectedScenarios, addShareItem } = useWorkspaceSlice()
  const { resilienceVisibleOutcomes } = useResilienceSlice()

  const resilienceCapture = useCaptureRef<ResilienceCaptureFn>()
  const resilienceTileCapture = useCaptureRef<ResilienceTileCaptureFn>()
  const resilienceScenarioSoloCapture =
    useCaptureRef<ResilienceScenarioSoloCaptureFn>()

  const saveSnapshot = useCallback(async () => {
    const result = await resilienceCapture.ref.current?.()
    const item = buildResilienceShareItem({
      id: `resilience-${Date.now()}`,
      controls: selectResilienceControls(useExplorerStore.getState()),
      outcomeCodes: resilienceVisibleOutcomes,
      scenarioIds: [...selectedScenarios],
      result: result ?? null,
    })
    addShareItem(item)
  }, [
    resilienceCapture.ref,
    selectedScenarios,
    resilienceVisibleOutcomes,
    addShareItem,
  ])

  const shareTile = useCallback(
    async (
      tileId: string,
      options?: { scenarioIdsForShare?: string[] },
    ): Promise<boolean> => {
      const result = await resilienceTileCapture.ref.current?.(tileId)
      if (!result) return false
      const item = buildResilienceShareItem({
        id: `resilience-${Date.now()}-${tileId}`,
        controls: selectResilienceControls(useExplorerStore.getState()),
        outcomeCodes: resilienceVisibleOutcomes,
        scenarioIds: options?.scenarioIdsForShare ?? [...selectedScenarios],
        result,
        tileId,
      })
      addShareItem(item)
      return true
    },
    [
      resilienceTileCapture.ref,
      selectedScenarios,
      resilienceVisibleOutcomes,
      addShareItem,
    ],
  )

  const shareScenario = useCallback(
    async (scenarioId: string): Promise<void> => {
      const result =
        await resilienceScenarioSoloCapture.ref.current?.(scenarioId)
      if (!result) return
      const item = buildResilienceShareItem({
        id: `resilience-${Date.now()}-${scenarioId}`,
        controls: selectResilienceControls(useExplorerStore.getState()),
        outcomeCodes: resilienceVisibleOutcomes,
        scenarioIds: [scenarioId],
        result,
        tileId: scenarioId,
      })
      addShareItem(item)
    },
    [
      resilienceScenarioSoloCapture.ref,
      resilienceVisibleOutcomes,
      addShareItem,
    ],
  )

  return useMemo(
    (): ResilienceShareCapture => ({
      panelProps: {
        onCaptureReady: resilienceCapture.register,
        onCaptureTileReady: resilienceTileCapture.register,
        onCaptureScenarioSoloReady: resilienceScenarioSoloCapture.register,
        onTileShare: shareTile,
      },
      sidebarProps: {
        onResilienceScenarioShare: shareScenario,
      },
      chartControlsProps: {
        onSaveSnapshot: () => void saveSnapshot(),
      },
    }),
    [
      resilienceCapture.register,
      resilienceTileCapture.register,
      resilienceScenarioSoloCapture.register,
      shareTile,
      shareScenario,
      saveSnapshot,
    ],
  )
}
