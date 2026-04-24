"use client"

/**
 * ShareRadarLiveChart
 *
 * Small radar thumbnail rendered from live tier data when the share
 * item has no cached PNG. Props mirror explore `RadarPanel` + `RadarPlot`
 * semantics: `showRadarRange` controls axis min/max shading; `showTierZones`
 * controls the tier band background (stored on the share item or URL).
 */

import React, { useMemo } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import {
  RadarPlot,
  type VerticalParallelLineData,
  mergeRadarAxisLabelDetailStyle,
  type RadarPlotAxisLabelDetailStyle,
} from "@repo/viz"

export interface ShareRadarLiveChartProps {
  /** Filtered radar data matching the share item's scenarioIds. */
  data: VerticalParallelLineData[]
  /** Visible axes (DISPLAY NAMES, not outcome codes). */
  axes: string[]
  /** Line colors in the same order as `data`. */
  lineColors?: string[]
  /** Per-scenario theme keys for `RadarPlot` (matches explore). */
  scenarioThemes: Record<string, string>
  /** Baseline scenario from useComparisonData. */
  baselineData?: VerticalParallelLineData | null
  /** Per-axis min/max across all scenarios in the hydroclimate. */
  axisRange?: Record<string, { min: number; max: number }>
  /** When true, show min/max range shading (explore `showRadarRange`). */
  showRadarRange: boolean
  /** When true, show tier band background (explore `showTierZones`). */
  showTierZones: boolean
  /** Radar-toggle captures from the share item. */
  highlightBaseline: boolean
  showDotsOnly: boolean
  morphGeneration: number
}

export default function ShareRadarLiveChart({
  data,
  axes,
  lineColors,
  scenarioThemes,
  baselineData,
  axisRange,
  showRadarRange,
  showTierZones,
  highlightBaseline,
  showDotsOnly,
  morphGeneration,
}: ShareRadarLiveChartProps) {
  const theme = useTheme()

  const axisLabelDetailStyle = useMemo((): RadarPlotAxisLabelDetailStyle => {
    const axisTypo = theme.typography.axisLabel

    return mergeRadarAxisLabelDetailStyle({
      fontFamily: axisTypo.fontFamily as string,
      scenarioFontSize: axisTypo.fontSize as string,
      scenarioFontWeight: Number(axisTypo.fontWeight),
      scenarioLetterSpacing: axisTypo.letterSpacing as string,
      tierFontSize: theme.typography.compactCaption.fontSize as string,
      tierFontWeight: Number(theme.typography.compactCaption.fontWeight),
      panelFill: theme.palette.common.white,
      panelStroke: "none",
      scenarioFill: "#193D6B",
      tierFill: "#193D6B",
      axisTitleFill: "#193D6B",
      scenarioControlsRowHeightPx: 26,
      scenarioControlsRowGapPx: 4,
    })
  }, [theme])

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

  // Match `ShareRadarCard` cached image layout: `width: 100%`, natural height
  // from a square raster. `RadarPlot` defaults to `containerMinHeight: 400` for
  // the main panel; in a card that forces overflow/clipping, so we pass 0 and
  // give the component a real square from `aspectRatio` (same as explore SVG).
  return (
    <Box
      sx={{
        mt: 1,
        width: "100%",
        position: "relative",
        aspectRatio: "1 / 1",
        borderRadius: "4px",
        backgroundColor: theme.palette.common.white,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <RadarPlot
          data={data}
          axes={axes}
          baselineData={baselineData ?? undefined}
          responsive
          containerMinHeight={0}
          lineColors={lineColors}
          scenarioThemes={scenarioThemes}
          morphGeneration={morphGeneration}
          chosenIds={new Set(data.map((d) => d.id))}
          highlightBaseline={highlightBaseline && !!baselineData}
          showAllPaths
          showScenarioPath
          showTierZones={showTierZones}
          showDotsOnly={showDotsOnly}
          axisRange={showRadarRange ? axisRange : undefined}
          dimUnselected={false}
          dimUnpinned={false}
          tooltipLeftOffset={0}
          enableTooltip={false}
          axisLabelDetailStyle={axisLabelDetailStyle}
        />
      </Box>
    </Box>
  )
}
