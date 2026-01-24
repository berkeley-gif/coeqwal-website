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
