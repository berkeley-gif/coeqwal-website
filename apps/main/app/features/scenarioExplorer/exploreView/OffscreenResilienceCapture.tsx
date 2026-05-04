"use client"

/**
 * Off-screen capture for resilience heatmap tiles. Single entry
 * point used by both the panel-wide capture path and the per-tile
 * capture path, so both produce identical output regardless of
 * whether the tile happened to be visible in the live DOM at
 * capture time.
 *
 * Callers assemble the heatmap props (rows, columns, cells, palette,
 * etc.) the same way they would for the live mount and pass them in.
 * The adapter wraps them in a snapshot wrapper (interactive=false,
 * animate=false) and forwards `onReady` through OffscreenCaptureHost.
 */

import React from "react"
import { ResilienceHeatmapSnapshot } from "@repo/viz"
import type { ResilienceHeatmapSnapshotProps } from "@repo/viz"
import { type Theme } from "@repo/ui/mui"
import { offscreenCapture } from "../share/capture/OffscreenCaptureHost"

export const RESILIENCE_TILE_CAPTURE_WIDTH = 800
export const RESILIENCE_TILE_CAPTURE_HEIGHT = 520

export interface CaptureResilienceOffscreenInput {
  /**
   * Snapshot props minus the dimensions and `onReady` plumbed by the
   * host. Pass exactly what the live ResilienceHeatmap mount would
   * receive aside from those four fields.
   */
  props: Omit<
    ResilienceHeatmapSnapshotProps,
    "width" | "height" | "responsive" | "onReady"
  >
  theme: Theme
  width?: number
  height?: number
  /** Free-form tag for capture-doctor diagnostics. */
  captureKind?: string
}

export interface CaptureResilienceOffscreenResult {
  svg: string
  dataUrl: string
}

export async function captureResilienceOffscreen(
  input: CaptureResilienceOffscreenInput,
): Promise<CaptureResilienceOffscreenResult> {
  const width = input.width ?? RESILIENCE_TILE_CAPTURE_WIDTH
  const height = input.height ?? RESILIENCE_TILE_CAPTURE_HEIGHT

  return offscreenCapture({
    theme: input.theme,
    width,
    height,
    captureKind: input.captureKind ?? "resilience:offscreen",
    render: (onReady) => (
      <ResilienceHeatmapSnapshot
        {...input.props}
        width={width}
        height={height}
        responsive={false}
        onReady={onReady}
      />
    ),
  })
}
