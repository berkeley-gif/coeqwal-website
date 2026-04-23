/* Beat 1 palette primitives.
 *
 * These constants and the `beat1FillExpr` helper mirror the component-local
 * definitions in `TierAnimationSection.tsx` lines 112 to 157. Kept in
 * the engine package so arbiters can build the same expression without
 * importing from the component (which would create an upward dependency
 * from engine to feature, breaking the layering that Phase 0's
 * `beats.ts` header calls out).
 *
 * If the component-side values ever change, these must track them.
 * The writers audit does not cover expression equality, so this is a
 * manual invariant for now.
 */

export const BEAT1_COLORS = ["#BDE1E4", "#92C1D5", "#186b88"] as const
export const BEAT1_CYCLE = 90
export const BEAT1_MID = BEAT1_COLORS[1]

function blendHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a)
  const [r2, g2, b2] = parseHex(b)
  const r = Math.round(r1 + (r2 - r1) * t)
    .toString(16)
    .padStart(2, "0")
  const g = Math.round(g1 + (g2 - g1) * t)
    .toString(16)
    .padStart(2, "0")
  const bl = Math.round(b1 + (b2 - b1) * t)
    .toString(16)
    .padStart(2, "0")
  return `#${r}${g}${bl}`
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

/** Mapbox fill-color expression that cycles each polygon through the three
 *  beat-1 blues. `convergence` (0 to 1) shrinks the palette toward a single
 *  blue so all polygons end up the same color before the tier-color blend.
 *
 *  Verbatim port of the component-local `beat1FillExpr` at
 *  `TierAnimationSection.tsx` line 134. */
export function beat1FillExpr(
  phase: number,
  convergence = 0,
): readonly unknown[] {
  const c0 =
    convergence > 0
      ? blendHex(BEAT1_COLORS[0], BEAT1_MID, convergence)
      : BEAT1_COLORS[0]
  const c1 = BEAT1_MID
  const c2 =
    convergence > 0
      ? blendHex(BEAT1_COLORS[2], BEAT1_MID, convergence)
      : BEAT1_COLORS[2]
  return [
    "interpolate-hcl",
    ["linear"],
    ["%", ["+", ["coalesce", ["id"], 0], Math.round(phase)], BEAT1_CYCLE],
    0,
    c0,
    30,
    c1,
    60,
    c2,
    89,
    c0,
  ]
}
