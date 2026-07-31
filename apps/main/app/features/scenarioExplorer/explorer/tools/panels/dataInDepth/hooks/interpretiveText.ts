/**
 * Interpretive text for the Data-in-Depth explorer: the one-sentence summary
 * above each chart and the "How do I read this chart?" explainer bodies.
 *
 * Pure functions, no React: deterministic template sentences computed from
 * member stats, so they are unit-testable and reusable by a future
 * StatAnnotation component. Ported from the team's design prototype copy.
 */

import type { VariableView } from "../config/variableRegistry"
import {
  seriesStats,
  MOCK_YEARS,
  type MonthlyBand,
} from "../config/mockDataEngine"

export const WATER_MONTHS = [
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
]

export interface SummaryMember {
  id: string
  label: string
  /** Annual series (dist/pct/cv/value views) */
  series?: number[]
  /** Monthly bands (monthly view) */
  bands?: MonthlyBand[]
  /** Single value (cv/value views) */
  value?: number
  /** True when this member is the comparison reference */
  isReference?: boolean
}

export interface SummaryContext {
  view: VariableView
  compareBy: "scenarios" | "climates" | "locations"
  variableName: string
  unit: string
  locationName: string
  climateName: string
  scenarioName: string
}

export function formatValue(
  v: number | null | undefined,
  unit: string,
): string {
  if (v == null || Number.isNaN(v)) return "-"
  const a = Math.abs(v)
  let d: number
  if (unit === "$B") d = 1
  else if (unit === "ft/yr") d = 2
  else if (unit === "km") d = 1
  else if (unit === "%") d = a < 10 ? 1 : 0
  else if (a >= 10) d = a >= 100 ? 0 : 1
  else d = 2
  return v.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
}

export function percentDelta(reference: number, other: number): string {
  if (!reference) return "-"
  const d = ((other - reference) / Math.abs(reference)) * 100
  return `${d >= 0 ? "+" : ""}${d.toFixed(0)}%`
}

/**
 * One deterministic summary sentence for the current chart. Returns plain
 * text (no markup); the caller renders emphasis.
 */
