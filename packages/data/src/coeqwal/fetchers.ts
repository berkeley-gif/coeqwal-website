/**
 * COEQWAL API fetch functions
 *
 * These functions fetch data from the COEQWAL API.
 * They use the shared apiFetcher with retry logic.
 *
 * Note: These fetchers have no baseUrl parameter - they always use
 * the production API. This makes them compatible with SWR's fetcher
 * signature (SWR passes the cache key as the first argument).
 */

import { apiFetcher } from "../fetching/fetcher"
import { DEFAULT_API_BASE, ENDPOINTS } from "./api"
import type {
  TierListItem,
  ScenarioTiersResponse,
  ScenarioListItem,
  AllReservoirsListResponse,
  ReservoirPercentiles,
  AllReservoirPercentilesResponse,
  GroupedReservoirPercentilesResponse,
  SpillMonthlyResponse,
  MiContractorMonthlyResponse,
  MiContractorPeriodResponse,
  DemandUnitsListResponse,
  DemandUnitMonthlyResponse,
  DemandUnitShortageMonthlyResponse,
  DemandUnitPeriodResponse,
  AgDemandUnitsListResponse,
  AgDemandUnitDeliveryMonthlyResponse,
  AgDemandUnitShortageMonthlyResponse,
  AgDemandUnitPeriodResponse,
  BatchStatisticsResponse,
  RefugeDemandUnitsListResponse,
  RefugeDeliveryMonthlyResponse,
  RefugeShortageMonthlyResponse,
  RefugePeriodResponse,
  ChannelsListResponse,
  DeltaMonthlyResponse,
  TierLocationAssignmentsResponse,
  TierLocationAssignmentsBatchResponse,
} from "./types"

/**
 * Fetch list of all tiers/outcomes
 *
 * @returns Array of tier definitions
 *
 * @example
 * ```typescript
 * const tiers = await fetchTierList()
 * // [{ short_code: "AG_REV", name: "Agricultural revenue", ... }, ...]
 * ```
 */
export async function fetchTierList(): Promise<TierListItem[]> {
  return apiFetcher<TierListItem[]>(ENDPOINTS.TIER_LIST, {
    baseUrl: DEFAULT_API_BASE,
  })
}

/**
 * Fetch tier data for a specific scenario
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Scenario tier data with scores
 *
 * @example
 * ```typescript
 * const data = await fetchScenarioTiers("s0020")
 * // { scenario: "s0020", tiers: { AG_REV: { ... }, ENV_FLOWS: { ... } } }
 * ```
 */
