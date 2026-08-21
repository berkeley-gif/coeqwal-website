/**
 * didMapping - pure request-mapping for the live data-in-depth endpoints.
 *
 * Bridges the explorer's registry ids (variable ids, location ids) to the
 * /api/data-in-depth/* request vocabulary (domain, subject short_code, period,
 * unit token, include facets). Self-contained on purpose: no React, no store,
 * no registry import, so it is trivially unit-testable and safe to import from
 * a Node-side spec. The variable-to-tier and location metadata stay in
 * variableRegistry; this module only owns the registry-id -> API-code bridge,
 * which is an API-side fact (verified against the live DB, 2026-07-20).
 *
 * The scenarios and climates compare axes serve these variables live;
 * everything else falls back to the deterministic mock engine (a null
 * return here = mock).
 */

/** A live data-in-depth domain (one endpoint each). */
export type DidDomain =
  | "reservoir"
  | "river"
  | "delta"
  | "sysdel"
  | "gw"
  | "salmon"
  | "cws"
/** Request unit token (not the response unit key). */
export type DidUnitToken =
  | "volume"
  | "pct_capacity"
  | "km"
  | "level"
  | "nof_3yr_avg"
  | "delivery"
  | "shortage_total"
  | "shortage_pct"
/** Which computed facets to request. */
export type DidIncludeToken = "values" | "exceedance" | "box" | "statistics"
/** Request period token (river is annual; reservoir/delta are april/sept). */
export type DidPeriodToken = "april" | "sept" | "annual"

/** Live-served variables -> their domain. Absent = mock. */
const DOMAIN_BY_VARIABLE: Record<string, DidDomain> = {
  res_apr: "reservoir",
  res_sep: "reservoir",
  riv_flow: "river",
  x2_apr: "delta",
  x2_sep: "delta",
  cvp_del: "sysdel",
  swp_del: "sysdel",
  tot_exp: "sysdel",
  cvp_ag: "sysdel",
  cvp_mi: "sysdel",
  cvp_refuges: "sysdel",
  swp_ag: "sysdel",
  swp_mi: "sysdel",
  cvp_exp: "sysdel",
  swp_exp: "sysdel",
  ssjv_exp: "sysdel",
  gw_stor: "gw",
  salmon_abund: "salmon",
  cws_del: "cws",
  cws_short: "cws",
}

/** One pinned period per live variable, so `values` is a clean annual series. */
const PERIOD_BY_VARIABLE: Record<string, DidPeriodToken> = {
  res_apr: "april",
  res_sep: "sept",
  riv_flow: "annual",
  x2_apr: "april",
  x2_sep: "sept",
  cvp_del: "annual",
  swp_del: "annual",
  tot_exp: "annual",
  cvp_ag: "annual",
  cvp_mi: "annual",
  cvp_refuges: "annual",
  swp_ag: "annual",
  swp_mi: "annual",
  cvp_exp: "annual",
  swp_exp: "annual",
  ssjv_exp: "annual",
  gw_stor: "annual",
  salmon_abund: "annual",
  cws_del: "annual",
  cws_short: "annual",
}

/**
 * System deliveries: the subject depends on the VARIABLE as well as the
 * location, because each registry variable is its own family of API metrics
 * (verified against /api/data-in-depth/system-deliveries, 25 subjects).
 * CVP/SWP deliveries are project totals (AG + M&I, plus wildlife refuges
 * for CVP, per the API subject labels) with north/south-of-Delta splits;
 * tot_exp exposes only the combined Banks + Jones
 * total (C_CVPSWP_TOTAL_EXPORTS); the endpoint also serves per-project and
 * Southern San Joaquin export subjects that are intentionally unmapped.
 *
 * The CVP splits use DEL_CVP_TOT_N_WAMER / DEL_CVP_TOT_S_WLOSS on purpose:
 * per the data team, the plain del_cvp_tot_n and del_cvp_tot_s CalSim
 * variables are incomplete (the north total omits the American River, the
 * south total omits losses); the _WAMER/_WLOSS variants are the complete
 * regional totals, and they sum exactly to DEL_CVP_TOTAL across all
 * simulated years. See the project's delivery-formulas spreadsheet for the
 * full formula definitions.
 */
