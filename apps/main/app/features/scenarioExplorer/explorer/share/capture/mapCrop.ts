/**
 * mapCrop - geometry and sanity checks for saving the Explore map: which
 * part of the full Mapbox canvas the visible map panel covers, the output
 * size, and whether a captured canvas is blank. Pure.
 *
 * Exports: Rect, MapCrop, mapPanelCrop, mapExportSize, isUniformImage.
 */

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

/** Source rectangle in canvas pixels (drawImage sx, sy, sw, sh) */
export interface MapCrop {
  sx: number
  sy: number
  sw: number
  sh: number
}

/** The part of the map canvas under the visible panel, or null when the
 *  panel does not overlap the map. Rects are CSS px in viewport
 *  coordinates; canvasPxPerCssPx is canvas.width / container CSS width. */
export function mapPanelCrop(
  panel: Rect,
  container: Rect,
  canvasPxPerCssPx: number,
): MapCrop | null {
  const left = Math.max(panel.left, container.left)
  const top = Math.max(panel.top, container.top)
  const right = Math.min(
    panel.left + panel.width,
    container.left + container.width,
  )
  const bottom = Math.min(
    panel.top + panel.height,
    container.top + container.height,
  )
  if (right - left < 1 || bottom - top < 1) return null
  const k = canvasPxPerCssPx
  return {
    sx: Math.round((left - container.left) * k),
    sy: Math.round((top - container.top) * k),
    sw: Math.round((right - left) * k),
    sh: Math.round((bottom - top) * k),
  }
}

/** Output size: the crop scaled down to at most maxWidthPx wide, same
 *  aspect ratio, never scaled up. */
export function mapExportSize(
  crop: MapCrop,
  maxWidthPx: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxWidthPx / crop.sw)
  return {
    width: Math.round(crop.sw * scale),
    height: Math.round(crop.sh * scale),
  }
}

/** True when every sampled pixel has the same RGBA value (a blank read of
 *  an unpreserved WebGL buffer is one flat color). */
export function isUniformImage(
  rgba: ArrayLike<number>,
  sampleEvery = 97,
): boolean {
  const step = Math.max(1, sampleEvery) * 4
  const [r, g, b, a] = [rgba[0], rgba[1], rgba[2], rgba[3]]
  for (let i = step; i + 3 < rgba.length; i += step) {
    if (
      rgba[i] !== r ||
      rgba[i + 1] !== g ||
      rgba[i + 2] !== b ||
      rgba[i + 3] !== a
    ) {
      return false
    }
  }
  return true
}
