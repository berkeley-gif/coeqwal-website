/**
 * chartMarks - pure builders mapping explorer members onto @repo/viz mark
 * props. Shared by ChartCard (live render) and OffscreenDataCapture (share
 * snapshot) so the exported image is guaranteed to match the on-screen chart.
 * No React, no store reads.
 */

import type {
  BoxPlotDatum,
  CategoricalBarDatum,
  ExceedanceSeries,
} from "@repo/viz"
import {
  linearTrendPerYear,
  toExceedancePoints,
  type SeriesStats,
} from "../config/mockDataEngine"
import { formatValue } from "../hooks/interpretiveText"
import type { VariableDef } from "../config/variableRegistry"

/** Long form of the thousand acre-feet unit for y-axis titles. */
const TAF_AXIS_LABEL = "thousand acre feet (TAF)"

/**
 * Y-axis label for a chart of `variable` in `view`, given the view-resolved
 * display unit the card already computes. Order of precedence: the CV view
 * reads "CV"; a registry `axisLabel` wins (salmon, X2); the thousand
 * acre-feet unit reads its long form so no chart shows a bare "TAF";
 * everything else (percent, feet, proportion, dollars) reads the unit.
 * Shared by the distribution charts and the Stats mean panel so the two
 * cannot disagree. Pure.
 */
export function axisLabelFor(
  variable: VariableDef | undefined,
  view: string,
  unit: string,
): string {
  if (view === "cv") return "CV"
  if (variable?.axisLabel) return variable.axisLabel
  if (unit === "TAF") return TAF_AXIS_LABEL
  return unit
}

/** The member fields the mark builders need (structural subset of VariableMember). */
export interface MarkMember {
  id: string
  label: string
  series: number[]
  stats: SeriesStats
  value: number
  waterYears?: number[]
  /** Per-member provenance, carried through to the CSV payload (not drawn) */
  isLive?: boolean
  /** True when the scenario is not modeled for this variable at all. Such a
   *  member is recorded in exports (labeled, with empty values) but is never
   *  DRAWN: its series exists only because the sample engine always produces
   *  one, and drawing it would put a fabricated curve on the figure. */
  liveDataMissing?: boolean
}

/** One bar per member (the "cv" and "value" views). */
export function toBars(
  members: readonly MarkMember[],
  colors: readonly string[],
): CategoricalBarDatum[] {
  return members.map((m, i) => ({
    id: m.id,
    label: m.label,
    value: m.value,
    color: colors[i],
  }))
}

/** One box per member (the "dist"/"pct" views, box style). */
export function toBoxes(
  members: readonly MarkMember[],
  colors: readonly string[],
): BoxPlotDatum[] {
  return members.map((m, i) => ({
    id: m.id,
    label: m.label,
    color: colors[i],
    stats: {
      min: m.stats.min,
      q1: m.stats.p25,
      median: m.stats.p50,
      q3: m.stats.p75,
      max: m.stats.max,
      mean: m.stats.mean,
      p10: m.stats.p10,
      p90: m.stats.p90,
    },
  }))
}

/** One exceedance curve per member (the "dist"/"pct" views, exceedance style). */
export function toSeries(
  members: readonly MarkMember[],
  colors: readonly string[],
): ExceedanceSeries[] {
  return members.map((m, i) => ({
    id: m.id,
    label: m.label,
    points: toExceedancePoints(m.series),
    color: colors[i],
  }))
}

/** One panel of the Stats chart style. */
export interface StatsPanelSpec {
  key: "mean" | "cv" | "trend"
  /** Panel caption on screen, and the panel's y-axis label in the composed
   *  export, so a stitched figure still says what each panel shows. */
  title: string
  /** Y-axis label on screen (the full unit sentence for the mean panel). */
  yLabel: string
  format: (v: number) => string
  valueOf: (m: MarkMember) => number
}

/**
 * The side-by-side summary panels of the Stats chart style: mean and CV for
 * every variable, plus the linear level trend (ft/yr) on the groundwater
 * level view. One builder shared by the live ChartCard and the off-screen
 * capture, so a Stats export cannot disagree with the Stats card. Pure.
 */
export function buildStatsPanels(
  view: string,
  unit: string,
  axisLabel: string,
): StatsPanelSpec[] {
  const panels: StatsPanelSpec[] = [
    {
      key: "mean",
      title: `Mean (${unit})`,
      yLabel: axisLabel,
      format: (v) => formatValue(v, unit),
      valueOf: (m) => m.stats.mean,
    },
    {
      key: "cv",
      title: "CV",
      yLabel: "CV",
      format: (v) => v.toFixed(2),
      valueOf: (m) => m.stats.cv,
    },
  ]
  if (view === "level") {
    panels.push({
      key: "trend",
      title: "Trend (ft/yr)",
      yLabel: "ft/yr",
      format: (v) => formatValue(v, "ft/yr"),
      valueOf: (m) => linearTrendPerYear(m.series),
    })
  }
  return panels
}
