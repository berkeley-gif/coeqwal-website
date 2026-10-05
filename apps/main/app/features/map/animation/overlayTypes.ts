/* Shared types for the storyboard's right-panel outcome grid.
 * Kept separate so `BeatTextOverlay`, `useOutcomeLabelGeometry`, and
 * `useStoryboardLayout` import them without a circular dependency. */

/** An invisible spacer at the top of each grid column. It reserves the slot
 *  the view-mode header ("Distribution view" etc.) fades into. The columns
 *  used to have visible headings here, hence the name. */
export interface ColumnEyebrow {
  /** `progress` value at which the spacer starts fading in. */
  animationStart: number
}

/** One outcome in the two-column grid (title + glyph + caption). */
export interface Beat2LayoutItem {
  code: string
  /** Outcome title shown above the glyph. */
  label: string
  /** 0 = left, 1 = right. Assigned by hand, see FIRST_COLUMN_CODES in
   *  useStoryboardLayout. */
  column: 0 | 1
  /** False when the outcome has no data to draw; only the title renders. */
  isActive: boolean
  /** Pixel height the glyph placeholder should reserve in document flow. */
  targetHeight: number
  /** Caption rendered under the glyph (e.g. "12 locations"). */
  locationDescription: string
}

/** Full grid layout: the outcomes plus one header spacer per column. */
export interface Beat2Layout {
  items: Beat2LayoutItem[]
  eyebrows: ColumnEyebrow[]
}

/** Panel-relative rect of a glyph placeholder, reported up to the parent
 *  so the SVG morph overlay knows where each glyph should land. */
export interface GlyphRect {
  x: number
  y: number
  width: number
  height: number
}
