"use client"

/**
 * Capture-mode wrapper for BoxPlot: pre-binds `interactive=false` and
 * `responsive=false` so off-screen capture hosts render a single
 * listener-free frame at a fixed size. Pair with `OffscreenCaptureHost`.
 */

import React from "react"
import BoxPlot, { type BoxPlotProps } from "./BoxPlot"

export type BoxPlotSnapshotProps = Omit<
  BoxPlotProps,
  "interactive" | "responsive"
>

const BoxPlotSnapshot: React.FC<BoxPlotSnapshotProps> = (props) => {
  return <BoxPlot {...props} interactive={false} responsive={false} />
}

BoxPlotSnapshot.displayName = "BoxPlotSnapshot"

export default BoxPlotSnapshot
