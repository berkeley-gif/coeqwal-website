/* Shared demand-units paint constants
 *
 * The interactive demand-units layer (`InteractivePaintArbiter`) and the
 * scripted storyboard (`TierAnimationSection` and `engine/actorGroups`)
 * paint the same gold outline and the same zoom-aware opacities. If they
 * drift apart, the interactive view stops matching the scripted beats.
 * These live here so there is one source of truth instead of values
 * hand-copied across files.
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

/** Default demand-units fill-opacity (no spotlight or pin) as a Mapbox
 *  step expression keyed on zoom. Typed `unknown` so callers cast it to
 *  the expression type their API expects. */
export const ZOOM_AWARE_BASE_OPACITY: unknown = [
  "step",
  ["zoom"],
  BASE_FILL_OPACITY,
  ZOOM_THRESHOLD,
  ZOOMED_IN_OPACITY,
]

/* Shared outcome-polygon look
 *
 * These three expressions define how every outcome polygon fill and outline
 * looks once settled: the fill recedes as you zoom in, and the stroke widens
 * and tucks inside the boundary. `OutcomePolygonLayer` applies them to the
 * WBA, reservoir, and demand-units layers, and `InteractivePaintArbiter`
 * lands its demand-units fade-in on the same values, so the interactive view
 * matches the declarative one. Typed `unknown` so callers cast to the
 * expression type their Mapbox API expects. */

/** Fill opacity interpolated across zoom (5 to 10), so dense low-zoom fills
 *  stay legible and high-zoom fills recede. */
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
 *  Sacramento Valley). Read by the storyboard choreography and by the
 *  overlay must-include pin set so the square renders deterministically. */
export const LOI_DU_ID = "08N_SA2"

/* Shared overlay-expression builders
 *
 * Both interactive painters (the demand-units arbiter and the non-DU
 * polygon arbiter) draw the same highlight-color-on-active (gold) outline and the same
 * spotlight / pinned / base fill-opacity. These pure helpers build the
 * Mapbox expressions so the two painters can never drift. They only
 * construct expressions, they don't touch the map.
 */

/** Outline paint for the "some features active" case: a highlight `case` over
 *  the base color, a wider stroke on active features, and opacity that
 *  hides non-active outlines. `baseColor` is what non-active features use
 *  (the arbiter's tier-color expression, or a layer's original color). */
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

/** Fill-opacity in priority order: spotlight, then pinned, then base. When
 *  a spotlight is on but nothing matches, everything dims to 0.12. */
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
