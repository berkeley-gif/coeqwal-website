/**
 * Deterministic sample-data engine for mock-backed explorer variables.
 *
 * Pure functions, no React, no Date/Math.random at call time: every value is
 * derived from a seeded hash of (variable, scenario, climate, location), so
 * the same inputs always render the same charts, across reloads and builds.
 * Ported from the team's Data-in-Depth design prototype so the sample data
 * mimics the structure of CalSim3 post-processed output (scenario and
 * climate contrasts are ILLUSTRATIVE ONLY). Every surface rendering from
 * this engine is labeled "sample data" in the UI.
 *
 * value[year] = base x scenarioEffect x climateEffect x hydroYear^sens x noise
 * Hydrology year-factors are shared per climate so scenarios co-move across
 * the same simulated trace, as in real paired CalSim runs.
 */

import {
  VARIABLES,
  getLocation,
  type VariableDef,
  type LocationDef,
} from "./variableRegistry"

export const MOCK_YEARS = 100

/* ------------------------------------------------------------------ */
/* Seeded randomness (FNV-1a hash -> mulberry32 -> Box-Muller)          */
/* ------------------------------------------------------------------ */

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(r: () => number): number {
  let u = 0
  let v = 0
  while (!u) u = r()
  while (!v) v = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/* ------------------------------------------------------------------ */
/* Climate stress                                                      */
/* ------------------------------------------------------------------ */

/**
 * Stress level per hydroclimate, 0 (historical) to 1 (most severe).
 * Keys are the app's hydroclimate group keys.
 */
export const MOCK_CLIMATE_STRESS: Record<string, number> = {
  historical: 0.0,
  ecv: 0.15,
  cc50: 0.4,
  cc95: 0.7,
  tai: 1.0,
}

/* ------------------------------------------------------------------ */
/* Metric kinds: climate response, sensitivity, variability, shape     */
/* ------------------------------------------------------------------ */

interface Kind {
  clim: number
  sens: number
  cv0: number
  cvS: number
  shape?: keyof typeof SHAPES
  clamp?: [number, number]
}

const KINDS: Record<string, Kind> = {
  storage: { clim: -0.22, sens: 0.5, cv0: 0.18, cvS: 0.45 },
  gwstor: { clim: -0.15, sens: 0.3, cv0: 0.07, cvS: 0.4 },
  flow: { clim: -0.28, sens: 1.1, cv0: 0.3, cvS: 0.5, shape: "flow" },
  outflow: { clim: -0.25, sens: 1.2, cv0: 0.34, cvS: 0.5, shape: "outflow" },
  sal: { clim: 0.18, sens: -0.6, cv0: 0.2, cvS: 0.55, shape: "sal" },
  x2: { clim: 0.1, sens: -0.32, cv0: 0.08, cvS: 0.5 },
  exports: { clim: -0.2, sens: 0.7, cv0: 0.24, cvS: 0.5, shape: "exports" },
  agdel: { clim: -0.18, sens: 0.5, cv0: 0.2, cvS: 0.45, shape: "agdel" },
  pump: { clim: 0.12, sens: -0.45, cv0: 0.16, cvS: 0.4, shape: "agdel" },
  short: { clim: 0.55, sens: -2.0, cv0: 0.55, cvS: 0.4 },
  rev: { clim: -0.1, sens: 0.22, cv0: 0.08, cvS: 0.45 },
  cwsdel: { clim: -0.08, sens: 0.22, cv0: 0.06, cvS: 0.45 },
}

/** Seasonal shapes by water month (Oct..Sep). */
const SHAPES = {
  storage: [
    0.78, 0.76, 0.78, 0.84, 0.92, 1.0, 1.08, 1.1, 1.05, 0.96, 0.86, 0.8,
  ],
  flow: [
    0.04, 0.05, 0.08, 0.12, 0.15, 0.15, 0.12, 0.11, 0.07, 0.05, 0.03, 0.03,
  ],
  outflow: [
    0.04, 0.06, 0.1, 0.15, 0.17, 0.15, 0.11, 0.09, 0.05, 0.03, 0.02, 0.03,
  ],
  sal: [1.25, 1.15, 0.95, 0.8, 0.7, 0.7, 0.75, 0.85, 0.95, 1.1, 1.25, 1.35],
  exports: [
    0.07, 0.06, 0.07, 0.08, 0.08, 0.08, 0.08, 0.09, 0.1, 0.1, 0.1, 0.09,
  ],
  agdel: [
    0.02, 0.02, 0.02, 0.03, 0.04, 0.07, 0.12, 0.15, 0.16, 0.15, 0.13, 0.09,
  ],
}

/* ------------------------------------------------------------------ */
/* Illustrative scenario effects (fractional shifts vs current ops)    */
/* ------------------------------------------------------------------ */

interface ScenarioEffect {
  /** Effect concentrated South of Delta */
  sod?: boolean
  eff: Record<string, number>
}

/**
 * Keyed by scenario short code. Unknown scenarios get a small deterministic
 * pseudo-effect derived from their id, so any workspace selection renders
 * distinguishable sample curves.
 */
const SCENARIO_EFFECTS: Record<string, ScenarioEffect> = {
  s0020: { eff: {} },
  s0011: { eff: { agDel: 0.02, gwStor: 0.03 } },
  s0021: { eff: { storage: -0.04, outflow: 0.05, exports: -0.05, sal: -0.04 } },
  s0024: { eff: { exports: 0.04, storage: -0.02, flows: -0.03 } },
  s0023: { eff: { exports: -0.02, outflow: 0.04, sal: -0.03, storage: -0.04 } },
  s0035: { eff: { cws: 0.15, cwsShort: -0.45, agDel: -0.03 } },
  s0037: { eff: { cws: 0.3, cwsShort: -0.65, agDel: -0.08, storage: -0.03 } },
  s0025: {
    sod: true,
    eff: { pump: -0.3, short: 0.45, rev: -0.07, gwStor: 0.15, gwTrend: 0.6 },
  },
  s0026: {
    sod: true,
    eff: {
      pump: -0.35,
      agDel: -0.12,
      short: 0.2,
      rev: -0.11,
      gwStor: 0.2,
      gwTrend: 0.7,
    },
  },
  s0027: {
    eff: { pump: -0.35, short: 0.5, rev: -0.09, gwStor: 0.2, gwTrend: 0.7 },
  },
  s0028: {
    eff: {
      pump: -0.4,
      agDel: -0.15,
      short: 0.25,
      rev: -0.13,
      gwStor: 0.25,
      gwTrend: 0.8,
    },
  },
  s0030: {
    eff: {
      flows: -0.3,
      exports: 0.12,
      agDel: 0.1,
      storage: 0.08,
      outflow: -0.15,
      sal: 0.1,
    },
  },
  s0046: {
    eff: {
      flows: 0.3,
      exports: -0.12,
      agDel: -0.1,
      storage: -0.05,
      outflow: 0.12,
      sal: -0.06,
    },
  },
  s0032: {
    eff: {
      flows: 0.32,
      exports: -0.15,
      agDel: -0.12,
      pump: -0.3,
      rev: -0.1,
      gwStor: 0.2,
      gwTrend: 0.7,
      short: 0.3,
    },
  },
  s0031: {
    eff: {
      flows: 0.22,
      storage: 0.06,
      sepBonus: 0.1,
      exports: -0.1,
      agDel: -0.08,
    },
  },
  s0033: {
    eff: {
      flows: 0.24,
      storage: 0.06,
      sepBonus: 0.1,
      exports: -0.12,
      pump: -0.3,
      rev: -0.09,
      gwStor: 0.2,
      gwTrend: 0.7,
      short: 0.3,
    },
  },
  s0040: { eff: { outflow: -0.15, exports: 0.12, sal: 0.12 } },
  s0041: { eff: { outflow: 0.02, exports: 0.02 } },
  s0042: { eff: { outflow: 0.15, exports: -0.13, sal: -0.08 } },
  s0039: {
    eff: {
      outflow: 0.3,
      exports: -0.27,
      sal: -0.15,
      storage: -0.07,
      agDel: -0.1,
    },
  },
  s0044: {
    eff: { storage: 0.1, sepBonus: 0.12, exports: -0.05, agDel: -0.04 },
  },
  s0045: { eff: { sal: 0.2, exports: 0.08, outflow: -0.1, cws: -0.03 } },
  s0065: { eff: { exports: 0.1, outflow: -0.04, sal: 0.03, cws: 0.05 } },
}

function scenarioEffect(scenarioId: string): ScenarioEffect {
  const known = SCENARIO_EFFECTS[scenarioId]
  if (known) return known
  // Deterministic pseudo-effect for scenarios outside the illustrative table:
  // small, id-derived shifts so curves separate visibly but plausibly.
  const r = rng(hash(`eff|${scenarioId}`))
  const shift = () => (r() - 0.5) * 0.24
  return {
    eff: {
      storage: shift(),
      flows: shift(),
      exports: shift(),
      outflow: shift(),
      agDel: shift(),
      cws: shift(),
      pump: shift(),
      short: shift(),
      rev: shift() * 0.5,
      gwStor: shift(),
      gwTrend: shift(),
      sal: shift(),
      cwsShort: shift(),
    },
  }
}

/* ------------------------------------------------------------------ */
/* Base magnitudes                                                     */
/* ------------------------------------------------------------------ */

// Sample magnitudes per served aggregate, in the same units the endpoint
// serves (TAF; revenue in billions of USD). Only reached when a live series
// is absent. There is no shortpct row: the percent-of-demand view is DERIVED
// from the shortage and delivery series, never seeded from a base.
const AG_BASE: Record<
  string,
  { del: number; pump: number; short: number; rev: number }
> = {
  AGG_AG_NOD: { del: 3800, pump: 3500, short: 85, rev: 4.1 },
  AGG_AG_SOD: { del: 3400, pump: 3800, short: 113, rev: 9.3 },
}

function baseFor(variable: VariableDef, location: LocationDef): number {
  switch (variable.id) {
    case "res_apr":
      return (location.capacityTaf ?? 1000) * 0.72
    case "res_sep":
      return (location.capacityTaf ?? 1000) * 0.45
    case "x2_apr":
      return 74
    case "x2_sep":
      return 84
    case "cvp_del":
      return 5000 * (location.mockBase ?? 1)
    case "swp_del":
      return 2600 * (location.mockBase ?? 1)
    case "cvp_ag":
      return 3000 * (location.mockBase ?? 1)
    case "cvp_mi":
      return 500 * (location.mockBase ?? 1)
    case "cvp_refuges":
      return 300
    case "swp_ag":
      return 700 * (location.mockBase ?? 1)
    case "swp_mi":
      return 1900 * (location.mockBase ?? 1)
    case "cvp_exp":
      return 2400
    case "swp_exp":
      return 2400
    case "ssjv_exp":
      return location.mockBase ?? 400
    case "tot_exp":
      return 4800
    case "salmon_abund":
      // Proportion of spawning habitat occupied (display units, matching
      // the 0.01-scaled live series); most sample years sit well below
      // capacity (1.0).
      return 0.55
    // Ag aggregates keep their hand-set bases; demand units carry a served
    // net-diversion median as mockBase, and the other measures scale from it
    // at roughly the aggregate ratios (pumping ~0.9x, shortage ~0.03x,
    // revenue ~1.08x in $M).
    case "ag_del":
      return AG_BASE[location.id]?.del ?? location.mockBase ?? 4000
    case "ag_pump":
      return AG_BASE[location.id]?.pump ?? (location.mockBase ?? 3300) * 0.9
    case "ag_short":
      return AG_BASE[location.id]?.short ?? (location.mockBase ?? 26000) * 0.03
    case "ag_rev":
      return AG_BASE[location.id]?.rev ?? (location.mockBase ?? 14) * 1.08
    case "cws_short":
      // The shortage group's mockBase is already a shortage median (TAF).
      return location.mockBase ?? 30
    case "cws_welfare":
      // Sample only on API failure: the shortage magnitude in TAF is the
      // same order as the welfare loss in $M at the aggregates.
      return location.mockBase ?? 3
    default:
      return location.mockBase ?? 1000
  }
}

/* ------------------------------------------------------------------ */
/* Series generation                                                   */
/* ------------------------------------------------------------------ */

const yearFactorCache: Record<string, number[]> = {}

/** Shared hydrologic trace per climate (droughts cluster via persistence). */
function yearFactors(climateKey: string): number[] {
  const cached = yearFactorCache[climateKey]
  if (cached) return cached
  const stress = MOCK_CLIMATE_STRESS[climateKey] ?? 0
  const r = rng(hash(`hydro|${climateKey}`))
  const out: number[] = []
  let prev = 0
  for (let i = 0; i < MOCK_YEARS; i++) {
    const g = 0.55 * prev + Math.sqrt(1 - 0.55 * 0.55) * gauss(r)
    prev = g
    out.push(Math.exp(0.42 * (1 + 0.25 * stress) * g - 0.5 * 0.42 * 0.42))
  }
  yearFactorCache[climateKey] = out
  return out
}

function regionWeight(effect: ScenarioEffect, location: LocationDef): number {
  if (!effect.sod) return 1
  if (location.region === "SOD") return 1
  if (location.region === "ALL") return 0.6
  return 0.2
}

function effectFor(
  variable: VariableDef,
  effect: ScenarioEffect,
  location: LocationDef,
): number {
  let e =
    (effect.eff[variable.mockEffect] ?? 0) * regionWeight(effect, location)
  if (variable.id === "res_sep" && effect.eff.sepBonus) {
    e += effect.eff.sepBonus
  }
  return e
}

const seriesCache: Record<string, number[]> = {}

/** 100 deterministic annual values for one member. */
export function mockAnnualSeries(
  variableId: string,
  scenarioId: string,
  climateKey: string,
  locationId: string,
): number[] {
  const key = [variableId, scenarioId, climateKey, locationId].join("|")
  const cached = seriesCache[key]
  if (cached) return cached
  const variable = VARIABLES[variableId]
  if (!variable) return []
  const location = getLocation(variable.locationGroup, locationId)
  if (!location) return []
  const kind = KINDS[variable.mockKind] ?? (KINDS.flow as Kind)
  const stress = MOCK_CLIMATE_STRESS[climateKey] ?? 0
  const effect = scenarioEffect(scenarioId)
  const yf = yearFactors(climateKey)
  const median =
    baseFor(variable, location) *
    (1 + effectFor(variable, effect, location)) *
    (1 + kind.clim * stress)
  const r = rng(hash(`noise|${key}`))
  const sigma = kind.cv0 * (1 + kind.cvS * stress) * 0.55
  const out: number[] = []
  for (let i = 0; i < MOCK_YEARS; i++) {
    let v =
      median *
      Math.pow(yf[i] as number, kind.sens) *
      Math.exp(sigma * gauss(r) - 0.5 * sigma * sigma)
    if (kind.clamp) v = Math.min(kind.clamp[1], Math.max(kind.clamp[0], v))
    else v = Math.max(0, v)
    out.push(v)
  }
  seriesCache[key] = out
  return out
}

export interface MonthlyBand {
  p10: number
  p50: number
  p90: number
}

/** Per-water-month p10/p50/p90 bands for one member. */
export function mockMonthlyBands(
  variableId: string,
  scenarioId: string,
  climateKey: string,
  locationId: string,
): MonthlyBand[] {
  const variable = VARIABLES[variableId]
  if (!variable) return []
  const kind = KINDS[variable.mockKind] ?? (KINDS.flow as Kind)
  const shape =
    SHAPES[kind.shape ?? (variable.mockKind === "storage" ? "storage" : "flow")]
  const annual = mockAnnualSeries(
    variableId,
    scenarioId,
    climateKey,
    locationId,
  )
  if (annual.length === 0) return []
  const r = rng(
    hash(`mon|${[variableId, scenarioId, climateKey, locationId].join("|")}`),
  )
  const bands: MonthlyBand[] = []
  for (let month = 0; month < 12; month++) {
    const values: number[] = []
    for (let y = 0; y < MOCK_YEARS; y++) {
      values.push(
        Math.max(
          0,
          (annual[y] as number) *
            (shape[month] as number) *
            Math.exp(0.1 * gauss(r)),
        ),
      )
    }
    values.sort((a, b) => a - b)
    bands.push({
      p10: quantileSorted(values, 0.1),
      p50: quantileSorted(values, 0.5),
      p90: quantileSorted(values, 0.9),
    })
  }
  return bands
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export interface SeriesStats {
  min: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  max: number
  mean: number
  cv: number
}

export function quantileSorted(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const i = (sorted.length - 1) * p
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  const a = sorted[lo] as number
  const b = sorted[hi] as number
  return a + (b - a) * (i - lo)
}

export function seriesStats(values: number[]): SeriesStats {
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1)
  const sd = Math.sqrt(
    values.reduce((a, b) => a + (b - mean) * (b - mean), 0) /
      (values.length || 1),
  )
  return {
    min: sorted[0] ?? 0,
    p10: quantileSorted(sorted, 0.1),
    p25: quantileSorted(sorted, 0.25),
    p50: quantileSorted(sorted, 0.5),
    p75: quantileSorted(sorted, 0.75),
    p90: quantileSorted(sorted, 0.9),
    max: sorted[sorted.length - 1] ?? 0,
    mean,
    cv: mean ? sd / mean : 0,
  }
}

/**
 * Sample-only groundwater level series (feet) for the "level" view, derived
 * from the storage series: a nominal per-basin level scaled by relative
 * storage, minus a slow constant drawdown so long-run level trends read like
 * real declining aquifers (and a trend statistic has signal in sample data).
 */
export function gwLevelFromStorage(
  storage: readonly number[],
  location: LocationDef,
): number[] {
  const base = location.mockBase ?? 1
  const nominalFt = base / 100
  const declineFtPerYear = nominalFt * 0.001
  return storage.map((v, i) =>
    Math.max(0, nominalFt * (v / base) - declineFtPerYear * i),
  )
}

/**
 * Shortage as a percent of demand for the "pct_demand" view, derived per year
 * as shortage / (shortage + delivered) x 100. Demand is approximated as
 * delivered water plus shortage. Clamped to [0, 100]; a no-demand year (both
 * series 0) renders 0, never NaN; mismatched lengths trim to the shorter
 * series so years stay aligned. Pure.
 *
 * Two callers, with different reach:
 *  - Community water systems: SAMPLE members only. Live members adopt the
 *    endpoint's served shortage_pct measure directly.
 *  - Agriculture: BOTH live and sample members. The ag endpoint serves no
 *    percent measure, so there is nothing to adopt and the view is derived
 *    from the served shortage and net_diversion series. The delivered term is
 *    net diversion there. Formula pending a one-line science confirm (asked
 *    2026-08-21); it ships documented rather than blocking, the same way the
 *    CWS percent view shipped with its open confirm.
 */
export function shortagePctOfDemand(
  shortage: readonly number[],
  delivered: readonly number[],
): number[] {
  const n = Math.min(shortage.length, delivered.length)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const short = shortage[i] as number
    const demand = short + (delivered[i] as number)
    const pct = demand > 0 ? (short / demand) * 100 : 0
    out.push(Math.min(100, Math.max(0, pct)))
  }
  return out
}

