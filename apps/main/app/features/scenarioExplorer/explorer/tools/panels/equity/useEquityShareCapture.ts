"use client"

/**
 * Equity share capture: offscreen capture + stageShareItem (no panel refs).
 */

import { useCallback, useMemo } from "react"
import { useTheme } from "@repo/ui/mui"
import { BASELINE_SCENARIO_ID } from "../../../../constants"
import { stageShareItem } from "../../../share/stage"
import { useWorkspaceSlice, useEquitySlice } from "../../../store"
import { captureEquityOffscreen } from "./OffscreenEquityCapture"

export type EquityShareCapture = {
  sidebarProps: {
    onEquityScenarioShare: (scenarioId: string) => void
  }
  chartControlsProps: {
    onSaveSnapshot: () => void
  }
}

export function useEquityShareCapture(): EquityShareCapture {
  const theme = useTheme()
  const { equityFocusScenario, hydroclimate, addShareItem } =
    useWorkspaceSlice()
  const { equityVisibleOutcomes, showEquityComparison } = useEquitySlice()

  const stageEquityShareItem = useCallback(
    async (scenarioId: string) =>
      stageShareItem({
        capture: () =>
          captureEquityOffscreen({
            scenarioId,
            compareToBaseline: showEquityComparison,
            theme,
          }),
        buildItem: (captured) => ({
          id: `equity-${scenarioId}-${Date.now()}`,
          type: "equity",
          scenarioId,
          outcomeCodes: equityVisibleOutcomes,
          compareToBaseline: showEquityComparison,
          hydroclimate,
          cachedSvg: captured?.svg,
          cachedImageDataUrl: captured?.dataUrl,
          cachedChartData: captured?.chartData as
            | Record<string, unknown>
            | undefined,
        }),
        addItem: addShareItem,
        errorLabel: "useEquityShareCapture.captureEquityOffscreen",
      }),
    [
      equityVisibleOutcomes,
      showEquityComparison,
      hydroclimate,
      addShareItem,
      theme,
    ],
  )

  const saveSnapshot = useCallback(() => {
    const focused = equityFocusScenario ?? BASELINE_SCENARIO_ID
    if (!focused) return
    void stageEquityShareItem(focused)
  }, [equityFocusScenario, stageEquityShareItem])

  const shareScenario = useCallback(
    (scenarioId: string) => {
      void stageEquityShareItem(scenarioId)
    },
    [stageEquityShareItem],
  )

  return useMemo(
    (): EquityShareCapture => ({
      sidebarProps: {
        onEquityScenarioShare: shareScenario,
      },
      chartControlsProps: {
        onSaveSnapshot: saveSnapshot,
      },
    }),
    [shareScenario, saveSnapshot],
  )
}
