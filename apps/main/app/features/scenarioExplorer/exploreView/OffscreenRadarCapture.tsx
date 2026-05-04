"use client"

/**
 * Off-screen radar capture.
 *
 * Thin adapter around the generic `offscreenCapture` host
 * that pre-binds the RadarPlot snapshot. Decouples the radar
 * panel's capture call site from the underlying off-screen
 * pipeline so adding new chart variants does not require touching
 * radar's capture path.
 *
 * The radar-specific job here is: shape the props that
 * `RadarPlotSnapshot` expects, set the right size and capture
 * kind, and prune the `g.axis-label-detail` placeholder if
 * RadarPlot ever re-emits it under capture mode (today it does
 * not, because `interactive=false` skips the placeholder. The
 * pruner is defensive parity).
 */

import React from "react"
import {
  RadarPlotSnapshot,
  type RadarPlotPalette,
  type VerticalParallelLineData,
  type RadarPlotAxisLabelDetailStyle,
} from "@repo/viz"
import { type Theme } from "@repo/ui/mui"
import { offscreenCapture } from "../share/capture/OffscreenCaptureHost"

const DEFAULT_CAPTURE_SIZE = 600

export interface CaptureRadarOffscreenInput {
  data: VerticalParallelLineData[]
  axes: string[]
  lineColors: string[]
  /**
   * Pre-gated by the caller. Pass undefined when the live chart's
   * "show range" toggle is off so the off-screen render mirrors
   * the live state. RadarPlot draws the range band only when this
   * is set.
   */
  axisRange?: Record<string, { min: number; max: number }>
  baselineData?: VerticalParallelLineData
  showTierZones?: boolean
  highlightBaseline?: boolean
  showDotsOnly?: boolean
  axisLabelDetailStyle?: Partial<RadarPlotAxisLabelDetailStyle>
  palette?: Partial<RadarPlotPalette>
  /**
   * MUI theme threaded through ThemeProvider. RadarPlot itself
   * does not call useTheme, but this matches the live-chart
   * mount and future-proofs any theme-aware children.
   */
  theme: Theme
  /** Pixel dimensions of the off-screen render. Default 600x600. */
  width?: number
  height?: number
}

export interface CaptureRadarOffscreenResult {
  /** Serialized SVG string with computed styles inlined. */
  svg: string
  /** PNG data URL produced by rasterizing the cloned SVG. */
  dataUrl: string
}

/**
 * Run a one-shot off-screen radar render and capture the result.
 * Resolves with both the SVG string and a rasterized PNG.
 */
export async function captureRadarOffscreen(
  input: CaptureRadarOffscreenInput,
): Promise<CaptureRadarOffscreenResult> {
  const width = input.width ?? DEFAULT_CAPTURE_SIZE
  const height = input.height ?? DEFAULT_CAPTURE_SIZE

  return offscreenCapture({
    theme: input.theme,
    width,
    height,
    captureKind: "radar:offscreen",
    pruneClone: (clone) => {
      // Defensive: with `interactive=false` the placeholder group
      // is never appended, but pruning here keeps the function
      // correct for any future RadarPlot change that re-introduces
      // it.
      clone
        .querySelectorAll<SVGGElement>("g.axis-label-detail")
        .forEach((g) => g.remove())
    },
    render: (onReady) => (
      <RadarPlotSnapshot
        data={input.data}
        axes={input.axes}
        lineColors={input.lineColors}
        axisRange={input.axisRange}
        baselineData={input.baselineData}
        showTierZones={input.showTierZones}
        highlightBaseline={input.highlightBaseline}
        showDotsOnly={input.showDotsOnly}
        axisLabelDetailStyle={input.axisLabelDetailStyle}
        palette={input.palette}
        width={width}
        height={height}
        containerMinHeight={0}
        onReady={onReady}
      />
    ),
  })
}