const SYSDEL_SUBJECT_BY_VARIABLE: Record<string, Record<string, string>> = {
  cvp_del: {
    SYS: "DEL_CVP_TOTAL",
    NOD: "DEL_CVP_TOT_N_WAMER",
    SOD: "DEL_CVP_TOT_S_WLOSS",
  },
  swp_del: {
    SYS: "DEL_SWP_TOTAL",
    NOD: "DEL_SWP_TOT_N",
    SOD: "DEL_SWP_TOT_S",
  },
  tot_exp: {
    DELTA: "C_CVPSWP_TOTAL_EXPORTS",
  },
  // Sector breakdowns (split code patterns quote the API, asymmetries and
  // all: PAG splits are _NOD/_SOD for CVP but _NOD/_S for SWP; the CVP M&I
  // north split carries the _WAMER qualifier like the CVP totals).
  cvp_ag: {
    SYS: "DEL_CVP_PAG_TOTAL",
    NOD: "DEL_CVP_PAG_NOD",
    SOD: "DEL_CVP_PAG_SOD",
  },
  cvp_mi: {
    SYS: "DEL_CVP_PMI_TOTAL",
    NOD: "DEL_CVP_PMI_N_WAMER",
    SOD: "DEL_CVP_PMI_S",
  },
  // Refuges are served as a system total only; no regional subjects exist.
  cvp_refuges: {
    SYS: "DEL_CVP_PRF_TOTAL",
  },
  swp_ag: {
    SYS: "DEL_SWP_PAG_TOTAL",
    NOD: "DEL_SWP_PAG_NOD",
    SOD: "DEL_SWP_PAG_S",
  },
  swp_mi: {
    SYS: "DEL_SWP_PMI",
    NOD: "DEL_SWP_PMI_N",
    SOD: "DEL_SWP_PMI_S",
  },
  cvp_exp: {
    DELTA: "C_CVP_TOTAL_EXPORTS",
  },
  swp_exp: {
    DELTA: "C_CAA003_SWP",
  },
  // Southern San Joaquin Valley exports: the three served routes are the
  // locations; no combined total is served and none is computed client-side.
  ssjv_exp: {
    CVC: "D_CAA238_CVPCV",
    FRIANT: "D_MLRTN_FRK000",
    KERN: "SWP_TA_KERNAG",
  },
}

/**
 * Groundwater: the NOD/SOD aggregates use dedicated aggregate subjects; every
 * served basin passes through by its technical code. No friendlier lookup
 * exists on the data side (the other explore tools show the same codes), so
 * codes are the ids AND the labels until richer names are confirmed.
 */
const GW_AGGREGATE_SUBJECTS: Record<string, string> = {
  AGG_GW_NOD: "NOD_GroundwaterStorage",
  AGG_GW_SOD: "SOD_GroundwaterStorage",
}

/**
 * The 42 served basin subjects (verified against
 * /api/data-in-depth/groundwater-storage, 44 subjects including the two
 * aggregates). Basin location ids ARE these codes, so resolution is an
 * allowlisted pass-through (codes verified against the endpoint at
 * implementation time): an id outside the set falls back to mock instead of
 * issuing a dead request. Every basin entity serves level and volume
 * (verified per subject); the aggregates serve volume only, so an
 * aggregate's level view falls back to sample per member.
 * Exported so the registry parity spec can assert exact set equality with
 * the basins location list (either list drifting fails the test).
 */
