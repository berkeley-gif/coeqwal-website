"use client"

/**
 * Capture-mode wrapper for TierGrid: pre-binds `interactive=false` and
 * `animate=false` so off-screen capture hosts render a single
 * listener-free, transition-free frame. Pair with `OffscreenCaptureHost`.
 */

import React from "react"
import TierGrid, { type TierGridProps } from "./TierGrid"

export type TierGridSnapshotProps = Omit<
  TierGridProps,
  "interactive" | "animate"
>

const TierGridSnapshot: React.FC<TierGridSnapshotProps> = (props) => {
  return <TierGrid {...props} interactive={false} animate={false} />
}

TierGridSnapshot.displayName = "TierGridSnapshot"

export default TierGridSnapshot
