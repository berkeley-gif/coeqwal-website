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
  StatisticsScenariosResponse,
  ReservoirPercentiles,
  AllReservoirPercentilesResponse,
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