export const GW_BASIN_SUBJECTS: ReadonlySet<string> = new Set([
  "DETAW",
  "WBA2",
  "WBA3",
  "WBA4",
  "WBA5",
  "WBA6",
  "WBA7N",
  "WBA7S",
  "WBA8N",
  "WBA8S",
  "WBA9",
  "WBA10",
  "WBA11",
  "WBA12",
  "WBA13",
  "WBA14",
  "WBA15N",
  "WBA15S",
  "WBA16",
  "WBA17N",
  "WBA17S",
  "WBA18",
  "WBA19",
  "WBA20",
  "WBA21",
  "WBA22",
  "WBA23",
  "WBA24",
  "WBA25",
  "WBA26N",
  "WBA26S",
  "WBA50",
  "WBA60N",
  "WBA60S",
  "WBA61",
  "WBA62",
  "WBA63",
  "WBA64",
  "WBA71",
  "WBA72",
  "WBA73",
  "WBA90",
])

/** Winter-run salmon: a single population metric subject. */
const SALMON_SUBJECT_BY_LOCATION: Record<string, string> = {
  WRLCM: "WRLCM_ADULT_FEMALES",
}

/**
 * Community water systems: the endpoint serves 107 subjects, but the
 * explorer wires only the two served aggregates for now (verified against
 * /api/data-in-depth/cws, 2026-08-19: NOD_CWS/SOD_CWS carry all five
 * measures). Entity-level locations follow once the location list is
 * finalized with the data team, so any other id stays unmapped (mock).
 */
const CWS_AGGREGATE_SUBJECTS: Record<string, string> = {
  AGG_CWS_NOD: "NOD_CWS",
  AGG_CWS_SOD: "SOD_CWS",
}

/**
 * Display-unit scale applied to adopted live series, per variable. The
 * salmon endpoint serves NOF_3YR_AVG in percent (0-100, the same units as
 * the Salmon Data Drop csv metric_avg_roll column, verified against the
 * live endpoint); the tool displays a proportion (0-1.0, 1.0 = at habitat
 * capacity) per the 2026-08-18 science-team confirmation, so the adopted
 * live series scales by 0.01. Mock series are generated in display units
 * already and never scale.
 */
const LIVE_SERIES_SCALE: Record<string, number> = {
  salmon_abund: 0.01,
}

/** Scale from a live series' served units to display units (1 = as served). */
export function didLiveScaleForVariable(variableId: string): number {
  return LIVE_SERIES_SCALE[variableId] ?? 1
}

/** Registry reservoir-location id -> API subject short_code (only the differences). */
const RESERVOIR_SUBJECT_REMAP: Record<string, string> = {
  SLCVP: "SLUIS_CVP",
  SLSWP: "SLUIS_SWP",
  AGG_NOD: "NOD_Reservoirs",
  AGG_SOD: "SOD_Reservoirs",
}

/** The reservoir subjects the API actually serves. */
const RESERVOIR_SUBJECTS = new Set([
  "SHSTA",
  "OROVL",
  "TRNTY",
  "FOLSM",
  "MELON",
  "MLRTN",
  "SLUIS_CVP",
  "SLUIS_SWP",
  "NOD_Reservoirs",
  "SOD_Reservoirs",
])

/** Registry river-location id -> API subject short_code (only the differences). */
const RIVER_SUBJECT_REMAP: Record<string, string> = {
  YRS: "YUB002",
  TLG: "TUO003",
  MRC: "MCD005",
  MKM: "MOK028",
}

/** The river subjects the API actually serves. */
const RIVER_SUBJECTS = new Set([
  "AMR004",
  "FTR003",
  "FTR029",
  "MCD005",
  "MOK028",
  "SAC000",
  "SAC049",
  "SAC122",
  "SAC148",
  "SAC257",
  "SAC289",
  "SJR070",
  "SJR127",
  "STS011",
  "TRN111",
  "TUO003",
  "YUB002",
])

/** The live domain for a variable, or null when it is not served live (mock). */
export function didDomainForVariable(variableId: string): DidDomain | null {
  return DOMAIN_BY_VARIABLE[variableId] ?? null
}

