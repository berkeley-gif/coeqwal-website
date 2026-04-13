/**
 * Hand-curated line color palettes for scenario charts (radar, parallel
 * coordinates, etc.).
 *
 * Each theme has a 7-color palette of medium-to-dark, saturated colors that
 * are all clearly visible against a white chart background. Colors within a
 * theme share a hue family but vary in lightness and saturation so that up to
 * 7 scenarios from the same theme are distinguishable.
 *
 * The palettes are ordered so the first few slots are the most "canonical"
 * colors for each theme, with later slots offering variation. This means the
 * most common case (1–3 scenarios per theme) always gets the strongest colors.
 *
 * Theme-to-hue mapping:
 *   baseline   warm amber / brown
 *   ag_gw      green (medium to forest)
 *   eco        teal / blue
 *   delta      purple / violet
 *   cws        orange / red
 *   unthemed   neutral grey
 *
 * Special case: s0020 (Current Operations) uses a dark goldenrod so its chart
 * line reads as the canonical baseline scenario while remaining visible on
 * white backgrounds.
 */

export type ThemeKey =
  | "baseline"
  | "ag_gw"
  | "eco"
  | "delta"
  | "cws"
  | "unthemed"

export const THEME_LINE_PALETTES: Record<ThemeKey, string[]> = {
  baseline: [
    "#d4a017",
    "#8c6800",
    "#e6b830",
    "#a67c00",
    "#c49212",
    "#785800",
    "#daa520",
  ],
  ag_gw: [
    "#2e9e50",
    "#0e6028",
    "#55b56a",
    "#1a7a38",
    "#3c8e52",
    "#157032",
    "#48a860",
  ],
  eco: [
    "#1890b0",
    "#08587e",
    "#30b0cc",
    "#0c6e94",
    "#1580a0",
    "#0a6488",
    "#28a2ba",
  ],
  delta: [
    "#8868bb",
    "#503290",
    "#a282cc",
    "#6646aa",
    "#7858b2",
    "#5c3aa0",
    "#9678c2",
  ],
  cws: [
    "#e06020",
    "#a02010",
    "#f08030",
    "#c03818",
    "#d04c1c",
    "#b02c14",
    "#ea7028",
  ],
  unthemed: [
    "#707070",
    "#383838",
    "#8a8a8a",
    "#505050",
    "#5e5e5e",
    "#444444",
    "#7e7e7e",
  ],
}

/**
 * Dark goldenrod for s0020 (Current Operations).
 * Recognizable as the "baseline gold" while remaining clearly visible on
 * white chart backgrounds (unlike the lighter badge color #ffd87e).
 */
const CURRENT_OPS_COLOR = "#cc9a06"

/**
 * Returns the line color for a scenario.
 *
 * s0020 (Current Operations) always returns the dark goldenrod color.
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
