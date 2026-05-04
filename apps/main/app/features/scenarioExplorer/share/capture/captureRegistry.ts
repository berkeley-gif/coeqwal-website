/**
 * Index of where each share variant's capture pipeline lives. Used as
 * a discoverability map only; per-variant capture inputs differ too
 * much to share a single function signature, so each adapter is
 * called directly by its panel and the call sites are listed here.
 *
 *   radar       -> exploreView/OffscreenRadarCapture (panel: RadarPanel)
 *   equity      -> exploreView/OffscreenEquityCapture (panel: EquityPanel,
 *                  also called from ScenarioExplorer for sidebar shares)
 *   resilience  -> exploreView/OffscreenResilienceCapture (heatmap tile +
 *                  scenario-solo, called from ResiliencePanel) and
 *                  exploreView/OffscreenQuadrantCapture (quadrant view)
 *   resilience  -> dataExplorer/utils/exportUtils#composeAndRasterize
 *   (panel)        for the panel-wide composed-DOM capture
 *   barChart    -> dataExplorer/utils/exportUtils#composeAndRasterize
 *                  driven by strategyGrid/captureBarChartRow
 *
 * To add a new variant: build a snapshot wrapper in `@repo/viz`,
 * write an adapter component that uses `offscreenCapture` (or
 * `composeAndRasterize` for composed-React variants), wire the
 * panel to call it at share time, and add a row above.
 */

export { offscreenCapture } from "./OffscreenCaptureHost"
export type {
  OffscreenCaptureInput,
  OffscreenCaptureResult,
} from "./OffscreenCaptureHost"