/** The pinned request period for a live variable, or null when not live. */
export function didPeriodForVariable(
  variableId: string,
): DidPeriodToken | null {
  return PERIOD_BY_VARIABLE[variableId] ?? null
}

/**
 * Registry location id -> API subject short_code for a domain, or null when the
 * API does not serve that subject (caller falls back to mock; never fetch a
 * subject the API lacks). Delta serves only X2. The sysdel domain also needs
 * `variableId`, because its subject families are per-variable; omitting it
 * yields null (mock).
 */
export function toDidSubject(
  domain: DidDomain,
  locationId: string,
  variableId?: string,
): string | null {
  if (domain === "delta") return "X2"
  if (domain === "sysdel") {
    if (!variableId) return null
    return SYSDEL_SUBJECT_BY_VARIABLE[variableId]?.[locationId] ?? null
  }
  if (domain === "gw") {
    const aggregate = GW_AGGREGATE_SUBJECTS[locationId]
    if (aggregate) return aggregate
    return GW_BASIN_SUBJECTS.has(locationId) ? locationId : null
  }
  if (domain === "salmon") {
    return SALMON_SUBJECT_BY_LOCATION[locationId] ?? null
  }
  if (domain === "cws") {
    return CWS_AGGREGATE_SUBJECTS[locationId] ?? null
  }
  if (domain === "reservoir") {
    const code = RESERVOIR_SUBJECT_REMAP[locationId] ?? locationId
    return RESERVOIR_SUBJECTS.has(code) ? code : null
  }
  const code = RIVER_SUBJECT_REMAP[locationId] ?? locationId
  return RIVER_SUBJECTS.has(code) ? code : null
}

/**
 * Whether a view draws surfaces a live series can actually feed. Only the
 * annual-distribution family (dist / pct / level) and the cv view derive
 * everything they show from the raw series; monthly bands and summary
 * values come from the sample engine even when a live annual series
 * exists. Allowlist on purpose: a future view defaults to sample-labeled
 * until someone proves its surfaces are live-backed and adds it here.
 */
export function viewHasLiveSource(view: string): boolean {
  return (
    view === "dist" ||
    view === "pct" ||
    view === "level" ||
    view === "cv" ||
    view === "pct_demand"
  )
}

/**
 * Request unit token for a domain and view (delta is always km). The cws
 * domain is measure-keyed PER VARIABLE (its two variables read different
 * measures from the same endpoint), so callers pass `variableId` for it;
 * without one, cws falls back to the delivery measure.
 */
export function unitTokenForView(
  domain: DidDomain,
  view: string,
  variableId?: string,
): DidUnitToken {
  if (domain === "delta") return "km"
  if (domain === "gw") return view === "level" ? "level" : "volume"
  if (domain === "salmon") return "nof_3yr_avg"
  if (domain === "cws") {
    if (variableId === "cws_short") {
      return view === "pct_demand" ? "shortage_pct" : "shortage_total"
    }
    return "delivery"
  }
  if (view === "pct") return "pct_capacity"
  return "volume"
}

/**
 * Facets to request. The frontend derives exceedance, box, and cv from the raw
 * 100-year series (latency-validated: FE compute is effectively free), so
 * `values` is the only facet the explorer needs.
 */
export function includeForView(_view: string): DidIncludeToken[] {
  return ["values"]
}

/** Extract a numeric series from a `values` facet, dropping null years. */
export function seriesFromValues(
  values: ReadonlyArray<{ value: number | null }> | undefined,
): number[] {
  if (!values) return []
  const out: number[] = []
  for (const point of values) {
    if (point.value != null) out.push(point.value)
  }
  return out
}

/** One extracted live point list: values plus their water years, index-aligned. */
export interface SeriesPoints {
  series: number[]
  waterYears: number[]
}

