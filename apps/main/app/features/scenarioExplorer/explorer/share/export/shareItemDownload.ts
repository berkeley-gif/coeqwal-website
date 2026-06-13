/**
 * Per-share-item image export
 *
 * Split into produce and save halves. The `captureShareItem*`
 * producers return a PNG Blob or SVG string, the `downloadShareItem*`
 * functions wrap them with a download trigger, and
 * `exportAllShareItemImagesAsZip` reuses the producers to build a bulk
 * archive.
 *
 * Every path prefers the live card element (full card chrome via
 * html-to-image) and falls back to the item's `cachedSvg` (and, for
 * PNG, an older `cachedImageDataUrl`) when the card is not mounted,
 * e.g. URL-restored items that have not been added to the story
 * canvas. Filename basenames and raster dimensions both come from the
 * variant registry so a new variant only fills in one row.
 */

import JSZip from "jszip"
import type { ShareItem } from "../types"
import { handlerForItem, type CsvLookups } from "../variants"
import { CAPTURE_DIMENSIONS } from "../capture/dimensions"
import { withExt, dedupeLabel } from "../utils/filename"
import { captureCardPngDataUrl, captureCardSvgString } from "../cardExport"
import { rasterizeSvgString, embedFontStylesInSvg } from "./svgRasterize"
import { dataUrlToBlob, downloadBlob, downloadSvgString } from "./download"

/**
 * Basename (no extension) for an item's PNG / SVG / CSV downloads.
 *
 * `lookups` is forwarded straight into the handler so filenames can
 * use the same scenario short labels users see in the share UI
 * (e.g. `current-ops`) instead of internal ids (`s0042`).
 */
export function shareItemFilenameLabel(
  item: ShareItem,
  lookups: CsvLookups,
): string {
  return handlerForItem(item).filenameLabel(item as never, lookups)
}

/**
 * Raster dimensions for the `cachedSvg` PNG fallback. Variants whose
 * size depends on the item (resilience: single tile vs full panel)
 * provide `rasterSizeFor`; the rest fall back to the static
 * `rasterDimensionsKey` lookup into {@link CAPTURE_DIMENSIONS}.
 */
function shareItemRasterSize(item: ShareItem) {
  const handler = handlerForItem(item)
  return (
    handler.rasterSizeFor?.(item) ??
    CAPTURE_DIMENSIONS[handler.rasterDimensionsKey]
  )
}

/**
 * Produce a PNG Blob for a share item, or null when no source is
 * available. Order of preference:
 *   1. live card element via html-to-image. Captures the full card
 *      (tool label, title, definition, hydroclimate badge, chart,
 *      chips, user-written note) so the image matches what the user
 *      sees in the share tray. Dominant path for mounted items.
 *   2. cachedSvg, rasterized on demand. Bare-chart fallback when the
 *      card is not currently mounted.
 *   3. cachedImageDataUrl. An older cached PNG fallback.
 *
 * This is the produce half of PNG export. The single-item download and
 * the bulk image ZIP both build on it.
 */
export async function captureShareItemPngBlob(
  item: ShareItem,
  liveEl: HTMLElement | null,
  backgroundColor: string,
): Promise<Blob | null> {
  if (liveEl) {
    const dataUrl = await captureCardPngDataUrl(liveEl, { backgroundColor })
    if (dataUrl) return dataUrlToBlob(dataUrl)
  }

  if (item.cachedSvg) {
    try {
      const size = shareItemRasterSize(item)
      const { dataUrl } = await rasterizeSvgString(
        item.cachedSvg,
        size.width,
        size.height,
        { backgroundColor },
      )
      return await dataUrlToBlob(dataUrl)
    } catch (err) {
      console.warn(
        "[Share] PNG capture via cachedSvg failed, falling back to cached PNG:",
        err,
      )
    }
  }

  if (item.cachedImageDataUrl) {
    return dataUrlToBlob(item.cachedImageDataUrl)
  }

  return null
}

/**
 * Produce an SVG string for a share item, or null when no source is
 * available. Order of preference:
 *   1. live card element via html-to-image's foreignObject SVG.
 *      Carries the full card chrome at vector resolution, modulo the
 *      legacy-renderer caveat documented on `captureCardSvgString`.
 *   2. cachedSvg with embedded font @import. Bare-chart fallback when
 *      the card is not mounted. Still opens cleanly in vector tools.
 *
 * This is the produce half of SVG export.
 */
export async function captureShareItemSvgString(
  item: ShareItem,
  liveEl: HTMLElement | null,
  backgroundColor: string,
): Promise<string | null> {
  if (liveEl) {
    const svg = await captureCardSvgString(liveEl, { backgroundColor })
    if (svg) return svg
  }

  if (item.cachedSvg) return embedFontStylesInSvg(item.cachedSvg)

  return null
}

/** PNG download path. Captures the item then triggers the download. */
export async function downloadShareItemAsPng(
  item: ShareItem,
  liveEl: HTMLElement | null,
  backgroundColor: string,
  lookups: CsvLookups,
): Promise<void> {
  const blob = await captureShareItemPngBlob(item, liveEl, backgroundColor)
  if (blob) {
    downloadBlob(blob, withExt(shareItemFilenameLabel(item, lookups), "png"))
  }
}

/** SVG download path. Captures the item then triggers the download. */
export async function downloadShareItemAsSvg(
  item: ShareItem,
  liveEl: HTMLElement | null,
  backgroundColor: string,
  lookups: CsvLookups,
): Promise<void> {
  const svg = await captureShareItemSvgString(item, liveEl, backgroundColor)
  if (svg) {
    downloadSvgString(svg, withExt(shareItemFilenameLabel(item, lookups), "svg"))
  }
}

/**
 * Bundle every share item's image into a ZIP with a PNG and an SVG per
 * card. Basenames match the per-card downloads, deduped on collision,
 * so single and bulk downloads land on the same names. `resolveLiveEl`
 * returns the mounted card element for an item id, or null when the
 * item is not on screen (capture then falls back to cached data).
 *
 * Items that yield neither a PNG nor an SVG are skipped. Per-item
 * failures are caught so one bad capture does not abort the rest. The
 * download is suppressed when nothing was included.
 */
export async function exportAllShareItemImagesAsZip(
  items: ShareItem[],
  filename: string,
  backgroundColor: string,
  lookups: CsvLookups,
  resolveLiveEl: (id: string) => HTMLElement | null,
): Promise<void> {
  const zip = new JSZip()
  const usedNames = new Set<string>()
  let included = 0

  for (const item of items) {
    try {
      const liveEl = resolveLiveEl(item.id)
      const [pngBlob, svgString] = await Promise.all([
        captureShareItemPngBlob(item, liveEl, backgroundColor),
        captureShareItemSvgString(item, liveEl, backgroundColor),
      ])
      if (!pngBlob && !svgString) continue
      const base = dedupeLabel(shareItemFilenameLabel(item, lookups), usedNames)
      if (pngBlob) zip.file(withExt(base, "png"), pngBlob)
      if (svgString) zip.file(withExt(base, "svg"), svgString)
      included += 1
    } catch (err) {
      console.warn("[Share] image export failed for one item, skipping:", err)
    }
  }

  if (included === 0) return

  const blob = await zip.generateAsync({ type: "blob" })
  downloadBlob(blob, filename)
}
