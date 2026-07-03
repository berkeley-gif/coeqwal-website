/**
 * Percentile-band color ramps for the Data in Depth chart sections.
 *
 * Each ramp is a four-stop sequential scale consumed by PercentileMatrix and
 * the shared BandLegend. The stops go from lightest to darkest: range
 * (q0 to q100), outer (q10 to q90), inner (q30 to q70), and median (q50).
 *
 * NOTE: these values are provisional. Once the band palette is finalized, the
 * ramps should move into the shared theme (`@repo/ui` theme.palette) and be
 * referenced from there, the same way tier colors live in theme.palette.tiers.
 */

export interface BandColors {
  range: string
  outer: string
  inner: string
  median: string
}

/**
 * Delivery / storage percentile bands (blue).
 *
 * `range` is the q0/q100 min-max dashed reference line color (no longer a
 * fill). `outer` and `inner` are the solid-over-white equivalents of the
 * single-hue 0.2 / 0.45 alpha swaths drawn by PercentileMatrix, so the legend
 * matches the rendered chart.
 */
export const DELIVERY_BAND_COLORS: BandColors = {
  range: "#6baed6", // q0/q100 min-max dashed line
  outer: "#d6e6f2", // q10-q90
  inner: "#a2c7e1", // q30-q70
  median: "#08519c", // q50 (darkest)
}

/**
 * Reservoir storage bands. Currently identical to the delivery ramp, aliased
 * rather than re-declared so the two stay in sync until finalization decides
 * whether storage should get its own scale.
 */
export const STORAGE_BAND_COLORS: BandColors = DELIVERY_BAND_COLORS

/** Shortage percentile bands (orange/amber). */
export const SHORTAGE_BAND_COLORS: BandColors = {
  range: "#fdae6b", // q0/q100 min-max dashed line
  outer: "#ffe8d8", // q10-q90
  inner: "#fecca7", // q30-q70
  median: "#a63603", // q50 (darkest)
}

/** Percent-of-unimpaired percentile bands (green). */
export const PCT_BAND_COLORS: BandColors = {
  range: "#66bb6a", // q0/q100 min-max dashed line
  outer: "#a8dcbe",
  inner: "#6ec297",
  median: "#1d7a45",
}

/** Delta salinity bands (teal), distinct from delivery blue and shortage orange. */
export const SALINITY_BAND_COLORS: BandColors = {
  range: "#4db6ac", // q0/q100 min-max dashed line
  outer: "#b2dfdb",
  inner: "#80cbc4",
  median: "#00695c",
}

/** Delta inflow bands (indigo). */
export const INFLOW_BAND_COLORS: BandColors = {
  range: "#7986cb", // q0/q100 min-max dashed line
  outer: "#9fa8da",
  inner: "#5c6bc0",
  median: "#283593",
}

/** Delta export bands (amber/orange). */
export const EXPORT_BAND_COLORS: BandColors = {
  range: "#ffca28", // q0/q100 min-max dashed line
  outer: "#ffe082",
  inner: "#ffb300",
  median: "#e65100",
}

/**
 * Delta outflow bands (blue). A slightly different blue from the delivery
 * ramp today. Reconcile the two at finalization if they should match.
 */
export const OUTFLOW_BAND_COLORS: BandColors = {
  range: "#64b5f6", // q0/q100 min-max dashed line
  outer: "#90caf9",
  inner: "#42a5f5",
  median: "#1565c0",
}
