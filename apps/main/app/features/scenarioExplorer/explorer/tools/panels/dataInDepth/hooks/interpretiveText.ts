/**
 * Interpretive text for the Data-in-Depth explorer: the one-sentence summary
 * above each chart and the "How do I read this chart?" explainer bodies.
 *
 * Pure functions, no React: deterministic template sentences computed from
 * member stats, so they are unit-testable and reusable by a future
 * StatAnnotation component. Ported from the team's design prototype copy.
 */

import type { VariableView } from "../config/variableRegistry"
import { buildFigureTitle } from "../../../../share/figureTitle"
import {
  seriesStats,
  MOCK_YEARS,
  type MonthlyBand,
  linearTrendPerYear,
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
  /** True when this member's series came from the live API */
  isLive?: boolean
  /** True when the scenario is not modeled for this variable at all, so its
   *  series is sample data standing in for something that does not exist.
   *  Such a member must never contribute a number to the summary sentence. */
  liveDataMissing?: boolean
  /** True while the member's live request is still in flight; its series is
   *  a stand-in and must not be quoted either. */
  pending?: boolean
}

/** A member whose series is real enough to put a number in a sentence. */
function hasUsableSeries(m: SummaryMember): boolean {
  return !m.liveDataMissing && !m.pending && !!m.series && m.series.length > 0
}

export interface SummaryContext {
  view: VariableView
  /** Chart style of the distribution family. The Stats style draws mean and
   *  CV bars, and its sentence reports those; the other two report medians. */
  distKind: "exceedance" | "box" | "stats"
  compareBy: "scenarios" | "climates" | "locations"
  variableName: string
  /** Registry id, for variable-specific sentence templates */
  variableId?: string
  /** Registry prose name ("April X2 position"); falls back to the lowercased
   *  display name when absent. */
  proseName?: string
  unit: string
  locationName: string
  /** Held location as a figure title ("Shasta Reservoir"), for the
   *  climates-axis Stats sentence. */
  locationTitleName?: string
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
  // Money in millions spans four orders of magnitude on one tool (a system's
  // median welfare loss is thousands of dollars; a regional total is
  // millions), so the decimals follow the magnitude.
  if (unit === "$M" || unit === "$B")
    d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 0.1 ? 2 : 3
  else if (unit === "ft/yr") d = 2
  else if (unit === "km") d = 1
  else if (unit === "%") d = a < 10 ? 1 : 0
  else if (unit === "proportion") d = a < 0.1 ? 3 : 2
  else if (a >= 10) d = a >= 100 ? 0 : 1
  else d = 2
  return v.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
}

/**
 * A value with its unit as prose: "1,234 TAF", "74.2 km", "$2.55 M". Money
 * units put the dollar sign first and the scale after the number.
 */
