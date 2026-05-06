"use client"

/**
 * Live-card export pipeline. Every "Download as PNG" / "Download as
 * SVG" button on a share card funnels through here so PNG and SVG
 * stay visually consistent (both carry the styled card chrome:
 * tool label, title, definition, hydroclimate badge, chart, chips,
 * note text, etc.) and so the same set of in-card controls is
 * filtered out of every export.
 *
 * Implementation notes:
 *
 *   - Both PNG and SVG render the live DOM via `html-to-image`. The
 *     SVG file uses html-to-image's foreignObject embedding so the
 *     vector retains the same layout; this opens cleanly in modern
 *     browsers and most vector tools, with the documented caveat
 *     that legacy renderers without foreignObject support fall
 *     through to the embedded raster.
 *
 *   - `cardElementFilter` is the single source of truth for what
 *     the export skips. Any element marked
 *     `data-share-export-ignore` is dropped, plus the
 *     `[data-share-note]` block when its only content is the
 *     "Add a note" placeholder (notes the user wrote stay in).
 *
 *   - The live-element export costs a DOM walk + style inlining,
 *     so callers with bulk paths should stay on the same code
 *     path (we benefit from html-to-image's font-embed cache
 *     across calls).
 */

import { toPng, toSvg } from "html-to-image"
import {
  downloadFromDataUrl,
  downloadSvgString,
} from "../dataExplorer/utils/exportUtils"

/**
 * html-to-image filter callback. Returning `false` drops the node
 * (and its subtree) from the output.
 */
export function cardElementFilter(node: HTMLElement): boolean {
  if (!(node instanceof HTMLElement)) return true
  if (node.dataset?.shareExportIgnore != null) return false
  return true
}

interface ExportOptions {
  /** Background color painted under the card (white, paper, etc.). */
  backgroundColor: string
  /** Optional pixel-ratio multiplier on top of devicePixelRatio. */
  rasterScale?: number
}

const DEFAULT_RASTER_SCALE = 2

/**
 * Capture a live share-card element to PNG and trigger a browser
 * download. Returns true on success so callers can chain a fallback
 * path when the live element is missing or html-to-image rejects
 * (cross-origin embedded images, taint, etc.).
 */
export async function downloadCardAsPng(
  liveEl: HTMLElement,
  filename: string,
  options: ExportOptions,
): Promise<boolean> {
  try {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1
    const dataUrl = await toPng(liveEl, {
      pixelRatio: dpr * (options.rasterScale ?? DEFAULT_RASTER_SCALE),
      backgroundColor: options.backgroundColor,
      filter: cardElementFilter,
      cacheBust: true,
    })
    await downloadFromDataUrl(dataUrl, filename)
    return true
  } catch (err) {
    console.warn("[Share] card PNG export failed:", err)
    return false
  }
}

/**
 * Capture a live share-card element to SVG (foreignObject layout)
 * and trigger a browser download. The SVG is decoded from
 * html-to-image's data URL into a string so the file is written
 * with the canonical SVG mime type rather than a base64 blob.
 */
export async function downloadCardAsSvg(
  liveEl: HTMLElement,
  filename: string,
  options: Pick<ExportOptions, "backgroundColor">,
): Promise<boolean> {
  try {
    const dataUrl = await toSvg(liveEl, {
      backgroundColor: options.backgroundColor,
      filter: cardElementFilter,
      cacheBust: true,
    })
    const svg = decodeSvgDataUrl(dataUrl)
    if (!svg) return false
    downloadSvgString(svg, filename)
    return true
  } catch (err) {
    console.warn("[Share] card SVG export failed:", err)
    return false
  }
}

/**
 * `toSvg` returns a `data:image/svg+xml;charset=utf-8,<encoded>` URL.
 * The encoding is URI-component encoding (not base64), so a single
 * `decodeURIComponent` after the comma yields the SVG document.
 */
function decodeSvgDataUrl(dataUrl: string): string | null {
  const commaIdx = dataUrl.indexOf(",")
  if (commaIdx === -1) return null
  const meta = dataUrl.slice(0, commaIdx)
  const payload = dataUrl.slice(commaIdx + 1)
  if (meta.includes(";base64")) {
    if (typeof atob !== "function") return null
    return atob(payload)
  }
  try {
    return decodeURIComponent(payload)
  } catch {
    return null
  }
}
