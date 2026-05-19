"use client"

/**
 * Radar share capture: panel ref registration, toolbar snapshot, sidebar capture.
 *
 * RadarPanel registers capture fns on mount. Toolbar and sidebar call them later.
 */

import { useCallback, useMemo, useState } from "react"
import { useCaptureRef } from "../../../share/useCaptureRef"
import type {
  MultiScenarioCaptureFn,
  SingleScenarioCaptureFn,
} from "../../../share/capture/types"

export type RadarShareCapture = {
  canCapture: boolean
  canShareFromSidebar: boolean
  panelProps: {
    onCaptureReady: (capture: () => Promise<void>) => void
    onSingleCaptureReady: (capture: SingleScenarioCaptureFn) => void
    onMultiCaptureReady: (capture: MultiScenarioCaptureFn) => void
    onCanCaptureChange: (canCapture: boolean) => void
    onCanShareFromSidebarChange: (canShare: boolean) => void
  }
  sidebarProps: {
    onCaptureRadarScenario: (
      scenarioId: string,
    ) => ReturnType<SingleScenarioCaptureFn>
    onCaptureRadarScenarios: (
      scenarioIds: string[],
    ) => ReturnType<MultiScenarioCaptureFn>
  }
  chartControlsProps: {
    canCapture: boolean
    onSaveSnapshot: () => void
  }
}

export function useRadarShareCapture(): RadarShareCapture {
  const radarCapture = useCaptureRef<() => Promise<void>>()
  const radarSingleCapture = useCaptureRef<SingleScenarioCaptureFn>()
  const radarMultiCapture = useCaptureRef<MultiScenarioCaptureFn>()

  const [canCapture, setCanCapture] = useState(false)
  const [canShareFromSidebar, setCanShareFromSidebar] = useState(false)

  const captureRadarScenario = useCallback(
    async (scenarioId: string) =>
      radarSingleCapture.ref.current?.(scenarioId) ?? null,
    [radarSingleCapture.ref],
  )

  const captureRadarScenarios = useCallback(
    async (scenarioIds: string[]) =>
      radarMultiCapture.ref.current?.(scenarioIds) ?? null,
    [radarMultiCapture.ref],
  )

  const saveSnapshot = useCallback(() => {
    void radarCapture.ref.current?.()
  }, [radarCapture.ref])

  return useMemo(
    (): RadarShareCapture => ({
      canCapture,
      canShareFromSidebar,
      panelProps: {
        onCaptureReady: radarCapture.register,
        onSingleCaptureReady: radarSingleCapture.register,
        onMultiCaptureReady: radarMultiCapture.register,
        onCanCaptureChange: setCanCapture,
        onCanShareFromSidebarChange: setCanShareFromSidebar,
      },
      sidebarProps: {
        onCaptureRadarScenario: captureRadarScenario,
        onCaptureRadarScenarios: captureRadarScenarios,
      },
      chartControlsProps: {
        canCapture,
        onSaveSnapshot: saveSnapshot,
      },
    }),
    [
      canCapture,
      canShareFromSidebar,
      radarCapture.register,
      radarSingleCapture.register,
      radarMultiCapture.register,
      captureRadarScenario,
      captureRadarScenarios,
      saveSnapshot,
    ],
  )
}
