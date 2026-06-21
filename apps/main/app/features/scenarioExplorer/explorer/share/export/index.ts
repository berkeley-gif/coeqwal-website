/**
 * Public surface of the share export layer
 *
 * Split by concern:
 * - `csv/`             per-variant CSV builders + the shared header
 *                      block, plus single-card / bulk-ZIP orchestration.
 * - `svgRasterize`     SVG clone / composite / rasterize to PNG.
 * - `download`         Blob + data-URL download triggers and clipboard.
 * - `shareItemDownload` per-item image capture, the PNG/SVG download
 *                      paths, and the bulk image ZIP.
 *
 * Prefer importing from the specific module. This barrel exists for
 * discoverability and for callers that need several concerns at once.
 */

export {
  csvEscape,
  csvQuote,
  buildCsvHeaderBlock,
  type CsvHeaderInput,
} from "./csv/csvFormat"
export { barChartDataToCSV, type BarTierEntry } from "./csv/barChartCsv"
export { radarDataToCSV } from "./csv/radarCsv"
export {
  resilienceHeatmapDataToCSV,
  type ResilienceHeatmapRow,
  type ResilienceHeatmapChartDataShape,
} from "./csv/resilienceCsv"
export { equityDataToCSV, type EquityChartDataShape } from "./csv/equityCsv"
export {
  exportShareItemAsCSV,
  exportAllShareItemsAsZip,
} from "./csv/shareItemCsv"

export {
  inlineStyles,
  captureSvgToBlob,
  rasterizeSvgClone,
  captureElementToBlob,
  embedFontStylesInSvg,
  composeLiveSvgsToString,
  rasterizeSvgString,
} from "./svgRasterize"

export {
  downloadBlob,
  dataUrlToBlob,
  downloadFromDataUrl,
  downloadSvgString,
  downloadCSV,
  copyToClipboard,
  getTimestampedFilename,
} from "./download"

export {
  shareItemFilenameLabel,
  captureShareItemPngBlob,
  captureShareItemSvgString,
  downloadShareItemAsPng,
  downloadShareItemAsSvg,
  exportAllShareItemImagesAsZip,
} from "./shareItemDownload"
