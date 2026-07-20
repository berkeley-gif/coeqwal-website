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
 * Only the scenarios compare axis and these variables are live; everything else
 * falls back to the deterministic mock engine (a null return here = mock).
 */

/** A live data-in-depth domain (one endpoint each). */
export type DidDomain = "reservoir" | "river" | "delta"
/** Request unit token (not the response unit key). */
export type DidUnitToken = "volume" | "pct_capacity" | "km"
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
}

/** One pinned period per live variable, so `values` is a clean annual series. */
const PERIOD_BY_VARIABLE: Record<string, DidPeriodToken> = {
  res_apr: "april",
  res_sep: "sept",
  riv_flow: "annual",
  x2_apr: "april",
  x2_sep: "sept",
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
 * subject the API lacks). Delta serves only X2.
 */
export function toDidSubject(
  domain: DidDomain,
  locationId: string,
): string | null {
  if (domain === "delta") return "X2"
  if (domain === "reservoir") {
    const code = RESERVOIR_SUBJECT_REMAP[locationId] ?? locationId
    return RESERVOIR_SUBJECTS.has(code) ? code : null
  }
  const code = RIVER_SUBJECT_REMAP[locationId] ?? locationId
  return RIVER_SUBJECTS.has(code) ? code : null
}

/** Request unit token for a domain and view (delta is always km). */
export function unitTokenForView(
  domain: DidDomain,
  view: string,
): DidUnitToken {
  if (domain === "delta") return "km"
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

/** Per-scenario response array key for each domain. */
const RESPONSE_ARRAY_BY_DOMAIN: Record<
  DidDomain,
  "reservoirs" | "rivers" | "subjects"
> = {
  reservoir: "reservoirs",
  river: "rivers",
  delta: "subjects",
}

/** Request unit token -> response unit key. */
const RESPONSE_UNIT_KEY: Record<DidUnitToken, string> = {
  volume: "TAF",
  pct_capacity: "PCT_CAP",
  km: "km",
}

/** Minimal structural shape of one scenario block in a data-in-depth response. */
type LiveFacet = { values?: ReadonlyArray<{ value: number | null }> }
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
  const facet = match?.periods?.[period]?.[RESPONSE_UNIT_KEY[unitToken]]
  return seriesFromValues(facet?.values)
}