/**
 * Least-squares linear trend of an annual series, in value units per year.
 * Pure and source-agnostic (works for live and sample series alike); returns
 * 0 for series too short to carry a slope.
 */
export function linearTrendPerYear(series: readonly number[]): number {
  const n = series.length
  if (n < 2) return 0
  const meanX = (n - 1) / 2
  let meanY = 0
  for (const v of series) meanY += v
  meanY /= n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    const dx = i - meanX
    num += dx * ((series[i] as number) - meanY)
    den += dx * dx
  }
  return den === 0 ? 0 : num / den
}

/** Single summary value per member (the "value" view). */
export function mockSummaryValue(
  variableId: string,
  scenarioId: string,
  climateKey: string,
  locationId: string,
): number {
  const variable = VARIABLES[variableId]
  if (!variable) return 0
  const stats = seriesStats(
    mockAnnualSeries(variableId, scenarioId, climateKey, locationId),
  )
  return variableId === "ag_rev" ? stats.mean : stats.p50
}

/**
 * Deterministic sample-data water-year-type class for a year index
 * (1=Wet ... 5=Critical, matching the live API's classes). One shared
 * classification for every mock member; real data classifies per scenario,
 * which only the live path reflects.
 */
export function mockWaterYearType(yearIndex: number): number {
  const r = rng(hash(`wyt|${yearIndex}`))()
  if (r < 0.25) return 1
  if (r < 0.4) return 2
  if (r < 0.55) return 3
  if (r < 0.8) return 4
  return 5
}

/** Exceedance points (probability ascending) from an annual series. */
export function toExceedancePoints(
  values: number[],
): Array<{ probability: number; value: number }> {
  const sorted = [...values].sort((a, b) => b - a)
  return sorted.map((value, k) => ({
    probability: (k + 0.5) / sorted.length,
    value,
  }))
}
