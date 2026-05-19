"use client"

/**
 * ShareRadarLiveChart
 *
 * Small radar thumbnail rendered from live tier data when the share
 * item has no cached PNG. Props mirror explore `RadarPanel` + `RadarPlot`
 * semantics: `showRadarRange` controls axis min/max shading. `showTierZones`
 * controls the tier band background (stored on the share item or URL).
 *
 * Renders at full capture dimensions inside `CapturedSizeFrame` so
 * the URL-restored view scales the same way a cached SVG thumbnail
 * does (uniform CSS scale of the whole chart vs. a responsive
 * re-layout at the card width).
 */

import React, { useMemo } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import {
  RadarPlot,
  type VerticalParallelLineData,
  mergeRadarAxisLabelDetailStyle,
  type RadarPlotAxisLabelDetailStyle,
} from "@repo/viz"
import { useRadarPlotTheme } from "../../tools/panels/radar/useRadarPlotTheme"
import { CAPTURE_DIMENSIONS } from "../capture/dimensions"
import CapturedSizeFrame from "./CapturedSizeFrame"

const RADAR_W = CAPTURE_DIMENSIONS.radar.width
const RADAR_H = CAPTURE_DIMENSIONS.radar.height

export interface ShareRadarLiveChartProps {
  /** Filtered radar data matching the share item's scenarioIds. */
  data: VerticalParallelLineData[]
  /** Visible axes (DISPLAY NAMES, not outcome codes). */
  axes: string[]
  /** Line colors in the same order as `data`. */
  lineColors?: string[]
  /** Baseline scenario from useTierChartData. */
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
  baselineData,
  axisRange,
  showRadarRange,
  showTierZones,
  highlightBaseline,
  showDotsOnly,
  morphGeneration,
}: ShareRadarLiveChartProps) {
  const theme = useTheme()
  const radarPalette = useRadarPlotTheme()

  const axisLabelDetailStyle = useMemo((): RadarPlotAxisLabelDetailStyle => {
    const axisTypo = theme.typography.axisLabel
    const brandNavy = theme.palette.brand.panelDark

    return mergeRadarAxisLabelDetailStyle({
      fontFamily: axisTypo.fontFamily as string,
      scenarioFontSize: axisTypo.fontSize as string,
      scenarioFontWeight: Number(axisTypo.fontWeight),
      scenarioLetterSpacing: axisTypo.letterSpacing as string,
      tierFontSize: theme.typography.compactCaption.fontSize as string,
      tierFontWeight: Number(theme.typography.compactCaption.fontWeight),
      panelFill: theme.palette.common.white,
      panelStroke: "none",
      scenarioFill: brandNavy,
      tierFill: brandNavy,
      axisTitleFill: brandNavy,
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
          borderRadius: theme.borderRadius.sm,
        }}
      >
        Loading radar chart...
      </Box>
    )
  }

  // Render at capture dimensions and let `CapturedSizeFrame` CSS-
  // scale the whole chart down. RadarPlot stays in `responsive` mode
  // (its non-responsive path never initializes `updateChart`); the
  // 600x600 host box is what its internal ResizeObserver picks up,
  // so it lays out at the same size the offscreen capture used.
  return (
    <CapturedSizeFrame
      captureWidth={RADAR_W}
      captureHeight={RADAR_H}
      sx={{
        mt: 1,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.palette.common.white,
      }}
    >
      <Box
        sx={{
          width: `${RADAR_W}px`,
          height: `${RADAR_H}px`,
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
          morphGeneration={morphGeneration}
          chosenIds={new Set(data.map((d) => d.id))}
          highlightBaseline={highlightBaseline && !!baselineData}
          showAllPaths
          showScenarioPath
          showTierZones={showTierZones}
          showDotsOnly={showDotsOnly}
          axisRange={showRadarRange ? axisRange : undefined}
          dimUnselected={false}
          axisLabelDetailStyle={axisLabelDetailStyle}
          palette={radarPalette}
        />
      </Box>
    </CapturedSizeFrame>
  )
}
