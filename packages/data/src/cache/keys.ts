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
   * SWR cache key for per-location tier assignments (no geometry).
   *
   * Pure cache identifier, not a URL. The underlying fetcher hits the
   * batch endpoint with a single code and splays the result into this
   * slot via `mutate`, so `useTierLocationAssignments` and the batch
   * hook share one cache entry per scenario+code.
   * @param scenarioId - Scenario ID
   * @param tierCode - Tier code (e.g., "AG_REV")
   */
  tierLocations: (scenarioId: string, tierCode: string) =>
    ["tier-locations", scenarioId, tierCode] as const,

  /**
   * Batch key for fetching tier locations across multiple outcomes in one
   * request. Uses array format so SWR tracks changes in the code list, and
   * codes are sorted+deduplicated so caller ordering does not fragment the
   * cache across hooks that happen to pass the same codes in different orders.
   * @param scenarioId - Scenario ID
   * @param codes - Tier codes (e.g., ["CWS_DEL", "AG_REV", "ENV_FLOWS"])
   */
  tierLocationsBatch: (scenarioId: string, codes: string[]) =>
    [
      "tier-locations-batch",
      scenarioId,
      ...Array.from(new Set(codes)).sort(),
    ] as const,

  // Statistics cache keys (reservoir percentiles)

  /** List of all reservoirs with statistics data */
  STATISTICS_RESERVOIRS_ALL: "/api/statistics/reservoirs/all",

  /**
   * Percentile data for all reservoirs in a scenario
   * @param scenarioId - Scenario ID
   */
  allReservoirPercentiles: (scenarioId: string) =>
    `/api/statistics/scenarios/${scenarioId}/reservoir-percentiles`,

  /**
   * Percentile data filtered to a specific set of reservoirs in a scenario.
   * `reservoirIds` are sorted+deduped before encoding so different call
   * orders share the same SWR cache entry
   * @param scenarioId - Scenario ID
   * @param reservoirIds - Reservoir short_codes (e.g., ["SHSTA"], ["SHSTA", "OROVL"])
   */
  reservoirPercentilesFiltered: (
    scenarioId: string,
    reservoirIds: string[],
  ) => {
    const normalized = Array.from(new Set(reservoirIds)).sort().join(",")
    return `/api/statistics/scenarios/${scenarioId}/reservoir-percentiles?reservoirs=${normalized}`
  },

  /**
   * Percentile data for a group of reservoirs in a scenario
   * @param scenarioId - Scenario ID
   * @param group - Reservoir group (e.g., "major")
   */
  groupedReservoirPercentiles: (scenarioId: string, group: string) =>
    `/api/statistics/scenarios/${scenarioId}/reservoir-percentiles?group=${group}`,

  /**
   * Monthly spill statistics for reservoirs
   * @param scenarioId - Scenario ID
   * @param group - Reservoir group (e.g., "major")
   */
  spillMonthly: (scenarioId: string, group: string) =>
    `/api/statistics/scenarios/${scenarioId}/spill-monthly?group=${group}`,

  // M&I Contractors cache keys (30 SWP water agency contractors)

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

  /**
   * List of urban demand units with optional group filter
   * @param group - Optional group filter (e.g., "swp", "cvp")
   */
  demandUnitsList: (group?: string) =>
    `/api/statistics/demand-units${group ? `?group=${group}` : ""}`,

  /**
   * Monthly delivery statistics for urban demand units
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
   * Monthly shortage statistics for urban demand units
   * @param scenarioId - Scenario ID
   * @param duId - Optional demand unit ID filter
   * @param group - Optional group filter
   */
  demandUnitsShortageMonthly: (
    scenarioId: string,
    duId?: string,
    group?: string,
  ) => {
    const params = [duId && `du_id=${duId}`, group && `group=${group}`]
      .filter(Boolean)
      .join("&")
    return `/api/statistics/scenarios/${scenarioId}/demand-units/shortage-monthly${params ? `?${params}` : ""}`
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

  // AG Demand Units cache keys (150 agricultural demand units)

  /**
   * List of AG demand-unit entities with optional filters
   * @param filters - Optional region / cs3_type / provider filters
   */
  agDemandUnitsList: (filters?: {
    region?: string
    cs3_type?: string
    provider?: string
  }) => {
    const params = [
      filters?.region && `region=${filters.region}`,
      filters?.cs3_type != null && `cs3_type=${filters.cs3_type}`,
      filters?.provider && `provider=${filters.provider}`,
    ]
      .filter(Boolean)
      .join("&")
    return `/api/statistics/ag-demand-units${params ? `?${params}` : ""}`
  },

  /**
   * Monthly surface-water delivery statistics for AG demand units.
   * Matches the backend's `sw-delivery-monthly` route.
   * `duIds` are sorted before being encoded so different call orders
   * share the same SWR cache entry
   * @param scenarioId - Scenario ID
   * @param duIds - Optional list of demand unit IDs that scope the response
   */
  agDemandUnitsDeliveryMonthly: (scenarioId: string, duIds?: string[]) => {
    const qs = duIds?.length ? `?du_id=${[...duIds].sort().join(",")}` : ""
    return `/api/statistics/scenarios/${scenarioId}/ag-demand-units/sw-delivery-monthly${qs}`
  },

  /**
   * Monthly GW restriction shortage statistics for AG demand units.
   * SJR / TULARE DUs only. `duIds` are sorted before being encoded so
   * different call orders share the same SWR cache entry
   * @param scenarioId - Scenario ID
   * @param duIds - Optional list of demand unit IDs that scope the response
   */
  agDemandUnitsShortageMonthly: (scenarioId: string, duIds?: string[]) => {
    const qs = duIds?.length ? `?du_id=${[...duIds].sort().join(",")}` : ""
    return `/api/statistics/scenarios/${scenarioId}/ag-demand-units/shortage-monthly${qs}`
  },

  /**
   * Period-of-record summary for AG demand units.
   * `duIds` are sorted before encoding for stable cache keys
   * @param scenarioId - Scenario ID
   * @param duIds - Optional list of demand unit IDs that scope the response
   */
  agDemandUnitsPeriod: (scenarioId: string, duIds?: string[]) => {
    const qs = duIds?.length ? `?du_id=${[...duIds].sort().join(",")}` : ""
    return `/api/statistics/scenarios/${scenarioId}/ag-demand-units/period-summary${qs}`
  },

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

  // Environmental River Flows cache keys (59 CalSim channel reaches)

  /** List of all 59 channel reaches with watershed attributes (static) */
  CHANNELS_LIST: "/api/statistics/channels",

  // Delta statistics cache keys (X2, salinity, outflow)

  /**
   * Monthly Delta statistics (X2, salinity, outflow)
   * @param scenarioId - Scenario ID
   * @param category - Optional: 'x2', 'salinity_compliance', 'salinity_pumps', 'outflow'
   */
  deltaMonthly: (scenarioId: string, category?: string) =>
    `/api/statistics/scenarios/${scenarioId}/delta/monthly${category ? `?category=${category}` : ""}`,

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
  | ReturnType<typeof CACHE_KEYS.tierLocationsBatch>
