/**
 * Shape morph utilities for SVG path animation.
 *
 * Provides resampling, shape generation, and interpolation functions
 * used by morph overlays that animate shapes (polygons, diamonds, circles)
 * into squares and other target shapes.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const POINTS_PER_SHAPE = 96
export const SQUARE_SIZE = 10
export const SQUARE_GAP = 2

// ============================================================================
// TYPES
// ============================================================================

/**
 * Data needed to animate a single shape from its map position to a target
 * grid square. Geometry-agnostic: works with polygons, diamonds, circles, etc.
 */
export interface ShapeMorphData {
  /** Resampled screen-space outline (POINTS_PER_SHAPE points) */
  screenShape: [number, number][]
  /** Screen-space centroid for intermediate square placement */
  centroidScreen: [number, number]
  /** Tier color hex */
  color: string
  /** Tier level (1–4) */
  tier: number
  /** Feature/location identifier for hide-schedule coordination */
  sourceId: string
}

// ============================================================================
// PATH RESAMPLING
// ============================================================================

/**
 * Resample a closed polygon path to exactly `n` evenly-spaced points.
 * The output traces the same outline but with uniform vertex distribution,
 * enabling smooth interpolation between shapes with different vertex counts.
 */
export function resampleClosedPath(
  points: [number, number][],
  n: number,
): [number, number][] {
  if (points.length < 2)
    return Array(n).fill(points[0] ?? [0, 0]) as [number, number][]

  const closed = [...points]
  const first = closed[0]!
  const last = closed[closed.length - 1]!
  if (first[0] !== last[0] || first[1] !== last[1]) closed.push(first)

  const cumDist = [0]
  for (let i = 1; i < closed.length; i++) {
    const cur = closed[i]!
    const prev = closed[i - 1]!
    const dx = cur[0] - prev[0]
    const dy = cur[1] - prev[1]
    cumDist.push(cumDist[i - 1]! + Math.sqrt(dx * dx + dy * dy))
  }
  const total = cumDist[cumDist.length - 1]!
  if (total === 0) return Array(n).fill(first) as [number, number][]

  const out: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const target = (i / n) * total
    let s = 0
    while (s < cumDist.length - 2 && cumDist[s + 1]! < target) s++
    const segLen = cumDist[s + 1]! - cumDist[s]!
    const t = segLen > 0 ? (target - cumDist[s]!) / segLen : 0
    const a = closed[s]!
    const b = closed[s + 1]!
    out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
  }
  return out
}

// ============================================================================
// SHAPE GENERATORS
// ============================================================================

/** Generate `n` resampled points for a rectangle centered at (cx, cy). */
export function rectPoints(
  cx: number,
  cy: number,
  w: number,
  h: number,
  n: number,
): [number, number][] {
  const hw = w / 2,
    hh = h / 2
  return resampleClosedPath(
    [
      [cx - hw, cy - hh],
      [cx + hw, cy - hh],
      [cx + hw, cy + hh],
      [cx - hw, cy + hh],
    ],
    n,
  )
}

/**
 * Generate `n` resampled points for a diamond (rotated square) centered
 * at (cx, cy). Matches the ENV_FLOWS marker visual: the diamond is
 * `w` wide and `h` tall (use h > w for the vertically-elongated style).
 */
export function diamondPoints(
  cx: number,
  cy: number,
  w: number,
  h: number,
  n: number,
): [number, number][] {
  const hw = w / 2,
    hh = h / 2
  return resampleClosedPath(
    [
      [cx, cy - hh],
      [cx + hw, cy],
      [cx, cy + hh],
      [cx - hw, cy],
    ],
    n,
  )
}

/**
 * Generate `n` evenly-spaced points around a circle centered at (cx, cy)
 * with radius `r`. Useful for point-marker outcomes.
 */
export function circlePoints(
  cx: number,
  cy: number,
  r: number,
  n: number,
): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return pts
}

/**
 * Generate `n` resampled points for a thick line segment from (x1,y1)
 * to (x2,y2) with the given thickness. Useful for river/line outcomes.
 */
export function lineSegmentPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  n: number,
): [number, number][] {
  const dx = x2 - x1,
    dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = (-dy / len) * (thickness / 2)
  const ny = (dx / len) * (thickness / 2)
  return resampleClosedPath(
    [
      [x1 + nx, y1 + ny],
      [x2 + nx, y2 + ny],
      [x2 - nx, y2 - ny],
      [x1 - nx, y1 - ny],
    ],
    n,
  )
}

// ============================================================================
// SVG PATH HELPERS
// ============================================================================

/** Convert a point array to an SVG `d` attribute string (M…L…Z). */
export function pointsToD(pts: [number, number][]): string {
  if (pts.length === 0) return ""
  const p0 = pts[0]!
  let d = `M${p0[0].toFixed(1)},${p0[1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!
    d += `L${p[0].toFixed(1)},${p[1].toFixed(1)}`
  }
  return d + "Z"
}

// ============================================================================
// INTERPOLATION
// ============================================================================

/** Quadratic ease-in-out (t in 0..1). */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

/** Linearly interpolate between two 2D points. */
export function lerp(
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}
