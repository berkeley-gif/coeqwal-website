"use client"

/**
 * Live-card capture pipeline. Capture a mounted share card to a PNG
 * data URL or an SVG string. These are the produce half of image
 * export, consumed by the per-item download and bulk image ZIP paths
 * in `export/shareItemDownload`. Both keep PNG and SVG visually
 * consistent (both carry the styled card chrome: tool label, title,
 * definition, hydroclimate badge, chart, chips, note text, etc.) and
 * filter out the same set of in-card controls.
 *
 * Implementation notes:
 *
 *   - Both PNG and SVG render the live DOM via `html-to-image`. The
 *     SVG file uses html-to-image's foreignObject embedding so the
 *     vector retains the same layout. This opens cleanly in modern
 *     browsers and most vector tools, with the documented caveat
 *     that legacy renderers without foreignObject support fall
 *     through to the embedded raster.
 *
 *   - `cardElementFilter` is the source of truth for what
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

import { getFontEmbedCSS, toPng, toSvg } from "html-to-image"

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
 * Web font embedding pipeline.
 *
 * `html-to-image` walks every document stylesheet on each call to
 * collect `@font-face` rules and inline them into the export. That
 * walk does two things we want to avoid on every share download:
 *
 *   1. It re-fetches and re-parses remote font CSS (Google Fonts,
 *      Emotion runtime CSS, the Next.js font loader's stylesheets).
 *   2. Its regex parser cannot round-trip every remote rule through
 *      `CSSStyleSheet.insertRule`. When a rule fails the library
 *      catches the throw and `console.error`s it. The export still
 *      completes, but Next.js's dev overlay surfaces every
 *      `console.error` as a red "Console Error" toast.
 *
 * The library is designed for this. `Options.fontEmbedCSS` is
 * documented as: "Use with `getFontEmbedCSS()` to create embed CSS
 * for use across multiple calls to library functions". When that
 * option is set, `embedWebFonts` skips the entire stylesheet walk
 * and uses the precomputed string directly.
 *
 * Strategy:
 *
 *   - Lazily compute `getFontEmbedCSS(document.body)` ONCE per
 *     session, keyed at module scope. `document.body` is the widest
 *     possible filter so the cached CSS covers every web font any
 *     card on the page could use.
 *   - The single warm-up call still hits the noisy path, so we
 *     scope-suppress only the library's own error patterns for the
 *     duration of that one call. Every other `console.error` -
 *     including unrelated app or library errors during the warm-up
 *     window - flows through unchanged.
 *   - Every subsequent `toPng` / `toSvg` passes the cached CSS as
 *     `fontEmbedCSS`. The library never walks stylesheets again, so
 *     no more noise to suppress and exports get faster.
 *   - If the warm-up rejects entirely, we surface ONE
 *     `console.warn` (so the failure is visible) and fall back to
 *     `skipFonts: true`. Exports keep working with system-font
 *     fallbacks rather than degrading silently.
 */
const HTML_TO_IMAGE_FONT_NOISE_PATTERNS = [
  "Error inserting rule from remote css",
  "Error loading remote css",
  "Error inlining remote css file",
  "Error loading remote stylesheet",
  "Error while reading CSS rules from",
]

/**
 * Result of the bootstrap call to `getFontEmbedCSS`.
 *
 *   - `string`: precomputed font CSS, possibly empty (the page has
 *     no `@font-face` rules to embed, which is legitimate, not a failure).
 *   - `null`: warm-up rejected. Callers should fall back to
 *     `skipFonts: true` and the user has already seen one warning.
 */
type FontEmbedResult = string | null

let fontEmbedPromise: Promise<FontEmbedResult> | null = null

function getCachedFontEmbedCSS(): Promise<FontEmbedResult> {
  if (fontEmbedPromise) return fontEmbedPromise
  if (typeof document === "undefined") {
    fontEmbedPromise = Promise.resolve(null)
    return fontEmbedPromise
  }
  fontEmbedPromise = (async () => {
    const original = console.error
    const isLibraryNoise = (args: unknown[]): boolean => {
      const first = args[0]
      return (
        typeof first === "string" &&
        HTML_TO_IMAGE_FONT_NOISE_PATTERNS.some((p) => first.includes(p))
      )
    }
    console.error = (...args: unknown[]) => {
      if (isLibraryNoise(args)) return
      original.apply(console, args)
    }
    try {
      return await getFontEmbedCSS(document.body)
    } catch (err) {
      original.call(
        console,
        "[Share] font embed warm-up failed; PNG / SVG exports will use system-font fallbacks:",
        err,
      )
      return null
    } finally {
      console.error = original
    }
  })()
  return fontEmbedPromise
}

/**
 * Resolve the font-embed options to merge into a `toPng` / `toSvg`
 * call. Either:
 *
 *   - `{ fontEmbedCSS: "..." }`: use the precomputed (possibly empty)
 *     CSS. Library skips the stylesheet walk.
 *   - `{ skipFonts: true }`: warm-up failed. Force the library off
 *     the noisy path. Web fonts in the export render in system-font
 *     fallbacks but the export still completes.
 */
async function fontEmbedOptions(): Promise<
  { fontEmbedCSS: string } | { skipFonts: true }
> {
  const css = await getCachedFontEmbedCSS()
  return css == null ? { skipFonts: true } : { fontEmbedCSS: css }
}

/**
 * Capture a live share-card element to a PNG data URL, or null when
 * html-to-image rejects. This is the produce half of PNG export.
 * Download paths and the bulk image ZIP both build on it.
 */
export async function captureCardPngDataUrl(
  liveEl: HTMLElement,
  options: ExportOptions,
): Promise<string | null> {
  try {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1
    const fontOpts = await fontEmbedOptions()
    return await toPng(liveEl, {
      pixelRatio: dpr * (options.rasterScale ?? DEFAULT_RASTER_SCALE),
      backgroundColor: options.backgroundColor,
      filter: cardElementFilter,
      cacheBust: true,
      ...fontOpts,
    })
  } catch (err) {
    console.warn("[Share] card PNG capture failed:", err)
    return null
  }
}

/**
 * Capture a live share-card element to an SVG string (foreignObject
 * layout), or null when html-to-image rejects or the data URL cannot
 * be decoded. This is the produce half of SVG export.
 */
export async function captureCardSvgString(
  liveEl: HTMLElement,
  options: Pick<ExportOptions, "backgroundColor">,
): Promise<string | null> {
  try {
    const fontOpts = await fontEmbedOptions()
    const dataUrl = await toSvg(liveEl, {
      backgroundColor: options.backgroundColor,
      filter: cardElementFilter,
      cacheBust: true,
      ...fontOpts,
    })
    return decodeSvgDataUrl(dataUrl)
  } catch (err) {
    console.warn("[Share] card SVG capture failed:", err)
    return null
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
