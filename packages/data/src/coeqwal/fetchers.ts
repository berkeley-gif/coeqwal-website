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
 * Fetch tier data for multiple scenarios in parallel
 *
 * Note: This fires parallel requests. For large numbers of scenarios,
 * consider using lazy loading (useScenarioTiersLazy) instead.
 *
 * @param scenarioIds - Array of scenario IDs
 * @returns Map of scenarioId -> ScenarioTiersResponse
 *
 * @example
 * ```typescript
 * const allData = await fetchAllScenarioTiers(["s0020", "s0021", "s0022"])
 * const s0020Data = allData["s0020"]
 * ```
 */
export async function fetchAllScenarioTiers(
  scenarioIds: string[],
): Promise<Record<string, ScenarioTiersResponse>> {
  const results = await Promise.all(
    scenarioIds.map((id) => fetchScenarioTiers(id)),
  )

  const record: Record<string, ScenarioTiersResponse> = {}
  scenarioIds.forEach((id, i) => {
    record[id] = results[i]!
  })

  return record
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
