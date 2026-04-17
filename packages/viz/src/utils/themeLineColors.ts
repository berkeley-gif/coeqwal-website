/**
 * Hand-curated line color palettes for scenario charts (radar, parallel
 * coordinates, etc.).
 *
 * Each theme has a 7-color palette of medium-to-dark, saturated colors that
 * are all clearly visible against a white chart background. Colors within a
 * theme share a hue family but vary in lightness and saturation so that up to
 * 7 scenarios from the same theme are distinguishable.
 *
 * getThemeLineColor uses THEME_LINE_PALETTES_LIGHT_TO_DARK`
 * — the same hexes sorted by WCAG relative luminance so that, within a theme,
 * index 0 is the lightest swatch and higher indices read progressively darker.
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

/** WCAG 2.x relative luminance for #rrggbb (0 = black, 1 = white). */
function relativeLuminanceFromHex(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return 0
  const n = parseInt(m[1]!, 16)
  const toLin = (c: number) => {
    const x = c / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  }
  const r = toLin((n >> 16) & 255)
  const g = toLin((n >> 8) & 255)
  const b = toLin(n & 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Same colors as authoring palette, sorted lightest → darkest by relative luminance. */
function sortPaletteLightToDark(colors: readonly string[]): string[] {
  return [...colors]
    .map((h, originalIndex) => ({
      h,
      lum: relativeLuminanceFromHex(h),
      originalIndex,
    }))
    .sort((a, b) => {
      if (b.lum !== a.lum) return b.lum - a.lum
      return a.originalIndex - b.originalIndex
    })
    .map((x) => x.h)
}

const THEME_KEYS = Object.keys(THEME_LINE_PALETTES) as ThemeKey[]

/** Per-theme palettes for chart lines: index 0 = lightest, last = darkest. */
export const THEME_LINE_PALETTES_LIGHT_TO_DARK: Record<ThemeKey, string[]> =
  THEME_KEYS.reduce(
    (acc, key) => {
      acc[key] = sortPaletteLightToDark(THEME_LINE_PALETTES[key])
      return acc
    },
    {} as Record<ThemeKey, string[]>,
  )

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
 * Other scenarios use the theme palette in **light-to-dark** order so that
 * earlier positions within a theme (by app ordering) read as lighter traces.
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
  const palette =
    THEME_LINE_PALETTES_LIGHT_TO_DARK[theme] ??
    THEME_LINE_PALETTES_LIGHT_TO_DARK.baseline
  return palette[Math.min(indexWithinTheme, palette.length - 1)] ?? "#666666"
}