export function summarySentence(
  members: SummaryMember[],
  ctx: SummaryContext,
): string {
  if (members.length === 0) return ""
  const vn = ctx.variableName.toLowerCase()
  const first = members[0] as SummaryMember

  if (ctx.view === "monthly" && first.bands && first.bands.length === 12) {
    const bands = first.bands
    let peak = 0
    bands.forEach((b, i) => {
      if (b.p50 > (bands[peak] as MonthlyBand).p50) peak = i
    })
    let s = `Median ${vn} peaks in ${WATER_MONTHS[peak]} for ${first.label}`
    const last = members[members.length - 1] as SummaryMember
    if (members.length > 1 && last.bands) {
      const a = bands.reduce((t, b) => t + b.p50, 0)
      const b = last.bands.reduce((t, band) => t + band.p50, 0)
      s += `; across the year, ${last.label} runs ${percentDelta(a, b)} vs ${first.label}`
    }
    return `${s}.`
  }

  if (ctx.view === "cv") {
    const withValues = members.filter((m) => m.value != null)
    if (withValues.length === 0) return ""
    const mx = withValues.reduce((a, b) =>
      (b.value ?? 0) > (a.value ?? 0) ? b : a,
    )
    const mn = withValues.reduce((a, b) =>
      (b.value ?? 0) < (a.value ?? 0) ? b : a,
    )
    return `Year-to-year swings are largest for ${mx.label} (CV ${(mx.value ?? 0).toFixed(2)}) and smallest for ${mn.label} (CV ${(mn.value ?? 0).toFixed(2)}). Higher CV = less predictable from year to year.`
  }

  if (ctx.view === "value") {
    const withValues = members.filter((m) => m.value != null)
    if (withValues.length === 0) return ""
    const mx = withValues.reduce((a, b) =>
      (b.value ?? 0) > (a.value ?? 0) ? b : a,
    )
    const mn = withValues.reduce((a, b) =>
      (b.value ?? 0) < (a.value ?? 0) ? b : a,
    )
    if (ctx.variableName.toLowerCase().includes("trend")) {
      return `Groundwater levels decline fastest for ${mn.label} (${formatValue(mn.value, ctx.unit)} ${ctx.unit}) and are most stable for ${mx.label} (${formatValue(mx.value, ctx.unit)} ${ctx.unit}).`
    }
    return `${mx.label} has the highest value (${formatValue(mx.value, ctx.unit)} ${ctx.unit}); ${mn.label} the lowest (${formatValue(mn.value, ctx.unit)} ${ctx.unit}).`
  }

  // Distribution views (dist / pct): compare medians.
  const meds = members
    .filter((m) => m.series && m.series.length > 0)
    .map((m) => ({ m, med: seriesStats(m.series as number[]).p50 }))
  if (meds.length === 0) return ""

  if (ctx.compareBy === "scenarios") {
    const ref =
      meds.find((x) => x.m.isReference) ?? (meds[0] as (typeof meds)[0])
    const others = meds.filter((x) => x !== ref)
    let s = `At ${ctx.locationName} under the ${ctx.climateName} hydroclimate, median ${vn} for ${ref.m.label} (the reference) is ${formatValue(ref.med, ctx.unit)} ${ctx.unit}`
    if (others.length > 0) {
      const rest = others.map(
        (x) => `${x.m.label} ${percentDelta(ref.med, x.med)}`,
      )
      s += `; relative to it: ${rest.join(", ")}`
    }
    return `${s}.`
  }

  if (ctx.compareBy === "climates") {
    const a = meds[0] as (typeof meds)[0]
    const b = meds[meds.length - 1] as (typeof meds)[0]
    return `Under ${ctx.scenarioName} at ${ctx.locationName}, median ${vn} goes from ${formatValue(a.med, ctx.unit)} ${ctx.unit} (${a.m.label}) to ${formatValue(b.med, ctx.unit)} ${ctx.unit} (${b.m.label}): a change of ${percentDelta(a.med, b.med)}.`
  }

  const mx = meds.reduce((p, c) => (c.med > p.med ? c : p))
  const mn = meds.reduce((p, c) => (c.med < p.med ? c : p))
  return `Under ${ctx.scenarioName} (${ctx.climateName}), median ${vn} ranges from ${formatValue(mn.med, ctx.unit)} ${ctx.unit} at ${mn.m.label} to ${formatValue(mx.med, ctx.unit)} ${ctx.unit} at ${mx.m.label}.`
}

/** Explainer body for "How do I read this chart?", per view. */
export function howToReadText(
  view: VariableView,
  distKind: "exceedance" | "box" | "stats",
): string {
  if (view === "monthly") {
    return `Each line is the median value for that month across all ${MOCK_YEARS} simulated years; the shaded band spans the 10th-90th percentile (8 of 10 years fall inside it). Months follow the water year (October-September).`
  }
  if (view === "cv") {
    return "The coefficient of variation (CV) is the year-to-year standard deviation divided by the mean. A CV of 0.10 means typical years vary about plus or minus 10% around the average; higher bars mean a less reliable, more boom-and-bust pattern."
  }
  if (view === "value") {
    return "A single summary number per comparison member. Hover a bar for the exact value."
  }
  if (distKind === "stats") {
    return `Each panel is one summary statistic across all ${MOCK_YEARS} simulated years, with one bar per comparison member. Mean is the long-run average. CV (coefficient of variation) is the year-to-year standard deviation divided by the mean: a CV of 0.10 means typical years vary about plus or minus 10% around the average. On the level view, Trend is the least-squares slope of the annual levels in feet per year; negative bars mean declining groundwater levels.`
  }
  if (distKind === "box") {
    return `Each box summarizes all ${MOCK_YEARS} simulated years: the heavy line is the median, the box spans the 25th-75th percentile (half of all years), and the whiskers reach the 10th and 90th percentiles. Wider boxes = more year-to-year variability.`
  }
  return `An exceedance plot answers: "in what share of years is the value at least this big?" Pick a point on a line: its horizontal position is the percent of years, the vertical position the value. The left side shows wet/abundant years, the right side dry/scarce years. Where one line sits above another, that alternative delivers more in that kind of year. Reading at 50% gives the median year; at 90%, a dry year exceeded 9 years in 10.`
}
