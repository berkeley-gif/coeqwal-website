/**
 * Re-export barrel for the share capture pipeline. Adapters and
 * panels import capture primitives from here so a future move of
 * `OffscreenCaptureHost` or `dimensions.ts` only edits one file.
 *
 * Per-variant wiring (card, URL, CSV, filename, raster size) lives
 * in `share/variants.ts`; see the share README for the
 * "Adding share to a new visualization" walkthrough.
 */

export { offscreenCapture } from "./OffscreenCaptureHost"
export type {
  OffscreenCaptureInput,
  OffscreenCaptureResult,
} from "./OffscreenCaptureHost"
export { CAPTURE_DIMENSIONS } from "./dimensions"
export type { CaptureSize, CaptureDimensionKey } from "./dimensions"
export type {
  CapturedVisual,
  SingleScenarioCaptureFn,
  MultiScenarioCaptureFn,
  ResilienceCaptureFn,
  ResilienceTileCaptureFn,
} from "./types"
