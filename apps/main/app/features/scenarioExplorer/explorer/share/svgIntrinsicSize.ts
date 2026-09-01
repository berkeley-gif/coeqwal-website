/**
 * svgIntrinsicSize - reads the pixel width and height a captured SVG string
 * was serialized at. Every off-screen capture (single and compose modes)
 * stamps numeric `width`/`height` attributes on the root `<svg>`, so the
 * string itself is the source of truth for the figure's true shape. That
 * matters for captures whose height is content-aware (the resilience
 * small-multiples panel grows with its tile count): sizing thumbnails and
 * PNG exports from the fixed capture dimensions letterboxes or squeezes
 * those figures. Pure; no DOM.
 */

export interface SvgIntrinsicSize {
  width: number
  height: number
}

/**
 * Parse the root `<svg>` tag's numeric width/height attributes. Returns
 * null when either attribute is missing, non-numeric (e.g. "100%"), or
 * non-positive, so callers can fall back to their static dimensions.
 */
export function svgIntrinsicSize(svg: string): SvgIntrinsicSize | null {
  const openTag = svg.match(/<svg\b[^>]*>/)?.[0]
  if (!openTag) return null
  const width = Number(openTag.match(/\bwidth="([0-9.]+)"/)?.[1])
  const height = Number(openTag.match(/\bheight="([0-9.]+)"/)?.[1])
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  if (width <= 0 || height <= 0) return null
  return { width, height }
}
