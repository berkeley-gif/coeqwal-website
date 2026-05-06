/**
 * Capture function types and the shared capture-result base.
 *
 * Every off-screen capture adapter ultimately returns at least
 * `{ svg, dataUrl }`. Each variant adds its own per-call extras
 * (per-scenario chart data, color mapping, tier rows, etc.). This
 * module is the single import site so every panel and every share
 * call site picks up the same signatures.
 *
 * Panel files re-export their domain-specific result types
 * (e.g. `ResilienceCaptureResult`) and reference these capture
 * function types via this module rather than redeclaring them.
 */

import type {
  ResilienceCaptureResult,
  ResilienceHeatmapChartData as _ResilienceHeatmapChartData,
} from "../../exploreView/ResiliencePanel"
import type { ResilienceQuadrantCaptureResult } from "../../exploreView/ResilienceQuadrantPanel"

/**
 * Base shape returned by every off-screen capture host call.
 * Variants either return this directly or extend it with their
 * domain-specific extras.
 */
export interface CapturedVisual {
  /** Serialized SVG with computed styles inlined. Primary cache. */
  svg: string
  /** PNG data URL produced by rasterizing the cloned SVG. */
  dataUrl: string
}

/**
 * Capture a single radar trace for one scenario. Returned `color`
 * is the assigned scenario color so the share card can paint a
 * consistent legend swatch when the live chart unmounts.
 */
export type SingleScenarioCaptureFn = (scenarioId: string) => Promise<
  | (CapturedVisual & {
      color: string
      chartData: Record<string, unknown>
    })
  | null
>

/**
 * Capture an arbitrary set of scenarios overlaid on one radar chart.
 * Used by the sidebar's theme-header "share all" so a theme produces
 * one multi-trace card. `colors` and `scenarioIds` align by index
 * in the order the chart drew them.
 */
export type MultiScenarioCaptureFn = (scenarioIds: string[]) => Promise<
  | (CapturedVisual & {
      colors: string[]
      scenarioIds: string[]
      chartData: Record<string, unknown>
    })
  | null
>

/** Capture the full resilience panel as one composite SVG / PNG. */
export type ResilienceCaptureFn = () => Promise<ResilienceCaptureResult | null>

/** Capture a single resilience small-multiples tile. */
export type ResilienceTileCaptureFn = (
  tileId: string,
) => Promise<ResilienceCaptureResult | null>

/**
 * Capture a single scenario as a synthesized scenario-solo tile,
 * regardless of the panel's current view. Used by the scenario
 * sidebar so clicking the share icon next to a row always produces
 * a card scoped to that scenario, mirroring how radar (single
 * trace) and equity (single distribution) sidebar shares behave.
 */
export type ResilienceScenarioSoloCaptureFn = (
  scenarioId: string,
) => Promise<ResilienceCaptureResult | null>

/** Capture the resilience leverage quadrant. */
export type ResilienceQuadrantCaptureFn =
  () => Promise<ResilienceQuadrantCaptureResult | null>
