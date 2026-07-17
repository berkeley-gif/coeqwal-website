/* Blue palette primitives. `blueFillExpr` and its color constants live
 * here so the storyboard component and the map-paint arbiters build the
 * same Mapbox fill expression from one source. Dependency points one way
 * (component imports from here) so the engine doesn't depend on the
 * feature layer. */

export const BLUE_COLORS = ["#BDE1E4", "#92C1D5", "#186b88"] as const
export const BLUE_CYCLE = 90
export const BLUE_MID = BLUE_COLORS[1]

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

/** Mapbox fill-color expression that cycles each polygon through the
 *  three blues. `convergence` (0 to 1) shrinks the palette toward a
 *  single blue so all polygons converge before the tier-color blend. */
export function blueFillExpr(
  phase: number,
  convergence = 0,
): readonly unknown[] {
  const c0 =
    convergence > 0
      ? blendHex(BLUE_COLORS[0], BLUE_MID, convergence)
      : BLUE_COLORS[0]
  const c1 = BLUE_MID
  const c2 =
    convergence > 0
      ? blendHex(BLUE_COLORS[2], BLUE_MID, convergence)
      : BLUE_COLORS[2]
  return [
    "interpolate-hcl",
    ["linear"],
    ["%", ["+", ["coalesce", ["id"], 0], Math.round(phase)], BLUE_CYCLE],
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