/**
 * Extract values AND water years from a `values` facet, dropping null-value
 * years. `waterYears` is empty when any surviving point lacks a water_year,
 * so consumers can trust index alignment or fall back to index labels.
 */
export function pointsFromValues(
  values:
    | ReadonlyArray<{ water_year?: number; value: number | null }>
    | undefined,
): SeriesPoints {
  const series: number[] = []
  const waterYears: number[] = []
  let allYears = true
  if (values) {
    for (const point of values) {
      if (point.value == null) continue
      series.push(point.value)
      if (point.water_year == null) allYears = false
      else waterYears.push(point.water_year)
    }
  }
  return { series, waterYears: allYears ? waterYears : [] }
}

/** Per-scenario response array key for each domain. */
const RESPONSE_ARRAY_BY_DOMAIN: Record<
  DidDomain,
  "reservoirs" | "rivers" | "subjects"
> = {
  reservoir: "reservoirs",
  river: "rivers",
  delta: "subjects",
  sysdel: "subjects",
  gw: "subjects",
  salmon: "subjects",
  cws: "subjects",
}

/**
 * Request unit token -> response series key. Unit-keyed domains use unit
 * codes (TAF, PCT_CAP, km); measure-keyed domains use the measure name
 * itself (gw: volume/level; cws: delivery/shortage_total/shortage_pct) or
 * the metric code (salmon: NOF_3YR_AVG).
 */
const RESPONSE_UNIT_KEY: Record<DidUnitToken, string> = {
  volume: "TAF",
  pct_capacity: "PCT_CAP",
  km: "km",
  level: "level",
  nof_3yr_avg: "NOF_3YR_AVG",
  delivery: "delivery",
  shortage_total: "shortage_total",
  shortage_pct: "shortage_pct",
}

/** The series key for a domain + request token (gw is keyed by measure name). */
function responseSeriesKey(domain: DidDomain, unitToken: DidUnitToken): string {
  if (domain === "gw") return unitToken === "level" ? "level" : "volume"
  return RESPONSE_UNIT_KEY[unitToken]
}

/** Minimal structural shape of one scenario block in a data-in-depth response. */
type LiveFacet = {
  values?: ReadonlyArray<{ water_year?: number; value: number | null }>
}
type LiveSubject = {
  subject: string
  periods?: Record<string, Record<string, LiveFacet>>
}
export type LiveScenarioBlock = {
  reservoirs?: LiveSubject[]
  rivers?: LiveSubject[]
  subjects?: LiveSubject[]
}

/**
 * Pull the raw annual series for one (subject, period, unit) out of a single
 * scenario's response block. Returns [] when the block, subject, period, or
 * unit is absent, so the caller falls back to the mock engine.
 */
export function pickLiveSeries(
  block: LiveScenarioBlock | undefined,
  domain: DidDomain,
  subject: string,
  period: DidPeriodToken,
  unitToken: DidUnitToken,
): number[] {
  if (!block) return []
  const subjects = block[RESPONSE_ARRAY_BY_DOMAIN[domain]]
  const match = subjects?.find((s) => s.subject === subject)
  const facet = match?.periods?.[period]?.[responseSeriesKey(domain, unitToken)]
  return seriesFromValues(facet?.values)
}

/**
 * Like `pickLiveSeries` but returns water years alongside the values so
 * exports can label rows with real years. Same fallback contract: an empty
 * `series` means the caller uses the mock engine.
 */
export function pickLiveSeriesPoints(
  block: LiveScenarioBlock | undefined,
  domain: DidDomain,
  subject: string,
  period: DidPeriodToken,
  unitToken: DidUnitToken,
): SeriesPoints {
  if (!block) return { series: [], waterYears: [] }
  const subjects = block[RESPONSE_ARRAY_BY_DOMAIN[domain]]
  const match = subjects?.find((s) => s.subject === subject)
  const facet = match?.periods?.[period]?.[responseSeriesKey(domain, unitToken)]
  return pointsFromValues(facet?.values)
}