export async function fetchScenarioTiers(
  scenarioId: string,
): Promise<ScenarioTiersResponse> {
  return apiFetcher<ScenarioTiersResponse>(
    ENDPOINTS.scenarioTiers(scenarioId),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch list of all scenarios
 *
 * @returns Array of scenario metadata
 *
 * @example
 * ```typescript
 * const scenarios = await fetchScenarioList()
 * const activeScenarios = scenarios.filter(s => s.is_active)
 * ```
 */
export async function fetchScenarioList(): Promise<ScenarioListItem[]> {
  return apiFetcher<ScenarioListItem[]>(ENDPOINTS.SCENARIOS, {
    baseUrl: DEFAULT_API_BASE,
  })
}

/**
 * Batch response from /api/tiers/batch
 */
interface BatchScenarioTiersResponse {
  scenarios: Record<string, ScenarioTiersResponse>
  count: number
}

/**
 * Fetch tier data for multiple scenarios in a single batched request.
 *
 * Uses the `/api/tiers/batch` endpoint which runs one SQL query for all
 * scenarios instead of N individual requests. Falls back to parallel
 * per-scenario requests if the batch endpoint fails (e.g., on older API
 * versions).
 *
 * @param scenarioIds - Array of scenario IDs
 * @returns Map of scenarioId -> ScenarioTiersResponse
 *
 * @example
 * ```typescript
 * const allData = await fetchAllScenarioTiers(["s0020", "s0021", "s0022"])
 * const s0020Data = allData["s0020"] // undefined if that scenario failed
 * ```
 */
export async function fetchAllScenarioTiers(
  scenarioIds: string[],
): Promise<Record<string, ScenarioTiersResponse>> {
  if (scenarioIds.length === 0) return {}

  try {
    const batch = await apiFetcher<BatchScenarioTiersResponse>(
      ENDPOINTS.batchScenarioTiers(scenarioIds),
      { baseUrl: DEFAULT_API_BASE, timeout: 30000 },
    )
    return batch.scenarios
  } catch {
    // Fallback: parallel per-scenario requests (for older API deployments)
    const results = await Promise.allSettled(
      scenarioIds.map((id) => fetchScenarioTiers(id)),
    )

    const record: Record<string, ScenarioTiersResponse> = {}
    scenarioIds.forEach((id, i) => {
      const result = results[i]
      if (result?.status === "fulfilled") {
        record[id] = result.value
      }
    })
    return record
  }
}

/**
 * Fetch lightweight tier assignments per location (no geometry).
 *
 * Use this for treemaps, data tables, and map visualizations. Geometry for
 * map rendering comes from Mapbox vector tilesets, not from the API. The
 * frontend joins these assignments to tile features by `location_id` (or
 * `du_id` / `wba_id` / station code, depending on the outcome).
 *
 * Calls the batch endpoint with a one-element `codes` filter and unwraps the
 * single result so consumers continue to see a flat
 * `TierLocationAssignmentsResponse` shape. Throws if the server reports the
 * code as missing for the scenario (mirrors the old single-tier 404).
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param tierCode - Tier short code (e.g., "CWS_DEL", "AG_REV")
 *
 * @example
 * ```typescript
 * const data = await fetchTierLocationAssignments("s0020", "CWS_DEL")
 * const tier4 = data.locations.filter(l => l.tier_level === 4)
 * ```
 */
export async function fetchTierLocationAssignments(
  scenarioId: string,
  tierCode: string,
): Promise<TierLocationAssignmentsResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  if (!tierCode) {
    throw new Error("Tier code is required")
  }

  const batch = await apiFetcher<TierLocationAssignmentsBatchResponse>(
    ENDPOINTS.tierLocationAssignmentsBatch(scenarioId, [tierCode]),
    { baseUrl: DEFAULT_API_BASE },
  )

  const entry = batch.results?.[tierCode]
  if (!entry) {
    throw new Error(
      `No tier data found for scenario '${scenarioId}' and tier '${tierCode}'`,
    )
  }
  return entry
}

/**
 * Fetch tier-location assignments for multiple outcomes in a single batched
 * request.
 *
 * Uses the `/api/tiers/scenarios/{scenario}/locations?codes=...` endpoint which runs
 * one SQL query for all requested outcomes instead of N parallel requests.
 *
 * Codes are normalized (deduplicated and sorted) before being used in the
 * URL, so cache keys do not depend on caller ordering.
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param tierCodes - Tier short codes (e.g., ["CWS_DEL", "AG_REV", "ENV_FLOWS"])
 *
 * @example
 * ```typescript
 * const batch = await fetchTierLocationAssignmentsBatch("s0020", [
 *   "CWS_DEL", "AG_REV", "ENV_FLOWS",
 * ])
 * const cwsDel = batch.results["CWS_DEL"]
 * const absent = batch.missing // e.g. [] or ["WRC_SALMON_AB"] on s0065
 * ```
 */
export async function fetchTierLocationAssignmentsBatch(
  scenarioId: string,
  tierCodes: string[],
): Promise<TierLocationAssignmentsBatchResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  const normalized = Array.from(new Set(tierCodes)).sort()
  if (normalized.length === 0) {
    return { scenario: scenarioId, results: {}, missing: [] }
  }

  return apiFetcher<TierLocationAssignmentsBatchResponse>(
    ENDPOINTS.tierLocationAssignmentsBatch(scenarioId, normalized),
    { baseUrl: DEFAULT_API_BASE, timeout: 20000 },
  )
}

// ============================================================================
// Statistics API fetchers (reservoir percentiles)
// ============================================================================

/**
 * Fetch list of all reservoirs with statistics data.
 * Returns all available reservoirs including capacity information.
 *
 * @returns Array of reservoir info with capacity
 *
 * @example
 * ```typescript
 * const { reservoirs } = await fetchAllReservoirsList()
 * // [{ reservoir_id: "SHSTA", reservoir_name: "Shasta", capacity_taf: 4552 }, ...]
 * ```
 */
