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
   * Tier data for a single outcome within a scenario
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param tierCode - Tier short code (e.g., "ENV_FLOWS")
   */
  scenarioTierByCode: (scenarioId: string, tierCode: string) =>
    `/api/tiers/scenarios/${scenarioId}/tiers/${tierCode}`,

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

  // Statistics cache keys (reservoir percentiles)

  /** List of reservoirs with percentile data (grouped) */
  STATISTICS_RESERVOIRS: "/api/statistics/reservoirs",

  /** List of all reservoirs with statistics data */
  STATISTICS_RESERVOIRS_ALL: "/api/statistics/reservoirs/all",

  /** List of scenarios with percentile data */
  STATISTICS_SCENARIOS: "/api/statistics/scenarios",

  /**
   * Percentile data for a single reservoir in a scenario
   * @param scenarioId - Scenario ID
   * @param reservoirId - Reservoir ID (e.g., "S_SHSTA")
   */
  reservoirPercentiles: (scenarioId: string, reservoirId: string) =>
    `/api/statistics/scenarios/${scenarioId}/reservoirs/${reservoirId}/percentiles`,

  /**
   * Percentile data for all reservoirs in a scenario
   * @param scenarioId - Scenario ID
   */
  allReservoirPercentiles: (scenarioId: string) =>
    `/api/statistics/scenarios/${scenarioId}/reservoir-percentiles`,

  /**
   * Percentile data for a group of reservoirs in a scenario
   * @param scenarioId - Scenario ID
   * @param group - Reservoir group (e.g., "major")
   */
  groupedReservoirPercentiles: (scenarioId: string, group: string) =>
    `/api/statistics/scenarios/${scenarioId}/reservoir-percentiles?group=${group}`,

  /**
   * Monthly storage data with both percentage and TAF values
   * @param scenarioId - Scenario ID
   * @param group - Reservoir group (e.g., "major")
   */
  storageMonthly: (scenarioId: string, group: string) =>
    `/api/statistics/scenarios/${scenarioId}/storage-monthly?group=${group}`,

  /**
   * Monthly spill statistics for reservoirs
   * @param scenarioId - Scenario ID
   * @param group - Reservoir group (e.g., "major")
   */
  spillMonthly: (scenarioId: string, group: string) =>
    `/api/statistics/scenarios/${scenarioId}/spill-monthly?group=${group}`,

  // CWS Aggregate cache keys (M&I delivery/shortage statistics)

  /** List of CWS aggregate entities */
  CWS_AGGREGATES_LIST: "/api/statistics/cws-aggregates",

  /**
   * Monthly delivery and shortage statistics for CWS aggregates
   * @param scenarioId - Scenario ID
   * @param aggregate - Optional aggregate short_code filter
   */
  cwsAggregatesMonthly: (scenarioId: string, aggregate?: string) =>
    `/api/statistics/scenarios/${scenarioId}/cws-aggregates/monthly${aggregate ? `?aggregate=${aggregate}` : ""}`,

  /**
   * Period-of-record summary for CWS aggregates
   * @param scenarioId - Scenario ID
   * @param aggregate - Optional aggregate short_code filter
   */
  cwsAggregatesPeriod: (scenarioId: string, aggregate?: string) =>
    `/api/statistics/scenarios/${scenarioId}/cws-aggregates/period-summary${aggregate ? `?aggregate=${aggregate}` : ""}`,

  // M&I Contractors cache keys (30 SWP water agency contractors)

  /** List of M&I contractors */
  MI_CONTRACTORS_LIST: "/api/statistics/mi-contractors",

  /**
   * List of M&I contractors with optional group filter
   * @param group - Optional group filter (e.g., "swp")
   */
  miContractorsList: (group?: string) =>
    `/api/statistics/mi-contractors${group ? `?group=${group}` : ""}`,

  /**
   * Monthly delivery and shortage statistics for M&I contractors
   * @param scenarioId - Scenario ID
   * @param contractor - Optional contractor short_code filter
   */
  miContractorsMonthly: (scenarioId: string, contractor?: string) =>
    `/api/statistics/scenarios/${scenarioId}/mi-contractors/delivery-monthly${contractor ? `?contractor=${contractor}` : ""}`,

  /**
   * Period-of-record summary for M&I contractors
   * @param scenarioId - Scenario ID
   * @param contractor - Optional contractor short_code filter
   */
  miContractorsPeriod: (scenarioId: string, contractor?: string) =>
    `/api/statistics/scenarios/${scenarioId}/mi-contractors/period-summary${contractor ? `?contractor=${contractor}` : ""}`,

  // Urban Demand Units cache keys (46 demand units)

  /** List of urban demand units */
  DEMAND_UNITS_LIST: "/api/statistics/demand-units",

  /** List of urban demand units organized by group */
  DEMAND_UNITS_GROUPS: "/api/statistics/demand-units/groups",

  /**
   * List of urban demand units with optional group filter
   * @param group - Optional group filter (e.g., "swp", "cvp")
   */
  demandUnitsList: (group?: string) =>
    `/api/statistics/demand-units${group ? `?group=${group}` : ""}`,

  /**
   * Statistics for a single demand unit
   * @param scenarioId - Scenario ID
   * @param duId - Demand unit ID
   */
  demandUnitStatistics: (scenarioId: string, duId: string) =>
    `/api/statistics/scenarios/${scenarioId}/demand-units/${duId}/statistics`,

  /**
   * Monthly delivery and shortage statistics for urban demand units
   * @param scenarioId - Scenario ID
   * @param duId - Optional demand unit ID filter
   * @param group - Optional group filter
   */
  demandUnitsMonthly: (scenarioId: string, duId?: string, group?: string) => {
    const params = [duId && `du_id=${duId}`, group && `group=${group}`]
      .filter(Boolean)
      .join("&")
    return `/api/statistics/scenarios/${scenarioId}/demand-units/delivery-monthly${params ? `?${params}` : ""}`
  },

  /**
   * Period-of-record summary for urban demand units
   * @param scenarioId - Scenario ID
   * @param duId - Optional demand unit ID filter
   * @param group - Optional group filter
   */
  demandUnitsPeriod: (scenarioId: string, duId?: string, group?: string) => {
    const params = [duId && `du_id=${duId}`, group && `group=${group}`]
      .filter(Boolean)
      .join("&")
    return `/api/statistics/scenarios/${scenarioId}/demand-units/period-summary${params ? `?${params}` : ""}`
  },

  // AG Aggregate cache keys (Agricultural delivery statistics)

  /**
   * Monthly delivery statistics for AG aggregates
   * @param scenarioId - Scenario ID
   */
  agAggregatesMonthly: (scenarioId: string) =>
    `/api/statistics/scenarios/${scenarioId}/ag-aggregates/monthly`,

  /**
   * Period-of-record summary for AG aggregates
   * @param scenarioId - Scenario ID
   */
  agAggregatesPeriod: (scenarioId: string) =>
    `/api/statistics/scenarios/${scenarioId}/ag-aggregates/period-summary`,

  // AG Demand Units cache keys (150 agricultural demand units)

  /**
   * Monthly delivery statistics for AG demand units
   * @param scenarioId - Scenario ID
   */
  agDemandUnitsDeliveryMonthly: (scenarioId: string) =>
    `/api/statistics/scenarios/${scenarioId}/ag-demand-units/delivery-monthly`,

  /**
   * Monthly shortage statistics for AG demand units
   * @param scenarioId - Scenario ID
   */
  agDemandUnitsShortageMonthly: (scenarioId: string) =>
    `/api/statistics/scenarios/${scenarioId}/ag-demand-units/shortage-monthly`,

  /**
   * Period-of-record summary for AG demand units
   * @param scenarioId - Scenario ID
   */
  agDemandUnitsPeriod: (scenarioId: string) =>
    `/api/statistics/scenarios/${scenarioId}/ag-demand-units/period-summary`,

  // Wildlife Refuge Demand Units cache keys (18 refuge demand units)

  /** List of wildlife refuge demand units */
  REFUGE_DUS_LIST: "/api/statistics/refuge-demand-units",

  /**
   * Monthly delivery statistics for refuge demand units
   * @param scenarioId - Scenario ID
   * @param duId - Optional demand unit ID filter
   */
  refugeDusDeliveryMonthly: (scenarioId: string, duId?: string) =>
    `/api/statistics/scenarios/${scenarioId}/refuge-demand-units/delivery-monthly${duId ? `?du_id=${duId}` : ""}`,

  /**
   * Monthly shortage statistics for refuge demand units
   * @param scenarioId - Scenario ID
   * @param duId - Optional demand unit ID filter
   */
  refugeDusShortageMonthly: (scenarioId: string, duId?: string) =>
    `/api/statistics/scenarios/${scenarioId}/refuge-demand-units/shortage-monthly${duId ? `?du_id=${duId}` : ""}`,

  /**
   * Period-of-record summary for refuge demand units
   * @param scenarioId - Scenario ID
   * @param duId - Optional demand unit ID filter
   */
  refugeDusPeriod: (scenarioId: string, duId?: string) =>
    `/api/statistics/scenarios/${scenarioId}/refuge-demand-units/period-summary${duId ? `?du_id=${duId}` : ""}`,

  // Reservoir period summary cache key

  /**
   * Period-of-record summary for all reservoirs (storage exceedance + spill stats)
   * @param scenarioId - Scenario ID
   */
  reservoirPeriodSummary: (scenarioId: string) =>
    `/api/statistics/scenarios/${scenarioId}/period-summary`,

  // Batch statistics cache key (for Data Explorer performance)

  /**
   * Batch statistics for multiple scenarios
   * @param scenarios - Array of scenario IDs
   * @param types - Data types to fetch (storage, cws, ag)
   */
  batchStatistics: (
    scenarios: string[],
    types: string[] = ["storage", "cws", "ag"],
  ) => ["batch-statistics", ...scenarios, ...types] as const,
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
