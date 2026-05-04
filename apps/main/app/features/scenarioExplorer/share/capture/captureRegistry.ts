/**
 * Cross-reference for the share capture pipeline.
 *
 * Every share variant now goes through the same off-screen pipeline:
 * the panel mounts a *Snapshot wrapper inside `OffscreenCaptureHost`
 * at the dimensions declared in `share/capture/dimensions.ts`, awaits
 * `onReady`, and serializes the resulting SVG (plus a rasterized PNG
 * companion). Per-variant inputs differ, so each adapter is called
 * directly by its panel; the entries below map entry point -> adapter
 * file -> dimensions key.
 *
 *   radar
 *     entry points:   RadarPanel toolbar, ScenarioSelectionSidebar
 *                     (single-scenario share + theme-header
 *                     "share all", which overlays every theme trace
 *                     onto one card)
 *     adapter:        exploreView/OffscreenRadarCapture
 *     dimensions:     CAPTURE_DIMENSIONS.radar
 *
 *   equity
 *     entry points:   EquityPanel toolbar, ScenarioExplorer sidebar
 *                     paths via `stageEquityShareItem`
 *     adapter:        exploreView/OffscreenEquityCapture
 *     dimensions:     CAPTURE_DIMENSIONS.equity
 *
 *   resilience (panel-wide)
 *     entry points:   ResiliencePanel toolbar
 *     adapter:        exploreView/OffscreenResiliencePanelCapture
 *                     (compose mode: stitches every visible heatmap
 *                     SVG into one composite)
 *     dimensions:     CAPTURE_DIMENSIONS.resiliencePanel
 *
 *   resilience (single tile)
 *     entry points:   ResiliencePanel small-multiples tile share
 *                     button, scenario-solo share path
 *     adapter:        exploreView/OffscreenResilienceCapture
 *     dimensions:     CAPTURE_DIMENSIONS.resilienceTile
 *
 *   resilience (leverage quadrant)
 *     entry points:   ResilienceQuadrantPanel toolbar
 *     adapter:        exploreView/OffscreenQuadrantCapture
 *     dimensions:     CAPTURE_DIMENSIONS.quadrant
 *
 *   barChart row
 *     entry points:   StrategyGridRow row share button,
 *                     ThemeGroupHeader "share all" (which fans out
 *                     to one capture per scenario via
 *                     StrategyGridContent.handleShareThemeScenarios)
 *     adapter:        strategyGrid/OffscreenBarChartRowCapture
 *     dimensions:     CAPTURE_DIMENSIONS.barChartRow
 *
 * Every call site funnels the result into `share/stage.ts#stageShareItem`
 * so the build-item -> capture -> attach cache -> addShareItem flow is
 * identical across variants, including fail-open behavior when capture
 * rejects.
 *
 * To add a new variant:
 *   1. Build a *Snapshot wrapper in `@repo/viz` (or a local snapshot
 *      component) that pre-binds `interactive=false` and
 *      `animate=false` and fires `onReady` once it has rendered.
 *   2. Add a `CAPTURE_DIMENSIONS` entry in `share/capture/dimensions.ts`.
 *   3. Write an `Offscreen<Variant>Capture.tsx` adapter that calls
 *      `offscreenCapture` with that snapshot at those dimensions and
 *      returns `CapturedVisual` (`{ svg, dataUrl }`) plus any
 *      per-variant extras typed in `share/capture/types.ts`.
 *   4. Call the adapter from the panel via `stageShareItem`.
 *   5. Update `RASTER_SIZE` in `app/components/tabPanels/Share.tsx`
 *      so PNG downloads pick up the same dimensions.
 *   6. Add a row above.
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
  ResilienceQuadrantCaptureFn,
} from "./types"
