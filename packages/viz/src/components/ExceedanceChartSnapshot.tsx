"use client"

/**
 * Capture-mode wrapper for ExceedanceChart: pre-binds `interactive=false` and
 * `responsive=false` so off-screen capture hosts render a single
 * listener-free frame at a fixed size. Pair with `OffscreenCaptureHost`.
 */

import React from "react"
import ExceedanceChart, { type ExceedanceChartProps } from "./ExceedanceChart"

export type ExceedanceChartSnapshotProps = Omit<
  ExceedanceChartProps,
  "interactive" | "responsive"
>

const ExceedanceChartSnapshot: React.FC<ExceedanceChartSnapshotProps> = (
  props,
) => {
  return <ExceedanceChart {...props} interactive={false} responsive={false} />
}

ExceedanceChartSnapshot.displayName = "ExceedanceChartSnapshot"

export default ExceedanceChartSnapshot
