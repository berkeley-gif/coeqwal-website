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
import { toExceedancePoints, type SeriesStats } from "../config/mockDataEngine"

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
