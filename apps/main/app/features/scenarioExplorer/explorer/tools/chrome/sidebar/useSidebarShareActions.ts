"use client"

/**
 * Share dispatch for ScenarioSelectionSidebar row and theme-header share actions.
 *
 * Capture functions come from `useExploreShareCapture`.
 * This hook turns an icon click into a staged `ShareItem` via `stageShareItem`.
 */

import { useCallback } from "react"
import { useWorkspaceSlice, useRadarSlice } from "../../../store"
import { stageShareItem } from "../../../share/stage"

export type SidebarShareCaptureProps = {
  onCaptureRadarScenario?: (scenarioId: string) => Promise<{
    svg: string
    dataUrl: string
    color: string
    chartData: Record<string, unknown>
  } | null>
  onCaptureRadarScenarios?: (scenarioIds: string[]) => Promise<{
    svg: string
    dataUrl: string
    colors: string[]
    scenarioIds: string[]
    chartData: Record<string, unknown>
  } | null>
  onEquityScenarioShare?: (scenarioId: string) => void | Promise<void>
  onResilienceScenarioShare?: (scenarioId: string) => void | Promise<void>
}

export function useSidebarShareActions({
  scenarioColors,
  onCaptureRadarScenario,
  onCaptureRadarScenarios,
  onEquityScenarioShare,
  onResilienceScenarioShare,
}: SidebarShareCaptureProps & {
  scenarioColors?: Record<string, string>
}) {
  const {
    exploreMode,
    addShareItem,
    outcomeDisplayMode,
    hydroclimate,
    showTierZones,
    highlightBaseline,
  } = useWorkspaceSlice()
  const { radarVisibleAxes, showRadarRange, showDotsOnly } = useRadarSlice()

  const shareScenario = useCallback(
    async (scenarioId: string): Promise<void> => {
      if (exploreMode === "radar") {
        await stageShareItem({
          capture: () =>
            onCaptureRadarScenario?.(scenarioId) ?? Promise.resolve(null),
          buildItem: (captured) => ({
            id: crypto.randomUUID(),
            type: "radar",
            scenarioIds: [scenarioId],
            scenarioColors: captured
              ? [captured.color]
              : scenarioColors
                ? [scenarioColors[scenarioId] ?? "#666666"]
                : undefined,
            axes: [...radarVisibleAxes],
            showRange: showRadarRange,
            showTierZones,
            highlightBaseline,
            showDotsOnly,
            hydroclimate,
            cachedSvg: captured?.svg,
            cachedImageDataUrl: captured?.dataUrl,
            cachedChartData: captured?.chartData,
          }),
          addItem: addShareItem,
          errorLabel: "useSidebarShareActions.shareScenario(radar)",
        })
        return
      }
      if (exploreMode === "equity" && onEquityScenarioShare) {
        await onEquityScenarioShare(scenarioId)
        return
      }
      if (exploreMode === "resilience" && onResilienceScenarioShare) {
        await onResilienceScenarioShare(scenarioId)
        return
      }
      addShareItem({
        id: crypto.randomUUID(),
        type: "barChart",
        scenarioId,
        viewMode: outcomeDisplayMode,
        hydroclimate,
      })
    },
    [
      exploreMode,
      onCaptureRadarScenario,
      onEquityScenarioShare,
      onResilienceScenarioShare,
      addShareItem,
      scenarioColors,
      radarVisibleAxes,
      showRadarRange,
      showTierZones,
      highlightBaseline,
      showDotsOnly,
      hydroclimate,
      outcomeDisplayMode,
    ],
  )

  const shareThemeScenarios = useCallback(
    async (scenarioIds: string[]): Promise<void> => {
      if (scenarioIds.length === 0) return

      if (exploreMode === "radar") {
        const fallbackColors = scenarioColors
          ? scenarioIds.map((sid) => scenarioColors[sid] ?? "#666666")
          : undefined
        await stageShareItem({
          capture: () =>
            onCaptureRadarScenarios?.(scenarioIds) ?? Promise.resolve(null),
          buildItem: (captured) => ({
            id: crypto.randomUUID(),
            type: "radar",
            scenarioIds: captured?.scenarioIds ?? [...scenarioIds],
            scenarioColors: captured?.colors ?? fallbackColors,
            axes: [...radarVisibleAxes],
            showRange: showRadarRange,
            showTierZones,
            highlightBaseline,
            showDotsOnly,
            hydroclimate,
            cachedSvg: captured?.svg,
            cachedImageDataUrl: captured?.dataUrl,
            cachedChartData: captured?.chartData,
          }),
          addItem: addShareItem,
          errorLabel: "useSidebarShareActions.shareThemeScenarios(radar)",
        })
        return
      }

      for (const sid of scenarioIds) {
        await shareScenario(sid)
      }
    },
    [
      exploreMode,
      onCaptureRadarScenarios,
      addShareItem,
      scenarioColors,
      radarVisibleAxes,
      showRadarRange,
      showTierZones,
      highlightBaseline,
      showDotsOnly,
      hydroclimate,
      shareScenario,
    ],
  )

  return { shareScenario, shareThemeScenarios }
}
