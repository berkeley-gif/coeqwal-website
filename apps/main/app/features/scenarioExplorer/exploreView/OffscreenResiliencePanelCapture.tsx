"use client"

/**
 * Off-screen panel-wide capture for the resilience heatmap. Mounts
 * `ResiliencePanelChartView` inside `OffscreenCaptureHost` and uses
 * `compose` mode so a small-multiples grid (which has many `<svg>`
 * children) ends up as a single composite SVG. The single-aggregate
 * render also routes through the same path, since compose mode
 * handles a one-svg host correctly.
 *
 * Sizing:
 *   - Aggregate / single-heatmap captures use the fixed
 *     `CAPTURE_DIMENSIONS.resiliencePanel` size.
 *   - Small-multiples captures pass an explicit `height` computed by
 *     `computeResiliencePanelSmallMultiplesCaptureHeight` so every
 *     tile renders into the composite (the live grid uses
 *     `overflowY: auto`, which would otherwise clip below the host).
 *
 * Callers gather the panel's current chart state into the
 * `ResiliencePanelChartViewState` discriminated union and pass it
 * here along with the shared visual props.
 */

import React, { useEffect, useRef } from "react"
import { Box, type Theme } from "@repo/ui/mui"
import ResiliencePanelChartView, {
  type ResiliencePanelChartViewProps,
  type ResiliencePanelChartViewState,
} from "./ResiliencePanelChartView"
import { offscreenCapture } from "../share/capture/OffscreenCaptureHost"
import { CAPTURE_DIMENSIONS } from "../share/capture/dimensions"

export const RESILIENCE_PANEL_CAPTURE_WIDTH =
  CAPTURE_DIMENSIONS.resiliencePanel.width
export const RESILIENCE_PANEL_CAPTURE_HEIGHT =
  CAPTURE_DIMENSIONS.resiliencePanel.height

export interface CaptureResiliencePanelOffscreenInput {
  state: ResiliencePanelChartViewState
  /**
   * Visual props shared across both chart paths. `captureMode` is
   * always set by this host, so callers do not pass it.
   */
  view: Omit<
    ResiliencePanelChartViewProps,
    "state" | "handlers" | "captureMode"
  >
  theme: Theme
  width?: number
  height?: number
  backgroundColor?: string
}

export interface CaptureResiliencePanelOffscreenResult {
  svg: string
  dataUrl: string
}

/**
 * Render the panel chart at the requested dimensions and return the
 * composed SVG plus rasterized PNG. When `height` is omitted, the
 * default fixed panel height is used (right for aggregate captures);
 * small-multiples captures pass an explicit content-aware height.
 *
 * Empty-state captures (no columns / no outcomes) still produce a
 * valid composite (the host bounds with the background fill and any
 * text nodes), which keeps callers from branching on emptiness.
 */
export async function captureResiliencePanelOffscreen(
  input: CaptureResiliencePanelOffscreenInput,
): Promise<CaptureResiliencePanelOffscreenResult> {
  const width = input.width ?? RESILIENCE_PANEL_CAPTURE_WIDTH
  const height = input.height ?? RESILIENCE_PANEL_CAPTURE_HEIGHT

  return offscreenCapture({
    theme: input.theme,
    width,
    height,
    captureKind: "resilience:panel",
    mode: "compose",
    backgroundColor: input.backgroundColor,
    render: (onReady) => (
      <ResiliencePanelHost
        state={input.state}
        view={input.view}
        width={width}
        height={height}
        onReady={onReady}
      />
    ),
  })
}

interface ResiliencePanelHostProps {
  state: ResiliencePanelChartViewState
  view: Omit<
    ResiliencePanelChartViewProps,
    "state" | "handlers" | "captureMode"
  >
  width: number
  height: number
  onReady: () => void
}

/**
 * Wraps `ResiliencePanelChartView` in a fixed-size flex container so
 * the underlying ResilienceHeatmap / SmallMultiples sees a stable
 * available width and height before measurement, then fires `onReady`
 * after the first paint commits.
 */
function ResiliencePanelHost({
  state,
  view,
  width,
  height,
  onReady,
}: ResiliencePanelHostProps) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    const id = requestAnimationFrame(() => onReady())
    return () => cancelAnimationFrame(id)
  }, [onReady])

  return (
    <Box
      sx={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        // Mirrors CAPTURE_OUTER_PADDING in ResiliencePanelChartView so
        // a small-multiples grid sized via the helper has matching
        // breathing room on every side of the rasterized output.
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <ResiliencePanelChartView state={state} captureMode {...view} />
    </Box>
  )
}
