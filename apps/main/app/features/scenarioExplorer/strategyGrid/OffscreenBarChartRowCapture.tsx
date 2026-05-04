"use client"

/**
 * Off-screen capture for a single bar-chart row. Mounts
 * `BarChartRowSnapshot` inside `OffscreenCaptureHost` at fixed
 * dimensions and uses `compose` mode to stitch every per-outcome
 * glyph SVG into one stand-alone composite, mirroring what the
 * live capture path used to do via DOM scraping.
 */

import React from "react"
import { type Theme } from "@repo/ui/mui"
import {
  type ChartDataPoint,
  type OutcomeName,
} from "../../scenarios/components/shared"
import type { OutcomeDisplayMode } from "../store"
import BarChartRowSnapshot from "./BarChartRowSnapshot"
import { offscreenCapture } from "../share/capture/OffscreenCaptureHost"
import { CAPTURE_DIMENSIONS } from "../share/capture/dimensions"

export const BAR_CHART_ROW_CAPTURE_WIDTH = CAPTURE_DIMENSIONS.barChartRow.width
export const BAR_CHART_ROW_CAPTURE_HEIGHT =
  CAPTURE_DIMENSIONS.barChartRow.height

export interface CaptureBarChartRowOffscreenInput {
  outcomeNames: OutcomeName[]
  chartData: Record<string, ChartDataPoint[]>
  viewMode: OutcomeDisplayMode
  theme: Theme
  glyphSize?: number
  width?: number
  height?: number
  backgroundColor?: string
}

export interface CaptureBarChartRowOffscreenResult {
  svg: string
  dataUrl: string
}

export async function captureBarChartRowOffscreen(
  input: CaptureBarChartRowOffscreenInput,
): Promise<CaptureBarChartRowOffscreenResult> {
  // Distribution view stacks a location-label row beneath the glyph
  // grid, so it needs more vertical room than bar / average.
  const defaultHeight =
    input.viewMode === "distribution"
      ? BAR_CHART_ROW_CAPTURE_HEIGHT + 32
      : BAR_CHART_ROW_CAPTURE_HEIGHT
  const width = input.width ?? BAR_CHART_ROW_CAPTURE_WIDTH
  const height = input.height ?? defaultHeight

  return offscreenCapture({
    theme: input.theme,
    width,
    height,
    captureKind: "barChartRow:offscreen",
    mode: "compose",
    backgroundColor: input.backgroundColor,
    render: (onReady) => (
      <BarChartRowSnapshot
        outcomeNames={input.outcomeNames}
        chartData={input.chartData}
        viewMode={input.viewMode}
        glyphSize={input.glyphSize}
        width={width}
        height={height}
        onReady={onReady}
      />
    ),
  })
}
