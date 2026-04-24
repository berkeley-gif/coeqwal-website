"use client"

/**
 * ShareRadarLiveChart
 *
 * Small radar thumbnail rendered from live tier data when the share
 * item has no cached PNG. This is the cross-browser replacement for
 * the cached `cachedImageDataUrl` path: URLs can't carry a rasterized
 * radar, so the card re-renders it from the fetched tier data the
 * same way the list-view cards re-render their bar charts.
 *
 * The component is intentionally dumb: parents (SharePanel,
 * ShareDrawer) call `useComparisonData` once, filter the resulting
 * VerticalParallelLineData array by the share item's scenarioIds, and
 * hand the filtered data in as props. That avoids recomputing the
 * 24-scenario parallel-plot array for every card.
 */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { RadarPlot, type VerticalParallelLineData } from "@repo/viz"

export interface ShareRadarLiveChartProps {
  /** Filtered radar data matching the share item's scenarioIds. */
  data: VerticalParallelLineData[]
  /** Visible axes (DISPLAY NAMES, not outcome codes). */
  axes: string[]
  /** Line colors in the same order as `data`. */
  lineColors?: string[]
  /** Baseline scenario from useComparisonData. */
  baselineData?: VerticalParallelLineData | null
  /** Per-axis min/max across all scenarios in the hydroclimate. */
  axisRange?: Record<string, { min: number; max: number }>
  /** Radar-toggle captures from the share item. */
  showRange: boolean
  highlightBaseline: boolean
  showDotsOnly: boolean
  /** Optional fixed size; defaults to a card-friendly square. */
  size?: number
}

const DEFAULT_SIZE = 240

export default function ShareRadarLiveChart({
  data,
  axes,
  lineColors,
  baselineData,
  axisRange,
  showRange,
  highlightBaseline,
  showDotsOnly,
  size = DEFAULT_SIZE,
}: ShareRadarLiveChartProps) {
  const theme = useTheme()

  if (data.length === 0 || axes.length === 0) {
    return (
      <Box
        sx={{
          mt: 1,
          minHeight: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.grey[500],
          fontSize: "0.75rem",
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: "4px",
        }}
      >
        Loading radar chart...
      </Box>
    )
  }

  return (
    <Box
      sx={{
        mt: 1,
        borderRadius: "4px",
        backgroundColor: theme.palette.common.white,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Box sx={{ width: size, height: size, pointerEvents: "none" }}>
        <RadarPlot
          data={data}
          axes={axes}
          baselineData={baselineData ?? undefined}
          responsive
          width={size}
          height={size}
          lineColors={lineColors}
          chosenIds={new Set(data.map((d) => d.id))}
          highlightBaseline={highlightBaseline && !!baselineData}
          showScenarioPath
          showAllPaths={false}
          showTierZones={showRange}
          showDotsOnly={showDotsOnly}
          axisRange={axisRange}
          enableTooltip={false}
        />
      </Box>
    </Box>
  )
}
