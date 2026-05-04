"use client"

/**
 * ResilienceHeatmapSnapshot
 *
 * Capture-mode wrapper around `ResilienceHeatmap`. Pre-binds the
 * `interactive=false` and `animate=false` props so off-screen
 * capture hosts can mount the chart with a uniform, listener-free
 * shape regardless of which downstream visualization they are
 * snapshotting.
 *
 * The wrapper otherwise forwards every prop straight through, so
 * any axis / data / palette / column-group prop callers already
 * pass to the live mount works here unchanged. Pair this with
 * `OffscreenCaptureHost`: the host renders the snapshot
 * inside a hidden div, awaits `onReady`, then serializes the SVG.
 *
 * Tooltip refs are still installed by `ResilienceHeatmap` (the
 * cell tooltip / axis tooltip portal nodes mount unconditionally),
 * but they never fire because no listeners are attached when
 * `interactive=false`. The portals attach to `document.body` and
 * are cleaned up on unmount, so they do not leak into the
 * serialized SVG output.
 */

import React from "react"
import ResilienceHeatmap, {
  type ResilienceHeatmapProps,
} from "./ResilienceHeatmap"

export type ResilienceHeatmapSnapshotProps = Omit<
  ResilienceHeatmapProps,
  "interactive" | "animate"
>

const ResilienceHeatmapSnapshot: React.FC<ResilienceHeatmapSnapshotProps> = (
  props,
) => {
  return <ResilienceHeatmap {...props} interactive={false} animate={false} />
}

ResilienceHeatmapSnapshot.displayName = "ResilienceHeatmapSnapshot"

export default ResilienceHeatmapSnapshot
