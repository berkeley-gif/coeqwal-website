/**
 * Categorical series palette for multi-member comparison charts
 * (ExceedanceChart, BoxPlot, CategoricalBarChart).
 *
 * Okabe-Ito colorblind-safe hues, assigned by array position: color follows
 * the member's position in the caller's selection order and must not be
 * re-cycled when members are filtered. Verified for adjacent-pair CVD
 * separation and lightness on a light surface; the amber, pink, and sky
 * steps sit below 3:1 contrast against white, so any surface using them
 * must pair marks with visible labels or a legend (all three charts and the
 * Data-in-Depth legend do).
 */
export const SERIES_PALETTE = [
  "#0072B2", // blue
  "#E69F00", // amber
  "#009E73", // green
  "#CC79A7", // pink
  "#D55E00", // vermillion
  "#56B4E9", // sky
] as const

/** Color for the member at `index`, cycling only past the palette's end. */
export function getSeriesColor(index: number): string {
  return SERIES_PALETTE[index % SERIES_PALETTE.length] as string
}
