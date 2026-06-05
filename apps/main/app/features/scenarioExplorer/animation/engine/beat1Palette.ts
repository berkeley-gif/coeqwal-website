/* Beat 1 palette primitives.
 *
 * `beat1FillExpr` and its color constants live here in the engine
 * package so the storyboard component and the map-paint arbiters all
 * build the exact same Mapbox fill expression from one source. The
 * component imports from here, never the reverse, which keeps the
 * engine free of an upward dependency on the feature layer.
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
 *  blue so all polygons end up the same color before the tier-color blend. */
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
