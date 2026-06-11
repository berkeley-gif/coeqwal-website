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

/** Delivery / storage percentile bands (blue). */
export const DELIVERY_BAND_COLORS: BandColors = {
  range: "#d9eafb", // q0-q100 (lightest)
  outer: "#c5dbf3", // q10-q90
  inner: "#a2bee1", // q30-q70
  median: "#2c5aa0", // q50 (darkest)
}

/**
 * Reservoir storage bands. Currently identical to the delivery ramp, aliased
 * rather than re-declared so the two stay in sync until finalization decides
 * whether storage should get its own scale.
 */
export const STORAGE_BAND_COLORS: BandColors = DELIVERY_BAND_COLORS

/** Shortage percentile bands (orange/amber). */
export const SHORTAGE_BAND_COLORS: BandColors = {
  range: "#fef3e2",
  outer: "#fdd49e",
  inner: "#fdae6b",
  median: "#e6550d",
}

/** Percent-of-unimpaired percentile bands (green). */
export const PCT_BAND_COLORS: BandColors = {
  range: "#d5f0e2",
  outer: "#a8dcbe",
  inner: "#6ec297",
  median: "#1d7a45",
}

/** Delta salinity bands (teal), distinct from delivery blue and shortage orange. */
export const SALINITY_BAND_COLORS: BandColors = {
  range: "#e0f2f1",
  outer: "#b2dfdb",
  inner: "#80cbc4",
  median: "#00695c",
}

/** Delta inflow bands (indigo). */
export const INFLOW_BAND_COLORS: BandColors = {
  range: "#e8eaf6",
  outer: "#9fa8da",
  inner: "#5c6bc0",
  median: "#283593",
}

/** Delta export bands (amber/orange). */
export const EXPORT_BAND_COLORS: BandColors = {
  range: "#fff8e1",
  outer: "#ffe082",
  inner: "#ffb300",
  median: "#e65100",
}

/**
 * Delta outflow bands (blue). A slightly different blue from the delivery
 * ramp today. Reconcile the two at finalization if they should match.
 */
export const OUTFLOW_BAND_COLORS: BandColors = {
  range: "#e3f2fd",
  outer: "#90caf9",
  inner: "#42a5f5",
  median: "#1565c0",
}
