/**
 * markerShape - how a point location is drawn on the Explore maps and in
 * their legends. Pure module.
 *
 * Every point location is a square on every tool, so the same location
 * reads the same way on Bar, Radar, Heatmap and Distribution. Distribution's
 * comparison mode keeps its direction triangles for improved and worsened
 * locations; unchanged locations are squares.
 *
 * Exports: getPointMarkerShape, comparisonDirection, SQUARE_MARKER_RADIUS_PX,
 * MarkerShape, ComparisonDirection.
 */

export type MarkerShape = "square" | "triangleUp" | "triangleDown"

export type ComparisonDirection = "improved" | "unchanged" | "worsened"

/** Shape for one point marker. No direction means a plain location. */
export function getPointMarkerShape(
  direction?: ComparisonDirection,
): MarkerShape {
  if (direction === "improved") return "triangleUp"
  if (direction === "worsened") return "triangleDown"
  return "square"
}

/** Direction of change from the baseline tier. Tier 1 is the best
 *  (Optimal), so a lower tier number than the baseline is an improvement. */
export function comparisonDirection(
  tier: number,
  baselineTier: number,
): ComparisonDirection {
  if (tier < baselineTier) return "improved"
  if (tier > baselineTier) return "worsened"
  return "unchanged"
}

/** Corner radius, in CSS px, for square markers: small enough that a
 *  12 to 20 px marker still reads as a square. */
export const SQUARE_MARKER_RADIUS_PX = 2
