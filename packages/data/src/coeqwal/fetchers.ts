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
  TierLocationResponse,
  ReservoirListResponse,
  AllReservoirsListResponse,
  StatisticsScenariosResponse,
  ReservoirPercentiles,
  AllReservoirPercentilesResponse,
  GroupedReservoirPercentilesResponse,
  StorageMonthlyResponse,
  SpillMonthlyResponse,
  CwsAggregatesListResponse,
  CwsAggregateMonthlyResponse,
  CwsAggregatePeriodResponse,
  MiContractorsListResponse,
  MiContractorMonthlyResponse,
  MiContractorPeriodResponse,
  DemandUnitsListResponse,
  DemandUnitsGroupedResponse,
  DemandUnitStatisticsResponse,
  DemandUnitMonthlyResponse,
  DemandUnitPeriodResponse,
  AgAggregateMonthlyResponse,
  AgAggregatePeriodResponse,
  AgDemandUnitDeliveryMonthlyResponse,
  AgDemandUnitShortageMonthlyResponse,
  AgDemandUnitPeriodResponse,
  ReservoirPeriodSummaryResponse,
  BatchStatisticsResponse,
  RefugeDemandUnitsListResponse,
  RefugeDeliveryMonthlyResponse,
  RefugeShortageMonthlyResponse,
  RefugePeriodResponse,
  ChannelsListResponse,
  EnvFlowSeasonsResponse,
  ChannelsMonthlyResponse,
  ChannelsSeasonalResponse,
  ChannelsPeriodSummaryResponse,
  DeltaMonthlyResponse,
  TierLocationAssignmentsResponse,
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
 * // { scenario: "s0020", tiers: { AG_REV: { ... }, ENV_FLOW: { ... } } }
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
 * Fetch tier data for a single outcome within a scenario
 *
 * Returns weighted_score, normalized_score, gini, and tier distribution data
 * for multi_value outcomes (e.g. ENV_FLOWS, AG_REV), or single_tier_level for
 * single_value outcomes (e.g. DELTA_ECO).
 *
 * Use when you need one outcome's data without fetching the full scenario.
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param tierCode - Tier short code (e.g., "ENV_FLOWS")
 * @returns Tier info including distribution data and scores
 *
 * @example
 * ```typescript
 * const data = await fetchScenarioTierByCode("s0020", "ENV_FLOWS")
 * // { scenario: "s0020", tier_code: "ENV_FLOWS", tier_type: "multi_value",
 * //   weighted_score: 2.4, data: [...], total_value: 17 }
 * ```
 */
export async function fetchScenarioTierByCode(
  scenarioId: string,
  tierCode: string,
): Promise<
  ScenarioTiersResponse["tiers"][string] & {
    scenario: string
    tier_code: string
  }
> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  if (!tierCode) {
    throw new Error("Tier code is required")
  }

  return apiFetcher(ENDPOINTS.scenarioTierByCode(scenarioId, tierCode), {
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
 * Fetch tier location data for map visualization
 *
 * Returns GeoJSON FeatureCollection with location geometries and tier levels.
 * Used for rendering tier-colored polygons and markers on the map.
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param tierCode - Tier short code (e.g., "AG_REV", "CWS_DEL")
 * @returns GeoJSON FeatureCollection with tier location data
 *
 * @example
 * ```typescript
 * const locations = await fetchTierLocationData("s0020", "CWS_DEL")
 * const tier4Features = locations.features.filter(f => f.properties.tier_level === 4)
 * ```
 */
export async function fetchTierLocationData(
  scenarioId: string,
  tierCode: string,
): Promise<TierLocationResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  if (!tierCode) {
    throw new Error("Tier code is required")
  }

  return apiFetcher<TierLocationResponse>(
    ENDPOINTS.tierLocations(scenarioId, tierCode),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch lightweight tier assignments per location (no geometry).
 *
 * Use this for treemaps, data tables, or any non-map visualization that needs
 * to know which locations fall into which tier. Much lighter than
 * fetchTierLocationData, which returns full GeoJSON with polygon coordinates.
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param tierCode - Tier short code (e.g., "CWS_DEL", "AG_REV")
 * @returns Tier assignments with location metadata (no geometry)
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

  return apiFetcher<TierLocationAssignmentsResponse>(
    ENDPOINTS.tierLocationAssignments(scenarioId, tierCode),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

// ============================================================================
// Statistics API fetchers (reservoir percentiles)
// ============================================================================

/**
 * Fetch list of all reservoirs with percentile data
 *
 * @returns Array of reservoir info
 *
 * @example
 * ```typescript
 * const { reservoirs } = await fetchReservoirList()
 * // [{ reservoir_id: "S_SHSTA", reservoir_name: "Shasta" }, ...]
 * ```
 */
export async function fetchReservoirList(): Promise<ReservoirListResponse> {
  return apiFetcher<ReservoirListResponse>(ENDPOINTS.STATISTICS_RESERVOIRS, {
    baseUrl: DEFAULT_API_BASE,
  })
}

/**
 * Fetch list of all reservoirs with statistics data
 * Returns all available reservoirs including capacity information
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
 * Fetch list of scenarios that have percentile data available
 *
 * @returns Scenarios with reservoir percentile data
 *
 * @example
 * ```typescript
 * const { scenarios, total } = await fetchScenariosWithPercentiles()
 * // { scenarios: [{ scenario_id: "s0020", reservoirs: ["S_SHSTA", ...] }], total: 1 }
 * ```
 */
export async function fetchScenariosWithPercentiles(): Promise<StatisticsScenariosResponse> {
  return apiFetcher<StatisticsScenariosResponse>(
    ENDPOINTS.STATISTICS_SCENARIOS,
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch percentile data for a single reservoir in a scenario
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param reservoirId - Reservoir ID (e.g., "S_SHSTA")
 * @returns Reservoir percentile data with monthly distributions
 *
 * @example
 * ```typescript
 * const data = await fetchReservoirPercentiles("s0020", "S_SHSTA")
 * // { reservoir_id: "S_SHSTA", monthly_percentiles: { "1": { q10: 45.2, q50: 70.1, ... } } }
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

  return apiFetcher<ReservoirPercentiles>(
    ENDPOINTS.reservoirPercentiles(scenarioId, reservoirId),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
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
 * Fetch monthly storage data with both percentage and TAF values
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param group - Reservoir group (e.g., "major")
 * @returns Storage data with both monthly_percent and monthly_taf
 *
 * @example
 * ```typescript
 * const data = await fetchStorageMonthly("s0020", "major")
 * // { scenario_id: "s0020", group: "major", reservoirs: { "SHSTA": { monthly_percent: {...}, monthly_taf: {...} } } }
 * ```
 */
export async function fetchStorageMonthly(
  scenarioId: string,
  group: string,
): Promise<StorageMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  if (!group) {
    throw new Error("Group is required")
  }

  return apiFetcher<StorageMonthlyResponse>(
    ENDPOINTS.storageMonthly(scenarioId, group),
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
// CWS Aggregate API fetchers (M&I delivery/shortage statistics)
// ============================================================================

/**
 * Fetch list of CWS aggregate entities
 *
 * @returns Array of CWS aggregates (SWP Total, CVP North, CVP South, MWD)
 *
 * @example
 * ```typescript
 * const { aggregates } = await fetchCwsAggregatesList()
 * // [{ short_code: "swp_total", label: "SWP Total M&I" }, ...]
 * ```
 */
export async function fetchCwsAggregatesList(): Promise<CwsAggregatesListResponse> {
  return apiFetcher<CwsAggregatesListResponse>(ENDPOINTS.CWS_AGGREGATES_LIST, {
    baseUrl: DEFAULT_API_BASE,
  })
}

/**
 * Fetch monthly delivery and shortage statistics for CWS aggregates
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param aggregate - Optional filter by aggregate short_code (e.g., "swp_total")
 * @returns Monthly statistics for CWS aggregates
 *
 * @example
 * ```typescript
 * const data = await fetchCwsAggregatesMonthly("s0020")
 * // { scenario_id: "s0020", aggregates: { "swp_total": { monthly_delivery: {...}, monthly_shortage: {...} } } }
 * ```
 */
export async function fetchCwsAggregatesMonthly(
  scenarioId: string,
  aggregate?: string,
): Promise<CwsAggregateMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<CwsAggregateMonthlyResponse>(
    ENDPOINTS.cwsAggregatesMonthly(scenarioId, aggregate),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch period-of-record summary for CWS aggregates
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param aggregate - Optional filter by aggregate short_code
 * @returns Period summary with annual averages, reliability, and exceedance values
 *
 * @example
 * ```typescript
 * const data = await fetchCwsAggregatesPeriod("s0020")
 * // { scenario_id: "s0020", aggregates: { "swp_total": { annual_delivery_avg_taf: 1506, reliability_pct: 90, ... } } }
 * ```
 */
export async function fetchCwsAggregatesPeriod(
  scenarioId: string,
  aggregate?: string,
): Promise<CwsAggregatePeriodResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<CwsAggregatePeriodResponse>(
    ENDPOINTS.cwsAggregatesPeriod(scenarioId, aggregate),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

// ============================================================================
// M&I Contractors API fetchers (30 SWP water agency contractors)
// ============================================================================

/**
 * Fetch list of M&I contractors
 *
 * @param group - Optional filter by group (e.g., "swp")
 * @returns Array of M&I contractors
 *
 * @example
 * ```typescript
 * const { contractors } = await fetchMiContractorsList()
 * // [{ short_code: "mwd_mi", label: "Metropolitan Water District" }, ...]
 * ```
 */
export async function fetchMiContractorsList(
  group?: string,
): Promise<MiContractorsListResponse> {
  return apiFetcher<MiContractorsListResponse>(
    ENDPOINTS.miContractorsList(group),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

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
 * Fetch list of urban demand units organized by group
 *
 * @returns Demand units grouped by category (e.g., "swp", "cvp")
 *
 * @example
 * ```typescript
 * const { groups } = await fetchDemandUnitsGroups()
 * // { swp: [{ du_id: "UD_MWD", label: "Metropolitan Water District" }, ...], cvp: [...] }
 * ```
 */
export async function fetchDemandUnitsGroups(): Promise<DemandUnitsGroupedResponse> {
  return apiFetcher<DemandUnitsGroupedResponse>(ENDPOINTS.DEMAND_UNITS_GROUPS, {
    baseUrl: DEFAULT_API_BASE,
  })
}

/**
 * Fetch complete statistics for a single demand unit
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duId - Demand unit ID (e.g., "MWD", "SBA029")
 * @returns Complete statistics including monthly delivery/shortage and period summary
 *
 * @example
 * ```typescript
 * const data = await fetchDemandUnitStatistics("s0020", "MWD")
 * // { scenario_id: "s0020", du_id: "MWD", monthly_delivery: {...}, period_summary: {...} }
 * ```
 */
export async function fetchDemandUnitStatistics(
  scenarioId: string,
  duId: string,
): Promise<DemandUnitStatisticsResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  if (!duId) {
    throw new Error("Demand unit ID is required")
  }

  return apiFetcher<DemandUnitStatisticsResponse>(
    ENDPOINTS.demandUnitStatistics(scenarioId, duId),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch monthly delivery and shortage statistics for urban demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duId - Optional filter by demand unit ID (e.g., "UD_ACWD")
 * @param group - Optional group filter (e.g., "swp")
 * @returns Monthly statistics for urban demand units
 *
 * @example
 * ```typescript
 * const data = await fetchDemandUnitsMonthly("s0020")
 * // { scenario_id: "s0020", demand_units: { "UD_ACWD": { monthly_delivery: {...}, monthly_shortage: {...} } } }
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
// AG Aggregate API fetchers (Agricultural delivery statistics)
// ============================================================================

/**
 * Fetch monthly delivery statistics for AG aggregates
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Monthly statistics for AG aggregates (5 project totals)
 */
export async function fetchAgAggregatesMonthly(
  scenarioId: string,
): Promise<AgAggregateMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<AgAggregateMonthlyResponse>(
    ENDPOINTS.agAggregatesMonthly(scenarioId),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

/**
 * Fetch period-of-record summary for AG aggregates
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Period summary with annual averages and delivery exceedance
 */
export async function fetchAgAggregatesPeriod(
  scenarioId: string,
): Promise<AgAggregatePeriodResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<AgAggregatePeriodResponse>(
    ENDPOINTS.agAggregatesPeriod(scenarioId),
    {
      baseUrl: DEFAULT_API_BASE,
    },
  )
}

// ============================================================================
// AG Demand Units API fetchers (150 agricultural demand units)
// ============================================================================

/**
 * Fetch monthly delivery statistics for AG demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Monthly delivery statistics for 150 AG demand units
 */
export async function fetchAgDemandUnitsDeliveryMonthly(
  scenarioId: string,
): Promise<AgDemandUnitDeliveryMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<AgDemandUnitDeliveryMonthlyResponse>(
    ENDPOINTS.agDemandUnitsDeliveryMonthly(scenarioId),
    {
      baseUrl: DEFAULT_API_BASE,
      timeout: 30000, // 150 DUs × 12 months = large payload
    },
  )
}

/**
 * Fetch monthly shortage statistics for AG demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Monthly shortage statistics for AG demand units
 */
export async function fetchAgDemandUnitsShortageMonthly(
  scenarioId: string,
): Promise<AgDemandUnitShortageMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<AgDemandUnitShortageMonthlyResponse>(
    ENDPOINTS.agDemandUnitsShortageMonthly(scenarioId),
    {
      baseUrl: DEFAULT_API_BASE,
      timeout: 30000, // large payload
    },
  )
}

/**
 * Fetch period-of-record summary for AG demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Period summary with delivery exceedance for 150 AG demand units
 */
export async function fetchAgDemandUnitsPeriod(
  scenarioId: string,
): Promise<AgDemandUnitPeriodResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<AgDemandUnitPeriodResponse>(
    ENDPOINTS.agDemandUnitsPeriod(scenarioId),
    {
      baseUrl: DEFAULT_API_BASE,
      timeout: 30000, // 150 DUs = large payload
    },
  )
}

// ============================================================================
// Reservoir Period Summary API fetcher
// ============================================================================

/**
 * Fetch period-of-record summary for all reservoirs
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Storage exceedance and annual spill stats for all reservoirs
 */
export async function fetchReservoirPeriodSummary(
  scenarioId: string,
): Promise<ReservoirPeriodSummaryResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }

  return apiFetcher<ReservoirPeriodSummaryResponse>(
    ENDPOINTS.reservoirPeriodSummary(scenarioId),
    {
      baseUrl: DEFAULT_API_BASE,
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

/**
 * Fetch the 5 CEFF seasonal definitions (static lookup)
 *
 * @returns wet_peak, wet_base, spring_recession, dry, fall_pulse
 */
export async function fetchEnvFlowSeasons(): Promise<EnvFlowSeasonsResponse> {
  return apiFetcher<EnvFlowSeasonsResponse>(ENDPOINTS.ENV_FLOW_SEASONS, {
    baseUrl: DEFAULT_API_BASE,
  })
}

/**
 * Fetch monthly % unimpaired flow statistics for all channels in a scenario (Metric 1)
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param channelId - Optional single channel filter (e.g., "C_SAC049")
 * @returns 59 channels × 12 water months = 708 rows (flat array)
 */
export async function fetchChannelsMonthly(
  scenarioId: string,
  channelId?: string,
): Promise<ChannelsMonthlyResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  return apiFetcher<ChannelsMonthlyResponse>(
    ENDPOINTS.channelsMonthly(scenarioId, channelId),
    { baseUrl: DEFAULT_API_BASE, timeout: 20000 },
  )
}

/**
 * Fetch seasonal flow volumes, % unimpaired, and % functional flow stats (Metrics 1+2)
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param channelId - Optional single channel filter
 * @returns 59 channels × 5 CEFF seasons = 295 rows (flat array)
 *          pct_ff_* columns are NULL for channels without EFLOWS targets
 */
export async function fetchChannelsSeasonal(
  scenarioId: string,
  channelId?: string,
): Promise<ChannelsSeasonalResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  return apiFetcher<ChannelsSeasonalResponse>(
    ENDPOINTS.channelsSeasonal(scenarioId, channelId),
    { baseUrl: DEFAULT_API_BASE, timeout: 20000 },
  )
}

/**
 * Fetch period-of-record Pearson r flow alteration index and full-period aggregates (Metric 3)
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param channelId - Optional single channel filter
 * @returns One row per channel reach (59 rows)
 *          pearson_r ≈ +1: natural timing preserved; ≈ 0: substantially altered
 */
export async function fetchChannelsPeriodSummary(
  scenarioId: string,
  channelId?: string,
): Promise<ChannelsPeriodSummaryResponse> {
  if (!scenarioId) {
    throw new Error("Scenario ID is required")
  }
  return apiFetcher<ChannelsPeriodSummaryResponse>(
    ENDPOINTS.channelsPeriodSummary(scenarioId, channelId),
    { baseUrl: DEFAULT_API_BASE, timeout: 15000 },
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