export function formatWithUnit(v: number, unit: string): string {
  if (unit === "$M") return `$${formatValue(v, unit)} M`
  if (unit === "$B") return `$${formatValue(v, unit)} B`
  return `${formatValue(v, unit)} ${unit}`
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

  // Winter-run salmon reads by its own template, phrased as habitat
  // occupancy. The statistic is the MEDIAN of the percent-of-habitat series,
  // matching what the chart plots (2026-08-20 science-team correction; the
  // sentence previously reported the arithmetic mean, which did not match the
  // plotted data).
  if (ctx.variableId === "salmon_abund") {
    const salmon = salmonSentence(members, ctx)
    if (salmon) return salmon
  }

  const vn = ctx.proseName ?? ctx.variableName.toLowerCase()
  const first = members[0] as SummaryMember

  // Welfare loss is zero in most years, so its distribution sentence names
  // the share of years with no loss and the mean; a median would read 0.
  if (
    ctx.variableId === "cws_welfare" &&
    ctx.distKind !== "stats" &&
    (ctx.view === "dist" || ctx.view === "pct")
  ) {
    const welfare = welfareSentence(members, ctx, vn)
    if (welfare) return welfare
  }

  // The Stats style draws mean and CV bars; its sentence reports the same
  // two statistics, from the same series, so the text under the bars can
  // never disagree with them.
  if (
    ctx.distKind === "stats" &&
    ctx.view !== "monthly" &&
    ctx.view !== "cv" &&
    ctx.view !== "value"
  ) {
    return statsSentence(members, ctx, vn)
  }

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

  // Distribution views (dist / pct): compare medians. A member the model
  // has no results for never contributes a number; it is named instead.
  const meds = members
    .filter(hasUsableSeries)
    .map((m) => ({ m, med: seriesStats(m.series as number[]).p50 }))
  if (meds.length === 0) return ""
  const noDataClause = noDataClauseFor(members)

  // Three variable families read in the project lead's own wording on the
  // scenarios axis; everything else keeps the generic sentence below.
  if (ctx.compareBy === "scenarios") {
    const templated = templateSentence(meds, ctx, noDataClause)
    if (templated) return templated
  }

  if (ctx.compareBy === "scenarios") {
    const ref =
      meds.find((x) => x.m.isReference) ?? (meds[0] as (typeof meds)[0])
    const others = meds.filter((x) => x !== ref)
    let s = `At ${ctx.locationName} under the ${ctx.climateName} hydroclimate, median ${vn} for ${ref.m.label} (the reference) is ${formatWithUnit(ref.med, ctx.unit)}`
    if (others.length > 0) {
      const rest = others.map(
        (x) => `${x.m.label} ${percentDelta(ref.med, x.med)}`,
      )
      s += `; relative to it: ${rest.join(", ")}`
    }
    return `${s}${noDataClause}.`
  }

  if (ctx.compareBy === "climates") {
    const a = meds[0] as (typeof meds)[0]
    const b = meds[meds.length - 1] as (typeof meds)[0]
    return `Under ${ctx.scenarioName} at ${ctx.locationName}, median ${vn} goes from ${formatWithUnit(a.med, ctx.unit)} (${a.m.label}) to ${formatWithUnit(b.med, ctx.unit)} (${b.m.label}): a change of ${percentDelta(a.med, b.med)}${noDataClause}.`
  }

  const mx = meds.reduce((p, c) => (c.med > p.med ? c : p))
  const mn = meds.reduce((p, c) => (c.med < p.med ? c : p))
  return `Under ${ctx.scenarioName} (${ctx.climateName}), median ${vn} ranges from ${formatWithUnit(mn.med, ctx.unit)} at ${mn.m.label} to ${formatWithUnit(mx.med, ctx.unit)} at ${mx.m.label}${noDataClause}.`
}

/**
 * The welfare-loss distribution sentence: per member, the count of years
 * with no loss and the mean annual loss in dollars. Scenarios compare to the
 * reference by percent; climates and locations range from first to last, or
 * lowest to highest. Members without model results are named, not quoted.
 */
function welfareSentence(
  members: SummaryMember[],
  ctx: SummaryContext,
  vn: string,
): string {
  const rows = members.filter(hasUsableSeries).map((m) => {
    const series = m.series as number[]
    const zero = series.filter((v) => v <= 0).length
    return { m, mean: seriesStats(series).mean, zero, n: series.length }
  })
  if (rows.length === 0) return ""
  const noDataClause = noDataClauseFor(members)
  const money = (v: number) => formatWithUnit(v, ctx.unit)
  const noLoss = (r: (typeof rows)[0]) => `no loss in ${r.zero} of ${r.n} years`

  if (ctx.compareBy === "scenarios") {
    const ref =
      rows.find((r) => r.m.isReference) ?? (rows[0] as (typeof rows)[0])
    const others = rows.filter((r) => r !== ref)
    let s = `At ${ctx.locationName} under the ${heldClimateOf(ctx)}, ${ref.m.label} has no ${vn} in ${ref.zero} of ${ref.n} years and a mean annual loss of ${money(ref.mean)}`
    for (const r of others) {
      s += `; ${r.m.label} has ${noLoss(r)} and a mean annual loss of ${money(r.mean)} (${percentDelta(ref.mean, r.mean)})`
    }
    return `${s}${noDataClause}.`
  }
  if (ctx.compareBy === "climates") {
    const a = rows[0] as (typeof rows)[0]
    const b = rows[rows.length - 1] as (typeof rows)[0]
    return `Under ${ctx.scenarioName} at ${ctx.locationName}, mean annual ${vn} goes from ${money(a.mean)} (${a.m.label}, ${noLoss(a)}) to ${money(b.mean)} (${b.m.label}, ${noLoss(b)}): a change of ${percentDelta(a.mean, b.mean)}${noDataClause}.`
  }
  const mx = rows.reduce((p, c) => (c.mean > p.mean ? c : p))
  const mn = rows.reduce((p, c) => (c.mean < p.mean ? c : p))
  return `Under ${ctx.scenarioName} (${ctx.climateName}), mean annual ${vn} ranges from ${money(mn.mean)} at ${mn.m.label} (${noLoss(mn)}) to ${money(mx.mean)} at ${mx.m.label} (${noLoss(mx)})${noDataClause}.`
}

