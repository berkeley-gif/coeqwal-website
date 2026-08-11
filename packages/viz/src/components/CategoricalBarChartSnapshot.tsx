"use client"

/**
 * Capture-mode wrapper for CategoricalBarChart: pre-binds `interactive=false`
 * and `responsive=false` so off-screen capture hosts render a single
 * listener-free frame at a fixed size. Pair with `OffscreenCaptureHost`.
 */

import React from "react"
import CategoricalBarChart, {
  type CategoricalBarChartProps,
} from "./CategoricalBarChart"

export type CategoricalBarChartSnapshotProps = Omit<
  CategoricalBarChartProps,
  "interactive" | "responsive"
>

const CategoricalBarChartSnapshot: React.FC<
  CategoricalBarChartSnapshotProps
> = (props) => {
  return (
    <CategoricalBarChart {...props} interactive={false} responsive={false} />
  )
}

CategoricalBarChartSnapshot.displayName = "CategoricalBarChartSnapshot"

export default CategoricalBarChartSnapshot
