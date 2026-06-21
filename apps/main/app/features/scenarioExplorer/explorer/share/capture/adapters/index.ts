/**
 * Off-screen capture adapters for the share pipeline
 *
 * Each adapter renders a chart into a detached React root and
 * serializes it to PNG plus cachedSvg using the helpers in
 * share/capture/OffscreenCaptureHost. The adapters live next to the
 * tool they capture because they import that tool's chart component.
 * This barrel re-exports them so the capture side is easy to find.
 * Import a specific module directly when wiring a capture button.
 */

export { captureRadarOffscreen } from "../../../tools/panels/radar/OffscreenRadarCapture"
export { captureEquityOffscreen } from "../../../tools/panels/equity/OffscreenEquityCapture"
export { captureResilienceOffscreen } from "../../../tools/panels/resilience/OffscreenResilienceCapture"
export { captureResiliencePanelOffscreen } from "../../../tools/panels/resilience/OffscreenResiliencePanelCapture"
export { captureBarChartRowOffscreen } from "../../../tools/panels/list/grid/OffscreenBarChartRowCapture"
