/* Shared demand-units paint constants.
 *
 * One source of truth for the gold outline and zoom-aware opacities painted
 * by both the interactive layer (`InteractivePaintArbiter`) and the scripted
 * storyboard (`TierAnimationSection`, `engine/actorGroups`), so the two views
 * don't drift apart.
 */

import type { DemandUnitsOverlayState } from "./engine/types"

/** Gold highlight color for active demand-unit outlines (hover and pin). */
export const HIGHLIGHT_GOLD = "#ffd87e"

/** Base demand-units fill opacity below the zoom threshold. */
export const BASE_FILL_OPACITY = 0.75

/** Zoom level where the fill-opacity step expression switches branches. */
export const ZOOM_THRESHOLD = 8

/** Demand-units fill opacity at and above the zoom threshold. */
export const ZOOMED_IN_OPACITY = 0.75

/** Default demand-units fill-opacity (no spotlight or pin) as a zoom-keyed
 *  Mapbox step expression. Typed `unknown` so callers cast to their API's
 *  expression type. */
export const ZOOM_AWARE_BASE_OPACITY: unknown = [
  "step",
  ["zoom"],
  BASE_FILL_OPACITY,
  ZOOM_THRESHOLD,
  ZOOMED_IN_OPACITY,
]

/* Shared outcome-polygon look.
 *
 * Three expressions for the settled outcome polygon: fill recedes on zoom-in,
 * stroke widens and tucks inside the boundary. Applied by
 * `OutcomePolygonLayer` (WBA, reservoir, demand-units) and matched by
 * `InteractivePaintArbiter` so the interactive view matches the declarative
 * one. Typed `unknown` so callers cast to their Mapbox expression type. */

/** Fill opacity interpolated across zoom (5 to 10): dense low-zoom fills
 *  stay legible, high-zoom fills recede. */
export const OUTCOME_FILL_OPACITY: unknown = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  0.75,
  8,
  0.55,
  10,
  0.35,
]

/** Outline width interpolated across zoom (5 to 11). */
export const OUTCOME_OUTLINE_WIDTH: unknown = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  0.5,
  7,
  1,
  9,
  2,
  11,
  3,
]

/** Outline offset interpolated across zoom (5 to 11), keeping the stroke
 *  just inside the polygon boundary. */
export const OUTCOME_OUTLINE_OFFSET: unknown = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  -0.25,
  7,
  -0.5,
  9,
  -1,
  11,
  -1.5,
]

/** Demand unit highlighted in the loi-highlight beat (Glenn Colusa I.D.,
 *  Sacramento Valley). In the overlay must-include pin set so the square
 *  renders deterministically. */
export const LOI_DU_ID = "08N_SA2"

/* Shared overlay-expression builders.
 *
 * Pure helpers that build the gold-on-active outline and the spotlight /
 * pinned / base fill-opacity expressions, so the two interactive painters
 * (demand-units and non-DU polygon arbiters) can't drift. They construct
 * expressions only, they don't touch the map.
 */

/** Outline paint for the "some features active" case: gold over `baseColor`,
 *  a wider stroke on active features, and opacity that hides non-active
 *  outlines. `baseColor` is what non-active features use (the arbiter's
 *  tier-color expression, or a layer's original color). */
export function buildActiveOutlineExpr(
  activeIds: readonly string[],
  idProperty: string,
  baseColor: unknown,
): { lineColor: unknown; lineWidth: unknown; lineOpacity: unknown } {
  const activeMatch = ["in", ["get", idProperty], ["literal", [...activeIds]]]
  return {
    lineColor: ["case", activeMatch, HIGHLIGHT_GOLD, baseColor],
    lineWidth: ["case", activeMatch, 2, 1],
    lineOpacity: ["case", activeMatch, 1, 0],
  }
}

/** Fill-opacity in priority order: spotlight, pinned, base. With a spotlight
 *  on but nothing matched, everything dims to 0.12. */
export function buildFillOpacityExpr(
  overlay: DemandUnitsOverlayState,
  idProperty: string,
): unknown {
  if (overlay.hasSpotlight) {
    if (overlay.spotlightFeatureIds.length === 0) return 0.12
    const spotlightMatch = [
      "in",
      ["get", idProperty],
      ["literal", [...overlay.spotlightFeatureIds]],
    ]
    return ["case", spotlightMatch, 0.9, 0.12]
  }
  if (overlay.pinnedFeatureIds.length > 0) {
    const pinnedMatch = [
      "in",
      ["get", idProperty],
      ["literal", [...overlay.pinnedFeatureIds]],
    ]
    return [
      "step",
      ["zoom"],
      ["case", pinnedMatch, 1, BASE_FILL_OPACITY],
      ZOOM_THRESHOLD,
      ZOOMED_IN_OPACITY,
    ]
  }
  return ZOOM_AWARE_BASE_OPACITY
}
