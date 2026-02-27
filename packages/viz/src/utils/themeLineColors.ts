/**
 * Line color palettes for the parallel coordinates chart.
 *
 * Each scenario theme is assigned a 7-color ramp sampled from a D3 continuous
 * multi-hue interpolator. Multi-hue schemes vary both hue and lightness, giving
 * better within-theme differentiation than single-hue ramps.
 *
 * Colors are sampled over t = [PALETTE_START, PALETTE_END] of each interpolator
 * to stay in the mid-to-dark portion of the scale, ensuring all steps are
 * readable against a white chart background.
 *
 * Theme-to-interpolator mapping:
 *   baseline   interpolateYlOrBr   warm oranges and browns
 *   ag_gw      interpolateYlGn     medium to dark greens
 *   eco        interpolateGnBu     teal through blue
 *   delta      interpolatePuBu     slate through navy
 *   cws        interpolateYlOrRd   orange through red
 *
 * Special case: s0020 (Current Operations) uses the golden yellow baseline badge
 * color (#ffd87e) so its chart line and sidebar legend swatch match the
 * baseline ScenarioBadge exactly.
 */
import * as d3 from "d3"

// Local string-union mirror of ScenarioTheme (defined in apps/main/content/scenarios.ts).
// Kept here to avoid a cross-package import.
export type ThemeKey = "baseline" | "ag_gw" | "eco" | "delta" | "cws"

// Range within each interpolator to sample from.
// Start at 0.4 to skip the pale/light end; end at 0.95 to avoid pure black.
const PALETTE_START = 0.4
const PALETTE_END = 0.95
const PALETTE_STEPS = 7

const makeThemePalette = (interpolator: (t: number) => string): string[] =>
  Array.from({ length: PALETTE_STEPS }, (_, i) =>
    interpolator(PALETTE_START + (i / (PALETTE_STEPS - 1)) * (PALETTE_END - PALETTE_START)),
  )

/**
 * Seven mid-to-dark colors per theme, sampled from D3 multi-hue interpolators.
 * Index 0 is the lightest step in the sampled range; index 6 is the darkest.
 */
export const THEME_LINE_PALETTES: Record<ThemeKey, string[]> = {
  baseline: makeThemePalette(d3.interpolateYlOrBr),
  ag_gw:    makeThemePalette(d3.interpolateYlGn),
  eco:      makeThemePalette(d3.interpolateGnBu),
  delta:    makeThemePalette(d3.interpolatePuBu),
  cws:      makeThemePalette(d3.interpolateYlOrRd),
}

/**
 * Gold color for s0020 (Current Operations).
 * Matches the baseline ScenarioBadge background color (#ffd87e, golden yellow)
 * so the chart line and sidebar legend swatch both read as the canonical baseline scenario.
 */
const CURRENT_OPS_COLOR = "#ffd87e"

/**
 * Returns the line color for a scenario.
 *
 * s0020 (Current Operations) always returns the gold baseline badge color.
 * All other scenarios receive a color from their theme's palette,
 * indexed by their position among selected scenarios within that theme.
 *
 * @param theme            - The scenario's theme key
 * @param indexWithinTheme - Zero-based position among selected scenarios of this theme
 * @param scenarioId       - Optional scenario ID; s0020 always gets CURRENT_OPS_COLOR
 */
export function getThemeLineColor(
  theme: ThemeKey,
  indexWithinTheme: number,
  scenarioId?: string,
): string {
  if (scenarioId === "s0020") return CURRENT_OPS_COLOR
  const palette = THEME_LINE_PALETTES[theme] ?? THEME_LINE_PALETTES.baseline
  return palette[Math.min(indexWithinTheme, palette.length - 1)] ?? "#666666"
}
