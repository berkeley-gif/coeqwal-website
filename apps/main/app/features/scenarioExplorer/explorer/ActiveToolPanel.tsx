"use client"

/**
 * ActiveToolPanel - single exploreMode switch for chart controls + panel.
 *
 * Each tool pairs its controls and panel inside ToolErrorBoundary
 * so a crash in one tool does not take down the unified tool view (i.e. all the other tools).
 */

import type { ReactNode } from "react"

import { Box } from "@repo/ui/mui"
import type { ExploreMode } from "./store"
import {
  DataExplorerView,
  EquityChartControls,
  EquityPanel,
  ListView,
  RadarChartControls,
  RadarPanel,
  ResilienceChartControls,
  ResiliencePanel,
} from "./tools"
import ToolErrorBoundary from "./ToolErrorBoundary"
import type { ExploreHover } from "./useExploreHoverCoordination"
import type { ExploreShareCapture } from "./useExploreShareCapture"

type ActiveToolPanelProps = {
  exploreMode: ExploreMode
  hover: ExploreHover
  share: ExploreShareCapture
  onRadarScenarioColors: (colors: Record<string, string>) => void
}

function ToolIsland({
  controls,
  panel,
}: {
  controls?: ReactNode
  panel: ReactNode
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {controls ? <Box sx={{ flexShrink: 0 }}>{controls}</Box> : null}
      <Box sx={{ flex: 1, overflow: "hidden" }}>{panel}</Box>
    </Box>
  )
}

export default function ActiveToolPanel({
  exploreMode,
  hover,
  share,
  onRadarScenarioColors,
}: ActiveToolPanelProps) {
  switch (exploreMode) {
    case "list":
      return (
        <ToolErrorBoundary tool="list">
          <ToolIsland
            panel={<ListView highlightedIds={hover.highlightedIds} />}
          />
        </ToolErrorBoundary>
      )
    case "radar":
      return (
        <ToolErrorBoundary tool="radar">
          <ToolIsland
            controls={<RadarChartControls share={share.radar} />}
            panel={
              <RadarPanel
                highlightedIds={hover.highlightedIds}
                onChartHover={hover.onChartHover}
                onScenarioColors={onRadarScenarioColors}
                {...share.radar.panelProps}
              />
            }
          />
        </ToolErrorBoundary>
      )
    case "equity":
      return (
        <ToolErrorBoundary tool="equity">
          <ToolIsland
            controls={<EquityChartControls share={share.equity} />}
            panel={
              <EquityPanel
                highlightedIds={hover.highlightedIds}
                onChartHover={hover.onChartHover}
              />
            }
          />
        </ToolErrorBoundary>
      )
    case "resilience":
      return (
        <ToolErrorBoundary tool="resilience">
          <ToolIsland
            controls={<ResilienceChartControls share={share.resilience} />}
            panel={
              <ResiliencePanel
                highlightedIds={hover.highlightedIds}
                onChartHover={hover.onChartHover}
                {...share.resilience.panelProps}
              />
            }
          />
        </ToolErrorBoundary>
      )
    case "data":
      return (
        <ToolErrorBoundary tool="data">
          <ToolIsland panel={<DataExplorerView />} />
        </ToolErrorBoundary>
      )
    default:
      return null
  }
}
