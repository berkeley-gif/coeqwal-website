/**
 * Centralized cache key definitions for COEQWAL API
 *
 * Using centralized keys prevents cache key drift across hooks and
 * ensures consistent caching behavior throughout the application.
 *
 * @example
 * ```typescript
 * import { CACHE_KEYS } from "@repo/data/cache"
 *
 * // Static keys
 * useSWR(CACHE_KEYS.TIER_LIST, fetchTierList)
 *
 * // Dynamic keys
 * useSWR(CACHE_KEYS.scenarioTiers(scenarioId), fetchScenarioTiers)
 * ```
 */

/**
 * Static cache keys for data that rarely/never changes
 */
export const CACHE_KEYS = {
  /** Tier list - all available tiers/outcomes */
  TIER_LIST: "/api/tiers/list",

  /** Scenario list - all available scenarios */
  SCENARIOS: "/api/scenarios",

  /**
   * Tier data for a specific scenario
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  scenarioTiers: (scenarioId: string) =>
    `/api/tiers/scenarios/${scenarioId}/tiers`,

  /**
   * Batch key for fetching multiple scenario tiers
   * Uses array format for SWR to track changes in the ID list
   * @param scenarioIds - Array of scenario IDs
   */
  allScenarioTiers: (scenarioIds: string[]) =>
    ["all-scenario-tiers", ...scenarioIds] as const,

  /**
   * Lazy-loaded scenario tiers (subset of all scenarios)
   * @param scenarioIds - Array of loaded scenario IDs
   */
  lazyScenarioTiers: (scenarioIds: string[]) =>
    ["lazy-scenario-tiers", ...scenarioIds] as const,

  /**
   * Tier location data for map visualization
   * @param scenarioId - Scenario ID
   * @param tierCode - Tier code (e.g., "AG_REV")
   */
  tierLocations: (scenarioId: string, tierCode: string) =>
    `/tier-map/${scenarioId}/${tierCode}/locations`,
} as const

/**
 * Type for static cache keys
 */
export type StaticCacheKey =
  | typeof CACHE_KEYS.TIER_LIST
  | typeof CACHE_KEYS.SCENARIOS

/**
 * Type for dynamic cache keys (functions)
 */
export type DynamicCacheKey =
  | ReturnType<typeof CACHE_KEYS.scenarioTiers>
  | ReturnType<typeof CACHE_KEYS.allScenarioTiers>
  | ReturnType<typeof CACHE_KEYS.lazyScenarioTiers>
  | ReturnType<typeof CACHE_KEYS.tierLocations>