/**
 * The lead's median-sentence templates (scenarios axis only):
 *  - reservoir storage (April, September): "At <Location> Reservoir, median
 *    <month> reservoir storage for <reference> under the <hydroclimate>
 *    hydroclimate is <median>. The <scenario> scenario has <N>% higher/lower
 *    median <month> reservoir storage." per compared scenario;
 *  - X2 position (April, September): "The median X2 location in <month> for
 *    <reference> under the <hydroclimate> hydroclimate is <median>. The
 *    median <month> X2 location for the <scenario> scenario is <median>: a
 *    difference of <N>%." with no location clause;
 *  - total Delta exports: "For <reference> under the <hydroclimate>
 *    hydroclimate, median Delta exports is <median>. For the <scenario>
 *    scenario, median Delta exports is <median>, a difference of <N>%."
 * Returns null for every other variable, and for a zero reference median
 * (a percent of zero is not a number), so the generic sentence applies.
 */
function templateSentence(
  meds: Array<{ m: SummaryMember; med: number }>,
  ctx: SummaryContext,
  noDataClause: string,
): string | null {
  const family =
    ctx.variableId === "res_apr" || ctx.variableId === "res_sep"
      ? "reservoir"
      : ctx.variableId === "x2_apr" || ctx.variableId === "x2_sep"
        ? "x2"
        : ctx.variableId === "tot_exp"
          ? "exports"
          : null
  if (!family) return null
  const month = /sep/.test(ctx.variableId ?? "") ? "September" : "April"
  const ref = meds.find((x) => x.m.isReference) ?? (meds[0] as (typeof meds)[0])
  if (!ref.med) return null
  const others = meds.filter((x) => x !== ref)
  const held = heldClimateOf(ctx)
  const val = (v: number) => formatWithUnit(v, ctx.unit)
  const sentences: string[] = []
  if (family === "reservoir") {
    const where = ctx.locationTitleName || ctx.locationName
    sentences.push(
      `At ${where}, median ${month} reservoir storage for ${ref.m.label} under the ${held} is ${val(ref.med)}.`,
    )
    for (const x of others) {
      const d = ((x.med - ref.med) / Math.abs(ref.med)) * 100
      sentences.push(
        `The ${x.m.label} scenario has ${Math.abs(d).toFixed(0)}% ${d >= 0 ? "higher" : "lower"} median ${month} reservoir storage.`,
      )
    }
  } else if (family === "x2") {
    sentences.push(
      `The median X2 location in ${month} for ${ref.m.label} under the ${held} is ${val(ref.med)}.`,
    )
    for (const x of others) {
      sentences.push(
        `The median ${month} X2 location for the ${x.m.label} scenario is ${val(x.med)}: a difference of ${percentDelta(ref.med, x.med)}.`,
      )
    }
  } else {
    sentences.push(
      `For ${ref.m.label} under the ${held}, median Delta exports is ${val(ref.med)}.`,
    )
    for (const x of others) {
      sentences.push(
        `For the ${x.m.label} scenario, median Delta exports is ${val(x.med)}, a difference of ${percentDelta(ref.med, x.med)}.`,
      )
    }
  }
  if (noDataClause) {
    const last = sentences.pop() as string
    sentences.push(`${last.replace(/\.$/, "")}${noDataClause}.`)
  }
  return sentences.join(" ")
}

