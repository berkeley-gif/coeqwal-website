/* Shared types for the storyboard text overlay and its label-geometry
 * hook. Kept in their own file so `BeatTextOverlay`, `Narration`, and
 * `useOutcomeLabelGeometry` can all import them without a circular
 * dependency. */

/** A column heading ("Consumptive uses" / "Non-consumptive uses") shown
 *  above the Beat 2 outcome grid. */
export interface ColumnEyebrow {
  label: string
  x: number
  y: number
  columnWidth: number
  animationStart: number
}

/** One outcome row in the Beat 2 two-column grid (title + glyph + caption). */
export interface Beat2LayoutItem {
  code: string
  label: string
  column: 0 | 1
  columnWidth: number
  isActive: boolean
  locationCount: number
  /** Pixel height the glyph placeholder should reserve in document flow. */
  targetHeight: number
  /** Caption rendered under the glyph (e.g. "12 locations"). */
  locationDescription: string
}

/** Full Beat 2 layout: the outcome rows plus the two column headings. */
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
