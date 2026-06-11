/* Shared storyboard geometry
 *
 * The radar and heatmap visuals are drawn in two places that must agree.
 * `OutcomeMorphOverlay` draws the SVG dots and cells, and
 * `useOutcomeLabelGeometry` positions the HTML axis labels that ring or
 * sit beside them. When the two computed different frames, the labels
 * drifted off their dots and cells. These helpers are the one source of
 * truth for the frame both sides share.
 *
 * All values are in panel coordinates (the right third of the panel,
 * lifted by `STORYBOARD_VISUAL_LIFT_PX`).
 */

import { STORYBOARD_VISUAL_LIFT_PX } from "./animationTiming"

export interface RadarFrame {
  /** Center x of the radar. */
  cx: number
  /** Center y of the radar (sits above the panel midline). */
  cy: number
  /** Radius of the outer (best tier) ring. */
  rMax: number
}

/** Radar center and outer radius for a panel of the given size. */
export function computeRadarFrame(panelW: number, panelH: number): RadarFrame {
  const panelLeft = panelW * (2 / 3)
  const rightW = panelW - panelLeft
  const cx = panelLeft + rightW / 2
  const cy = panelH * 0.42 - STORYBOARD_VISUAL_LIFT_PX
  const rMax = Math.min(rightW / 2, panelH / 2) * 0.6
  return { cx, cy, rMax }
}

/** Angle in radians of vertex `i` of `n`, starting at the top and going
 *  clockwise. Both the dots and the axis labels walk vertices in the
 *  same order, so they land on the same angle. */
export function radarVertexAngle(i: number, n: number): number {
  return (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2
}

/** Ring radius for a tier value. Tier 1 (best) is outermost, tier 4
 *  (worst) is innermost. */
export function radarTierRadius(rMax: number, tier: number): number {
  return (rMax * (4.5 - tier)) / 4
}

/** Horizontal padding inside the right third before the label column. */
export const HEAT_SIDE_PAD = 24
/** Width reserved for the row labels to the left of the cells. */
export const HEAT_LABEL_COL_W = 110
/** Gap between the label column and the first cell column. */
export const HEAT_LABEL_GAP = 12
/** Nudge applied to the whole heatmap block so it reads as centered. */
export const HEAT_BLOCK_SHIFT_X = -10

export interface HeatmapColumnFrame {
  /** Left edge of the right third of the panel. */
  panelLeft: number
  /** Left edge of the first cell column. */
  heatmapLeft: number
  /** Row height. */
  cellH: number
  /** Top edge of the first row. */
  columnTop: number
  /** x the row labels right-align to (the label gutter's right edge). */
  labelRightX: number
}

/** The parts of the heatmap layout that the SVG cells and the HTML row
 *  labels both depend on. The overlay computes its own cell widths on
 *  top of this. The labels only need the left edge, row height, and top. */
export function computeHeatmapColumnFrame(
  panelW: number,
  panelH: number,
  rowCount: number,
): HeatmapColumnFrame {
  const panelLeft = panelW * (2 / 3)
  const rightColLeft = panelLeft + HEAT_SIDE_PAD + HEAT_BLOCK_SHIFT_X
  const heatmapLeft = rightColLeft + HEAT_LABEL_COL_W + HEAT_LABEL_GAP
  const availableH = panelH * 0.8
  const cellH = Math.min(44, availableH / Math.max(rowCount, 1))
  const totalH = rowCount * cellH
  const columnTop = panelH / 2 - totalH / 2 - STORYBOARD_VISUAL_LIFT_PX
  const labelRightX = heatmapLeft - HEAT_LABEL_GAP
  return { panelLeft, heatmapLeft, cellH, columnTop, labelRightX }
}

/** Vertical center of heatmap row `i`. */
export function heatmapCellCenterY(
  columnTop: number,
  cellH: number,
  i: number,
): number {
  return columnTop + (i + 0.5) * cellH
}