/** "; no data available for A, B" for members the model has no results for. */
function noDataClauseFor(members: SummaryMember[]): string {
  const noData = members.filter((m) => m.liveDataMissing)
  return noData.length > 0
    ? `; no data available for ${noData.map((m) => m.label).join(", ")}`
    : ""
}

/** "Historical hydroclimate", unless the label already says climate. */
function heldClimateOf(ctx: SummaryContext): string {
  return /climate/i.test(ctx.climateName)
    ? ctx.climateName
    : `${ctx.climateName} hydroclimate`
}

/** CV as the bars print it: a ratio to two decimals, no unit. */
function formatCv(cv: number): string {
  return cv.toFixed(2)
}

/** Prose list: "a", "a and b", "a, b, and c". */
function proseList(items: string[]): string {
  if (items.length <= 2) return items.join(" and ")
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

/**
 * The Stats-style sentences: a mean sentence and a CV sentence built from
 * the same `seriesStats` the bars read, in the wording the project lead
 * specified per axis (scenarios: "Mean <variable> for <reference> under the
 * <hydroclimate> hydroclimate is <mean> <unit>. Mean <variable> for the
 * <scenario> scenario is <mean> <unit>: a difference of <%>." and the CV
 * twin; climates: "At <location> under <scenario>, mean <variable> ranges
 * from ... (<first>) to ... (<last>): a change of <%>." and the CV twin).
 * The X2 variables use the lead's X2 phrasing. On the level view a third
 * sentence reports the linear trend the third panel draws. Members without
 * model results contribute no number and are named.
 */
function statsSentence(
  members: SummaryMember[],
  ctx: SummaryContext,
  vn: string,
): string {
  const rows = members.filter(hasUsableSeries).map((m) => {
    const stats = seriesStats(m.series as number[])
    return { m, mean: stats.mean, cv: stats.cv }
  })
  if (rows.length === 0) return ""
  const noDataClause = noDataClauseFor(members)
  const unit = ctx.unit
  const fmt = (v: number) => formatWithUnit(v, unit)
  const x2Month =
    ctx.variableId === "x2_apr"
      ? "April"
      : ctx.variableId === "x2_sep"
        ? "September"
        : null
  const sentences: string[] = []

  if (ctx.compareBy === "scenarios") {
    const ref =
      rows.find((r) => r.m.isReference) ?? (rows[0] as (typeof rows)[0])
    const others = rows.filter((r) => r !== ref)
    const held = heldClimateOf(ctx)
    if (x2Month) {
      sentences.push(
        `The mean X2 location in ${x2Month} for ${ref.m.label} under the ${held} is ${fmt(ref.mean)}.`,
      )
      for (const r of others) {
        sentences.push(
          `The mean ${x2Month} X2 location for the ${r.m.label} scenario is ${fmt(r.mean)}: a difference of ${percentDelta(ref.mean, r.mean)}.`,
        )
      }
      sentences.push(
        `The annual variation in X2 location in ${x2Month} for ${ref.m.label} under the ${held} is ${formatCv(ref.cv)} (CV).`,
      )
      for (const r of others) {
        sentences.push(
          `The annual variation in ${x2Month} X2 location for the ${r.m.label} scenario is ${formatCv(r.cv)} (CV): a difference of ${percentDelta(ref.cv, r.cv)}.`,
        )
      }
    } else {
      sentences.push(
        `Mean ${vn} for ${ref.m.label} under the ${held} is ${fmt(ref.mean)}.`,
      )
      for (const r of others) {
        sentences.push(
          `Mean ${vn} for the ${r.m.label} scenario is ${fmt(r.mean)}: a difference of ${percentDelta(ref.mean, r.mean)}.`,
        )
      }
      sentences.push(
        `The annual variation in ${vn} for ${ref.m.label} under the ${held} is ${formatCv(ref.cv)} (CV).`,
      )
      for (const r of others) {
        sentences.push(
          `The annual variation in ${vn} for the ${r.m.label} scenario is ${formatCv(r.cv)} (CV): a difference of ${percentDelta(ref.cv, r.cv)}.`,
        )
      }
    }
  } else if (ctx.compareBy === "climates") {
    const a = rows[0] as (typeof rows)[0]
    const b = rows[rows.length - 1] as (typeof rows)[0]
    const where = ctx.locationTitleName || ctx.locationName
    sentences.push(
      `At ${where} under ${ctx.scenarioName}, mean ${vn} ranges from ${fmt(a.mean)} (${a.m.label}) to ${fmt(b.mean)} (${b.m.label}): a change of ${percentDelta(a.mean, b.mean)}.`,
    )
    sentences.push(
      `At ${where} under ${ctx.scenarioName}, the coefficient of variation (CV) of annual ${vn} is ${formatCv(a.cv)} (${a.m.label}) to ${formatCv(b.cv)} (${b.m.label}): a change of ${percentDelta(a.cv, b.cv)}.`,
    )
  } else {
    const mx = rows.reduce((p, c) => (c.mean > p.mean ? c : p))
    const mn = rows.reduce((p, c) => (c.mean < p.mean ? c : p))
    sentences.push(
      `Under ${ctx.scenarioName} (${ctx.climateName}), mean ${vn} ranges from ${fmt(mn.mean)} at ${mn.m.label} to ${fmt(mx.mean)} at ${mx.m.label}.`,
    )
    sentences.push(
      `The coefficient of variation (CV) of annual ${vn} is ${proseList(rows.map((r) => `${formatCv(r.cv)} at ${r.m.label}`))}.`,
    )
  }

  if (ctx.view === "level") {
    sentences.push(
      `The linear trend in groundwater level is ${proseList(
        rows.map(
          (r) =>
            `${formatValue(linearTrendPerYear(r.m.series as number[]), "ft/yr")} ft/yr for ${r.m.label}`,
        ),
      )}.`,
    )
  }

  if (noDataClause) {
    const last = sentences.pop() as string
    sentences.push(`${last.replace(/\.$/, "")}${noDataClause}.`)
  }
  return sentences.join(" ")
}

/**
 * The winter-run salmon sentence: "Winter-run Chinook salmon for <scenario>
 * under the <hydroclimate> occupy <XX%> of suitable spawning habitat, at the
 * median."
 *
 * Two rules the science team set on 2026-08-20:
 *
 *  1. The statistic is the MEDIAN, matching the plotted distribution. The
 *     sentence previously reported the arithmetic mean, so the number in the
 *     header did not match the chart under it.
 *  2. No member without model results may contribute a NUMBER. Scenarios the
 *     model does not cover still carry a sample series (the engine always
 *     produces one), and quoting it read as a real result. Those members are
 *     named as having no data instead. A member that is merely sample-backed
 *     keeps its value but is marked "(sample)".
 *
 * Every value the sentence reports is an occupancy percent (never a
 * relative-change percent, which would read ambiguous next to a percent-unit
 * lead value): scenario comparisons list the other members' own occupancy,
 * climate comparisons enumerate every compared member. Returns "" when no
 * member carries a usable series (the caller then falls through to the
 * generic sentences, which render "" for an empty dist view).
 */
function salmonSentence(members: SummaryMember[], ctx: SummaryContext): string {
  // Members the model has no results for are excluded from every statistic.
  const noData = members.filter((m) => m.liveDataMissing)
  const withSeries = members.filter(hasUsableSeries)
  if (withSeries.length === 0) return ""
  // The displayed series is a proportion of 1.0; prose keeps the percent
  // phrasing, so the median converts back (x100) for the sentence.
  const medianPct = (m: SummaryMember) =>
    `${formatValue(seriesStats(m.series as number[]).p50 * 100, "%")}%`
  const noDataClause =
    noData.length > 0
      ? `; no data available for ${noData.map((m) => m.label).join(", ")}`
      : ""
  const heldClimate = /climate/i.test(ctx.climateName)
    ? ctx.climateName
    : `${ctx.climateName} hydroclimate`

  if (ctx.compareBy === "climates") {
    const parts = withSeries.map(
      (m, i) =>
        `${medianPct(m)}${i === 0 ? " of suitable spawning habitat" : ""} under ${m.label}`,
    )
    const list =
      parts.length <= 2
        ? parts.join(" and ")
        : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
    return `Winter-run Chinook salmon for ${ctx.scenarioName} occupy ${list}, at the median${noDataClause}.`
  }

  const ref =
    withSeries.find((m) => m.isReference) ?? (withSeries[0] as SummaryMember)
  const scenarioLabel =
    ctx.compareBy === "scenarios" ? ref.label : ctx.scenarioName
  let s = `Winter-run Chinook salmon for ${scenarioLabel} under the ${heldClimate} occupy ${medianPct(ref)} of suitable spawning habitat, at the median`
  if (ctx.compareBy === "scenarios") {
    const others = withSeries.filter((m) => m !== ref)
    if (others.length > 0) {
      // A sample-backed member keeps its number but says so, so the reader
      // can tell which comparisons rest on model results.
      const rest = others.map(
        (m) =>
          `${m.label} ${medianPct(m)}${m.isLive === false ? " (sample)" : ""}`,
      )
      s += `; for comparison: ${rest.join(", ")}`
    }
  }
  return `${s}${noDataClause}.`
}

/** Inputs for the card's standardized figure title. */
export interface DataFigureTitleInput {
  variableName: string
  /** Registry `figureTitleHead`: replaces the variable-and-location head
   *  verbatim when set (the X2 titles). */
  figureTitleHead?: string
  compareBy: "scenarios" | "climates" | "locations"
  memberCount: number
  /** Label of the single compared member, when there is exactly one */
  firstMemberLabel?: string
  /** Held location as a title ("Shasta Reservoir"); "" when none */
  locationTitleName: string
  /** Held climate label */
  climateName: string
  /** Held scenario label */
  scenarioName: string
  /** Active water-year-type class labels; empty = all years */
  waterYearTypeLabels: readonly string[] | null
}

/**
 * Compose the standardized figure title for the data-in-depth card: the
 * compared axis is summarized (single member label, or "<n> scenarios" /
 * "<n> climate futures" / "<n> locations") and the held axes fill the
 * scenario, hydroclimate, and location slots.
 */
export function dataFigureTitle(input: DataFigureTitleInput): string {
  const single = input.memberCount === 1 ? input.firstMemberLabel : undefined
  const scenarioContext =
    input.compareBy === "scenarios"
      ? (single ?? `${input.memberCount} scenarios`)
      : input.scenarioName
  // Held-climate labels are short ("Historical"); spell out "hydroclimate"
  // in the title unless the label already mentions climate.
  const heldClimateTitle = /climate/i.test(input.climateName)
    ? input.climateName
    : `${input.climateName} hydroclimate`
  const hydroclimateName =
    input.compareBy === "climates"
      ? (single ?? `${input.memberCount} climate futures`)
      : heldClimateTitle
  const locationName =
    input.compareBy === "locations"
      ? (single ?? `${input.memberCount} locations`)
      : input.locationTitleName
  return buildFigureTitle({
    variableName: input.variableName,
    locationName: locationName || undefined,
    memberSummary: scenarioContext,
    hydroclimateName: hydroclimateName || undefined,
    waterYearTypeLabels: input.waterYearTypeLabels,
    headVerbatim: input.figureTitleHead,
  })
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
    return `Each box summarizes all ${MOCK_YEARS} simulated years: the heavy line is the median, the box spans the 25th-75th percentile (half of all years), and the whiskers reach the 10th and 90th percentiles. The short dashed line inside each box marks the mean. Wider boxes = more year-to-year variability.`
  }
  return `An exceedance plot answers: "in what share of years is the value at least this big?" Pick a point on a line: its horizontal position is the percent of years, the vertical position the value. The left side shows wet/abundant years, the right side dry/scarce years. Where one line sits above another, that alternative delivers more in that kind of year. Reading at 50% gives the median year; at 90%, a dry year exceeded 9 years in 10.`
}
