/* Shared demand-units paint constants
 *
 * The interactive demand-units layer (`InteractivePaintArbiter`) and the
 * scripted storyboard (`TierAnimationSection` and `engine/actorGroups`)
 * paint the same gold outline and the same zoom-aware opacities. If they
 * drift apart, the interactive view stops matching the scripted beats.
 * These live here so there is one source of truth instead of values
 * hand-copied across files.
 */

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

/** Demand unit highlighted in the loi-highlight beat (Glenn Colusa I.D.,
 *  Sacramento Valley). Read by the storyboard choreography and by the
 *  overlay must-include pin set so the square renders deterministically. */
export const LOI_DU_ID = "08N_SA2"
