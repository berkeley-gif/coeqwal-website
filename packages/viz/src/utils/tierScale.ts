/**
 * Source for discrete tier scale
 *
 * Outcomes are reported on a discrete tier scale where 1 is best and
 * `TIER_COUNT` is worst. These helpers convert between that scale, the API's
 * 0-1 normalized score, and the radar's [-1, 1] drawing axis. The constants
 * and transforms live here so the scale is defined in one place.
 */

/** Number of discrete tier levels, 1 (best) through `TIER_COUNT` (worst) */
export const TIER_COUNT = 4

/** Tier levels in order, best to worst */
export const TIER_LEVELS = [1, 2, 3, 4] as const

/** Map a 0-1 normalized score (higher = better) onto the radar's [-1, 1] axis */
export function normalizedToRadar(normalized: number): number {
  return normalized * 2 - 1
}

/**
 * Convert a radar axis value (-1 center, +1 edge) back to a tier on the
 * 1 (best) to `TIER_COUNT` (worst) scale
 */
export function radarValueToTier(v: number): number {
  return TIER_COUNT - (v + 1) * ((TIER_COUNT - 1) / 2)
}

/** Round and clamp a continuous tier value into the integer range [1, `TIER_COUNT`] */
export function clampTier(value: number): number {
  return Math.min(TIER_COUNT, Math.max(1, Math.round(value)))
}
