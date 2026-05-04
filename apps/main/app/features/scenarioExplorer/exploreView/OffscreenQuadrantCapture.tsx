"use client"

/**
 * Off-screen capture for the Leverage quadrant view.
 *
 * Mirrors `OffscreenResilienceCapture`: callers assemble the same
 * props the live `ResilienceQuadrant` would receive (data, palette,
 * tier colors, ...) and the adapter mounts the snapshot wrapper
 * inside `OffscreenCaptureHost`. Returns SVG + PNG.
 */

import React from "react"
import {
  ResilienceQuadrantSnapshot,
  type ResilienceQuadrantSnapshotProps,
} from "@repo/viz"
import { type Theme } from "@repo/ui/mui"
import { offscreenCapture } from "../share/capture/OffscreenCaptureHost"
import { CAPTURE_DIMENSIONS } from "../share/capture/dimensions"

export const QUADRANT_CAPTURE_WIDTH = CAPTURE_DIMENSIONS.quadrant.width
export const QUADRANT_CAPTURE_HEIGHT = CAPTURE_DIMENSIONS.quadrant.height

export interface CaptureQuadrantOffscreenInput {
  props: Omit<
    ResilienceQuadrantSnapshotProps,
    "width" | "height" | "responsive" | "onReady"
  >
  theme: Theme
  width?: number
  height?: number
  captureKind?: string
}

export interface CaptureQuadrantOffscreenResult {
  svg: string
  dataUrl: string
}

export async function captureQuadrantOffscreen(
  input: CaptureQuadrantOffscreenInput,
): Promise<CaptureQuadrantOffscreenResult> {
  const width = input.width ?? QUADRANT_CAPTURE_WIDTH
  const height = input.height ?? QUADRANT_CAPTURE_HEIGHT

  return offscreenCapture({
    theme: input.theme,
    width,
    height,
    captureKind: input.captureKind ?? "resilience:quadrant",
    render: (onReady) => (
      <ResilienceQuadrantSnapshot
        {...input.props}
        width={width}
        height={height}
        responsive={false}
        onReady={onReady}
      />
    ),
  })
}
