"use client"

/**
 * RadarPlotSnapshot
 *
 * Capture-mode wrapper around `RadarPlot`. Pre-binds
 * `interactive=false` and `animate=false` so an off-screen capture
 * host can mount the chart in a known-quiet state without having
 * to know radar's prop names. `onReady` is forwarded so the host
 * can await a clean post-paint frame before serializing the SVG.
 *
 * onReady contract:
 *   The underlying chart MUST fire `onReady` exactly once after
 *   its first render attempt, on every code path - including the
 *   zero-dimension bail-out. The capture host waits on this
 *   signal before serializing; a missed fire shows up as
 *   `onReady did not fire within timeout`.
 *
 * Companion to `ResilienceHeatmapSnapshot`. Together they let
 * `OffscreenCaptureHost` treat capture as a uniform "render this
 * snapshot, await onReady, serialize the svg" flow regardless of
 * which visualization is being captured.
 */

import React from "react"
import RadarPlot, { type RadarPlotProps } from "./RadarPlot"

export type RadarPlotSnapshotProps = Omit<
  RadarPlotProps,
  "interactive" | "animate"
>

const RadarPlotSnapshot: React.FC<RadarPlotSnapshotProps> = (props) => {
  return <RadarPlot {...props} interactive={false} animate={false} />
}

RadarPlotSnapshot.displayName = "RadarPlotSnapshot"

export default RadarPlotSnapshot
