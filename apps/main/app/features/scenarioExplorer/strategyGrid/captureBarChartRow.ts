/**
 * Capture a stand-alone SVG (and PNG) of a scenario's outcome-glyph
 * row at fixed dimensions. The capture happens in an off-screen
 * mount via `captureBarChartRowOffscreen`, so every entry point
 * (StrategyGridRow share button, ThemeGroupHeader "share all" loop)
 * produces identical output regardless of whether the live row
 * happened to be on-screen at the time.
 */

import {
  captureBarChartRowOffscreen,
  type CaptureBarChartRowOffscreenInput,
} from "./OffscreenBarChartRowCapture"
import type { CapturedVisual } from "../share/capture/types"

export type CapturedBarChartRow = CapturedVisual

export async function captureBarChartRow(
  input: CaptureBarChartRowOffscreenInput,
): Promise<CapturedBarChartRow | null> {
  if (typeof document === "undefined") return null
  try {
    return await captureBarChartRowOffscreen(input)
  } catch (err) {
    console.warn("[captureBarChartRow] off-screen capture failed:", err)
    return null
  }
}