export async function fetchAllReservoirsList(): Promise<AllReservoirsListResponse> {
  return apiFetcher<AllReservoirsListResponse>(
    ENDPOINTS.STATISTICS_RESERVOIRS_ALL,
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch percentile data for a single reservoir in a scenario.
 *
 * Calls the multi-reservoir endpoint with a one-element `reservoirs` filter
 * and unwraps the single entry, so consumers continue to see a flat
 * `ReservoirPercentiles` shape.
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param reservoirId - Reservoir short_code (e.g., "SHSTA")
 *
 * @example
 * ```typescript
 * const data = await fetchReservoirPercentiles("s0020", "SHSTA")
 * // { reservoir_id: "SHSTA", monthly_percentiles: { "1": { q10: 45.2, q50: 70.1, ... } } }
 * ```
 */
export async function fetchReservoirPercentiles(
  scenarioId: string,
  reservoirId: string,
): Promise<ReservoirPercentiles> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  if (!reservoirId) {
    throw new Error("Reservoir ID is required")
  }

  const response = await apiFetcher<GroupedReservoirPercentilesResponse>(
    ENDPOINTS.reservoirPercentilesFiltered(scenarioId, [reservoirId]),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )

  const entry = response.reservoirs?.[reservoirId]
  if (!entry) {
    throw new Error(
      `No percentile data found for reservoir ${reservoirId} in scenario ${scenarioId}`,
    )
  }

  return {
    reservoir_id: reservoirId,
    reservoir_name: entry.name,
    scenario_id: scenarioId,
    unit: "percent_capacity",
    capacity_taf: entry.capacity_taf,
    dead_pool_taf: entry.dead_pool_taf,
    monthly_percentiles: entry.monthly_percentiles,
  }
}

/**
 * Fetch percentile data for all reservoirs in a scenario
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns All reservoir percentile data for the scenario
 *
 * @example
 * ```typescript
 * const data = await fetchAllReservoirPercentiles("s0020")
 * // { scenario_id: "s0020", reservoirs: { "S_SHSTA": { ... }, "S_OROVL": { ... } } }
 * ```
 */
export async function fetchAllReservoirPercentiles(
  scenarioId: string,
): Promise<AllReservoirPercentilesResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<AllReservoirPercentilesResponse>(
    ENDPOINTS.allReservoirPercentiles(scenarioId),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch percentile data for a group of reservoirs in a scenario
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param group - Reservoir group (e.g., "major")
 * @returns Grouped reservoir percentile data for the scenario
 *
 * @example
 * ```typescript
 * const data = await fetchGroupedReservoirPercentiles("s0020", "major")
 * // { scenario_id: "s0020", group: "major", reservoirs: { "FOLSM": { ... }, "SHSTA": { ... } } }
 * ```
 */
export async function fetchGroupedReservoirPercentiles(
  scenarioId: string,
  group: string,
): Promise<GroupedReservoirPercentilesResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  if (!group) {
    throw new Error("Group is required")
  }

  return apiFetcher<GroupedReservoirPercentilesResponse>(
    ENDPOINTS.groupedReservoirPercentiles(scenarioId, group),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch monthly spill statistics for reservoirs
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param group - Reservoir group (e.g., "major")
 * @returns Spill data with monthly percentiles and frequency
 *
 * @example
 * ```typescript
 * const data = await fetchSpillMonthly("s0020", "major")
 * // { scenario_id: "s0020", group: "major", reservoirs: { "SHSTA": { spill_frequency: 45.2, ... } } }
 * ```
 */
export async function fetchSpillMonthly(
  scenarioId: string,
  group: string,
): Promise<SpillMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  if (!group) {
    throw new Error("Group is required")
  }

  return apiFetcher<SpillMonthlyResponse>(
    ENDPOINTS.spillMonthly(scenarioId, group),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

// ============================================================================
// M&I Contractors API fetchers (30 SWP water agency contractors)
// ============================================================================

/**
 * Fetch monthly delivery and shortage statistics for M&I contractors
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param contractor - Optional filter by contractor short_code
 * @returns Monthly statistics for M&I contractors
 *
 * @example
 * ```typescript
 * const data = await fetchMiContractorsMonthly("s0020")
 * // { scenario_id: "s0020", contractors: { "mwd_mi": { monthly_delivery: {...}, monthly_shortage: {...} } } }
 * ```
 */
export async function fetchMiContractorsMonthly(
  scenarioId: string,
  contractor?: string,
): Promise<MiContractorMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<MiContractorMonthlyResponse>(
    ENDPOINTS.miContractorsMonthly(scenarioId, contractor),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch period-of-record summary for M&I contractors
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param contractor - Optional filter by contractor short_code
 * @returns Period summary with annual averages, reliability, and exceedance values
 *
 * @example
 * ```typescript
 * const data = await fetchMiContractorsPeriod("s0020")
 * // { scenario_id: "s0020", contractors: { "mwd_mi": { annual_delivery_avg_taf: 1506, reliability_pct: 90, ... } } }
 * ```
 */
export async function fetchMiContractorsPeriod(
  scenarioId: string,
  contractor?: string,
): Promise<MiContractorPeriodResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<MiContractorPeriodResponse>(
    ENDPOINTS.miContractorsPeriod(scenarioId, contractor),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

// ============================================================================
// Urban Demand Units API fetchers (46 demand units)
// ============================================================================

/**
 * Fetch list of urban demand units
 *
 * @param group - Optional filter by group (e.g., "swp", "cvp")
 * @returns Array of urban demand units
 *
 * @example
 * ```typescript
 * const { demand_units } = await fetchDemandUnitsList()
 * // [{ du_id: "UD_ACWD", label: "Alameda County Water District" }, ...]
 * ```
 */
export async function fetchDemandUnitsList(
  group?: string,
): Promise<DemandUnitsListResponse> {
  return apiFetcher<DemandUnitsListResponse>(ENDPOINTS.demandUnitsList(group), {
    baseUrl: DEFAULT_API_BASE,
  })
}

/**
 * Fetch monthly delivery statistics for urban demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duId - Optional filter by demand unit ID (e.g., "UD_ACWD")
 * @param group - Optional group filter (e.g., "swp")
 *
 * @example
 * ```typescript
 * const data = await fetchDemandUnitsMonthly("s0020")
 * // { scenario_id: "s0020", demand_units: { "UD_ACWD": { monthly_delivery: {...} } } }
 * ```
 */
export async function fetchDemandUnitsMonthly(
  scenarioId: string,
  duId?: string,
  group?: string,
): Promise<DemandUnitMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<DemandUnitMonthlyResponse>(
    ENDPOINTS.demandUnitsMonthly(scenarioId, duId, group),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch monthly shortage statistics for urban demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duId - Optional filter by demand unit ID
 * @param group - Optional group filter
 *
 * @example
 * ```typescript
 * const data = await fetchDemandUnitsShortageMonthly("s0020", "MWD")
 * // { scenario_id: "s0020", demand_units: { "MWD": { monthly_shortage: {...} } } }
 * ```
 */
export async function fetchDemandUnitsShortageMonthly(
  scenarioId: string,
  duId?: string,
  group?: string,
): Promise<DemandUnitShortageMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<DemandUnitShortageMonthlyResponse>(
    ENDPOINTS.demandUnitsShortageMonthly(scenarioId, duId, group),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch period-of-record summary for urban demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duId - Optional filter by demand unit ID
 * @param group - Optional group filter
 * @returns Period summary with annual averages, reliability, and exceedance values
 *
 * @example
 * ```typescript
 * const data = await fetchDemandUnitsPeriod("s0020")
 * // { scenario_id: "s0020", demand_units: { "UD_ACWD": { annual_delivery_avg_taf: 50, reliability_pct: 85, ... } } }
 * ```
 */
export async function fetchDemandUnitsPeriod(
  scenarioId: string,
  duId?: string,
  group?: string,
): Promise<DemandUnitPeriodResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<DemandUnitPeriodResponse>(
    ENDPOINTS.demandUnitsPeriod(scenarioId, duId, group),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

// ============================================================================
// AG Demand Units API fetchers (150 agricultural demand units)
// ============================================================================

/**
 * Fetch the list of AG demand-unit entities, optionally filtered.
 * Used to populate the "Add a demand unit" dropdown in AgSection.
 *
 * @param filters - Optional region / cs3_type / provider filters
 * @returns Demand-unit list plus a `count` total
 *
 * @example
 * ```typescript
 * const { demand_units } = await fetchAgDemandUnitsList({ region: "SJR" })
 * ```
 */
export async function fetchAgDemandUnitsList(filters?: {
  region?: string
  cs3_type?: string
  provider?: string
}): Promise<AgDemandUnitsListResponse> {
  return apiFetcher<AgDemandUnitsListResponse>(
    ENDPOINTS.agDemandUnitsList(filters),
    { baseUrl: DEFAULT_API_BASE },
  )
}

/**
 * Fetch monthly surface-water delivery statistics for AG demand units.
 *
 * The backend route is `sw-delivery-monthly` and returns each DU's monthly
 * stats under `monthly_sw_delivery`. We remap that to `monthly_delivery`
 * here so the frontend can reuse `AgDemandUnitDeliveryData` and the same
 * matrix code path as CWS aggregates.
 *
 * Pass `duIds` to scope the response to specific demand units. The list
 * gets serialized to the backend's comma-separated `du_id` filter
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duIds - Optional list of demand unit IDs to fetch
 * @returns Monthly delivery statistics for the requested AG demand units
 */
export async function fetchAgDemandUnitsDeliveryMonthly(
  scenarioId: string,
  duIds?: string[],
): Promise<AgDemandUnitDeliveryMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  // Backend response shape: { demand_units: { [duId]: { monthly_sw_delivery: {...}, ... } } }
  // We surface it as `monthly_delivery` for downstream callers
  type RawDuEntry = {
    agency: string
    hydrologic_region: string | null
    cs3_type: string | null
    provider: string | null
    monthly_sw_delivery?: Record<string, unknown>
    monthly_delivery?: Record<string, unknown>
  }
  type RawResponse = {
    scenario_id: string
    demand_units: Record<string, RawDuEntry>
  }

  const raw = await apiFetcher<RawResponse>(
    ENDPOINTS.agDemandUnitsDeliveryMonthly(scenarioId, duIds),
    {
      baseUrl: DEFAULT_API_BASE,
      timeout: 30000,
    },
  )

  const remapped: AgDemandUnitDeliveryMonthlyResponse = {
    scenario_id: raw.scenario_id,
    demand_units: {},
  }
  for (const [duId, entry] of Object.entries(raw.demand_units ?? {})) {
    const monthly = entry.monthly_sw_delivery ?? entry.monthly_delivery ?? {}
    remapped.demand_units[duId] = {
      agency: entry.agency,
      hydrologic_region: entry.hydrologic_region,
      cs3_type: entry.cs3_type,
      provider: entry.provider,
      monthly_delivery:
        monthly as AgDemandUnitDeliveryMonthlyResponse["demand_units"][string]["monthly_delivery"],
    }
  }
  return remapped
}

/**
 * Fetch monthly GW restriction shortage statistics for AG demand units.
 *
 * Source variable: `GW_SHORT_*`. Available only for SJR and TULARE region
 * DUs. Sacramento DUs are not present in the response. A 404 from the
 * backend means none of the requested DUs have shortage data; the fetcher
 * surfaces the error rather than swallowing it so callers can distinguish
 * "no data" from a real failure.
 *
 * Pass `duIds` to scope the response to specific demand units via the
 * backend's comma-separated `du_id` filter
 *
 * @param scenarioId - Scenario ID (e.g., "s0025")
 * @param duIds - Optional list of demand unit IDs to fetch
 * @returns Monthly shortage statistics for the requested AG demand units
 */
export async function fetchAgDemandUnitsShortageMonthly(
  scenarioId: string,
  duIds?: string[],
): Promise<AgDemandUnitShortageMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<AgDemandUnitShortageMonthlyResponse>(
    ENDPOINTS.agDemandUnitsShortageMonthly(scenarioId, duIds),
    {
      baseUrl: DEFAULT_API_BASE,
      timeout: 30000,
    },
  )
}

/**
 * Fetch period-of-record summary for AG demand units.
 * Pass `duIds` to scope the response to specific demand units via the
 * backend's comma-separated `du_id` filter
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duIds - Optional list of demand unit IDs to fetch
 * @returns Period summary for the requested AG demand units
 */
export async function fetchAgDemandUnitsPeriod(
  scenarioId: string,
  duIds?: string[],
): Promise<AgDemandUnitPeriodResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<AgDemandUnitPeriodResponse>(
    ENDPOINTS.agDemandUnitsPeriod(scenarioId, duIds),
    {
      baseUrl: DEFAULT_API_BASE,
      timeout: 30000,
    },
  )
}

// ============================================================================
// Batch Statistics API fetcher
// ============================================================================

/**
 * Fetch batch statistics for multiple scenarios
 *
 * This dramatically improves Data Explorer load time by fetching all data
 * in a single request instead of N×M individual requests.
 *
 * @param scenarios - Array of scenario IDs (e.g., ["s0020", "s0021"])
 * @param types - Data types to fetch (default: ["storage", "cws", "ag"])
 * @returns Combined statistics for all scenarios
 *
 * @example
 * ```typescript
 * const data = await fetchBatchStatistics(["s0020", "s0021"])
 * // { scenarios: ["s0020", "s0021"], storage: {...}, cws: {...}, ag: {...} }
 * ```
 */
export async function fetchBatchStatistics(
  scenarios: string[],
  types: string[] = ["storage", "cws", "ag"],
): Promise<BatchStatisticsResponse> {
  if (!scenarios || scenarios.length === 0) {
    throw new Error("At least one scenario is required")
  }

  return apiFetcher<BatchStatisticsResponse>(
    ENDPOINTS.batchStatistics(scenarios, types),
    {
      baseUrl: DEFAULT_API_BASE,
      timeout: 60000, // Larger timeout for batch requests
    },
  )
}

// ============================================================================
// Wildlife Refuge Demand Unit fetchers
// ============================================================================

/**
 * Fetch list of wildlife refuge demand units
 *
 * @returns All 18 refuge demand unit entities
 */
export async function fetchRefugeDemandUnitsList(): Promise<RefugeDemandUnitsListResponse> {
  return apiFetcher<RefugeDemandUnitsListResponse>(
    ENDPOINTS.refugeDemandUnitsList(),
    { baseUrl: DEFAULT_API_BASE },
  )
}

/**
 * Fetch monthly delivery statistics for refuge demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Monthly delivery for 18 refuge demand units × 12 water months
 */
export async function fetchRefugeDusDeliveryMonthly(
  scenarioId: string,
): Promise<RefugeDeliveryMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  return apiFetcher<RefugeDeliveryMonthlyResponse>(
    ENDPOINTS.refugeDusDeliveryMonthly(scenarioId),
    { baseUrl: DEFAULT_API_BASE, timeout: 15000 },
  )
}

/**
 * Fetch monthly shortage statistics for refuge demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Monthly shortage for 18 refuge demand units × 12 water months
 */
export async function fetchRefugeDusShortageMonthly(
  scenarioId: string,
): Promise<RefugeShortageMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  return apiFetcher<RefugeShortageMonthlyResponse>(
    ENDPOINTS.refugeDusShortageMonthly(scenarioId),
    { baseUrl: DEFAULT_API_BASE, timeout: 15000 },
  )
}

/**
 * Fetch period-of-record summary for refuge demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Annual averages, CVs, and reliability_pct_95 for 18 refuge DUs
 */
export async function fetchRefugeDusPeriod(
  scenarioId: string,
): Promise<RefugePeriodResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  return apiFetcher<RefugePeriodResponse>(
    ENDPOINTS.refugeDusPeriod(scenarioId),
    { baseUrl: DEFAULT_API_BASE, timeout: 15000 },
  )
}

// ============================================================================
// Environmental River Flows fetchers (59 CalSim channel reaches)
// ============================================================================

/**
 * Fetch all 59 env-flow channel reach entities
 *
 * @returns Channel list with watershed, class, and capability attributes
 */
export async function fetchChannelsList(
  channelClass?: string,
  watershed?: string,
): Promise<ChannelsListResponse> {
  return apiFetcher<ChannelsListResponse>(
    ENDPOINTS.channelsList(channelClass, watershed),
    { baseUrl: DEFAULT_API_BASE },
  )
}

// ============================================================================
// Delta Statistics
// ============================================================================

/**
 * Fetch monthly Delta statistics (X2, salinity, outflow)
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param category - Optional: 'x2', 'salinity_compliance', 'salinity_pumps', 'outflow'
 * @returns 8 variables × 12 water months = 96 rows (or subset if filtered)
 */
export async function fetchDeltaMonthly(
  scenarioId: string,
  category?: string,
): Promise<DeltaMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  return apiFetcher<DeltaMonthlyResponse>(
    ENDPOINTS.deltaMonthly(scenarioId, category),
    { baseUrl: DEFAULT_API_BASE },
  )
}
