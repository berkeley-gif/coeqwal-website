/**
 * Per-share-item image export
 *
 * Split into produce and save halves. The `captureShareItem*`
 * producers return a PNG Blob or SVG string, the `downloadShareItem*`
 * functions wrap them with a download trigger, and
 * `exportAllShareItemImagesAsZip` reuses the producers to build a bulk
 * archive.
 *
 * Every path exports the mounted card element (the full card chrome,
 * laid out at the fixed export width via html-to-image). Downloads only
 * happen on the Share page, which mounts every tray and story card, so
 * an item without a mounted element has no figure to export: the
 * producers return null rather than emit a bare chart without its
 * template and SOURCE. Filename basenames come from the variant registry
 * so a new variant only fills in one row.
 */

import JSZip from "jszip"
import type { ShareItem } from "../types"
import { handlerForItem, type CsvLookups } from "../variants"
import { withExt, dedupeLabel } from "../utils/filename"
import { captureCardPngDataUrl, captureCardSvgString } from "../cardExport"
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
 * Produce a PNG Blob for a share item from its mounted card element via
 * html-to-image, or null when there is no element or the capture fails.
 * A mounted card exports as the full card or not at all: falling back to
 * a bare chart would silently drop the template and SOURCE.
 *
 * This is the produce half of PNG export. The single-item download and
 * the bulk image ZIP both build on it.
 */
export async function captureShareItemPngBlob(
  item: ShareItem,
  liveEl: HTMLElement | null,
  backgroundColor: string,
): Promise<Blob | null> {
  // Figures export as the mounted, fixed-width card. With no card element
  // there is no figure to export: refuse rather than emit a bare chart
  // (or a map's JPEG bytes under a .png name).
  if (!liveEl) return null
  const dataUrl = await captureCardPngDataUrl(liveEl, { backgroundColor })
  return dataUrl ? dataUrlToBlob(dataUrl) : null
}

/**
 * Produce an SVG string for a share item from its mounted card element
 * (html-to-image's foreignObject SVG, carrying the full card chrome at
 * vector resolution, modulo the legacy-renderer caveat documented on
 * `captureCardSvgString`), or null when there is no element or the
 * capture fails.
 *
 * This is the produce half of SVG export.
 */
export async function captureShareItemSvgString(
  item: ShareItem,
  liveEl: HTMLElement | null,
  backgroundColor: string,
): Promise<string | null> {
  // Same rule as the PNG producer: no mounted card, no export.
  if (!liveEl) return null
  return captureCardSvgString(liveEl, { backgroundColor })
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
  } else {
    // Nothing is downloaded rather than a bare chart; say so where the
    // capture failure itself is already reported.
    console.warn("[Share] PNG export produced nothing for", item.id)
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
    downloadSvgString(
      svg,
      withExt(shareItemFilenameLabel(item, lookups), "svg"),
    )
  } else {
    console.warn("[Share] SVG export produced nothing for", item.id)
  }
}

/**
 * Bundle every share item's image into a ZIP with a PNG and an SVG per
 * card. Basenames match the per-card downloads, deduped on collision,
 * so single and bulk downloads land on the same names. `resolveLiveEl`
 * returns the mounted card element for an item id, or null when the
 * item is not on screen, in which case the item is skipped: without a
 * card there is no template to export.
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
      if (!liveEl) {
        // No mounted card, no template: skip rather than ship a bare chart.
        console.warn("[Share] no mounted card for", item.id, "- skipped in ZIP")
        continue
      }
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
