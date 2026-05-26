/**
 * COEQWAL API endpoint constants
 *
 * Centralized endpoint definitions for the COEQWAL API.
 */

/**
 * Default COEQWAL API base URL
 * Can be overridden via DataProvider's apiBaseUrl prop
 */
export const DEFAULT_API_BASE = "https://api.coeqwal.org/api"

/**
 * API endpoint paths (relative to base URL)
 */
export const ENDPOINTS = {
  /** List of all tiers/outcomes */
  TIER_LIST: "/tiers/list",

  /** List of all scenarios */
  SCENARIOS: "/scenarios",

  /**
   * Tier data for a specific scenario
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  scenarioTiers: (scenarioId: string) => `/tiers/scenarios/${scenarioId}/tiers`,

  /**
   * Batch tier data for multiple scenarios in one request
   * @param scenarioIds - Array of scenario IDs
   */
  batchScenarioTiers: (scenarioIds: string[]) =>
    `/tiers/batch?scenarios=${scenarioIds.join(",")}`,

  /**
   * Lightweight tier assignments per location (no geometry) for one or more
   * outcomes in a single request. One SQL query server-side regardless of
   * how many codes are requested.
   *
   * Returns `{ results: { [code]: { locations, metadata, ... } }, missing }`.
   * Order is normalized (sorted+deduped) so cache keys and URLs do not
   * depend on caller order
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param codes - Tier short codes (e.g., ["CWS_DEL", "AG_REV", "ENV_FLOWS"])
   */
  tierLocationAssignmentsBatch: (scenarioId: string, codes: string[]) => {
    const normalized = Array.from(new Set(codes)).sort().join(",")
    return `/tiers/scenarios/${scenarioId}/locations?codes=${normalized}`
  },

  // Statistics endpoints (reservoir percentiles)

  /** List of all reservoirs with statistics data */
  STATISTICS_RESERVOIRS_ALL: "/statistics/reservoirs/all",

  /**
   * Percentile data for all reservoirs in a scenario
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  allReservoirPercentiles: (scenarioId: string) =>
    `/statistics/scenarios/${scenarioId}/reservoir-percentiles`,

  /**
   * Percentile data filtered to a specific set of reservoirs in a scenario.
   * Order is normalized (sorted+deduped) so cache keys and URLs do not depend
   * on caller order
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param reservoirIds - Reservoir short_codes (e.g., ["SHSTA"], ["SHSTA", "OROVL"])
   */
  reservoirPercentilesFiltered: (
    scenarioId: string,
    reservoirIds: string[],
  ) => {
    const normalized = Array.from(new Set(reservoirIds)).sort().join(",")
    return `/statistics/scenarios/${scenarioId}/reservoir-percentiles?reservoirs=${normalized}`
  },

  /**
   * Percentile data for a group of reservoirs in a scenario
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param group - Reservoir group (e.g., "major")
   */
  groupedReservoirPercentiles: (scenarioId: string, group: string) =>
    `/statistics/scenarios/${scenarioId}/reservoir-percentiles?group=${group}`,

  /**
   * Monthly spill statistics for reservoirs
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param group - Reservoir group (e.g., "major")
   */
  spillMonthly: (scenarioId: string, group: string) =>
    `/statistics/scenarios/${scenarioId}/spill-monthly?group=${group}`,

  // M&I Contractors endpoints (30 SWP water agency contractors)

  /**
   * Monthly delivery statistics for M&I contractors
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param contractor - Optional filter by contractor short_code
   */
  miContractorsMonthly: (scenarioId: string, contractor?: string) =>
    `/statistics/scenarios/${scenarioId}/mi-contractors/delivery-monthly${contractor ? `?contractor=${contractor}` : ""}`,

  /**
   * Period-of-record summary for M&I contractors
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param contractor - Optional filter by contractor short_code
   */
  miContractorsPeriod: (scenarioId: string, contractor?: string) =>
    `/statistics/scenarios/${scenarioId}/mi-contractors/period-summary${contractor ? `?contractor=${contractor}` : ""}`,

  // Urban Demand Units endpoints (46 demand units)

  /**
   * List of urban demand units
   */
  DEMAND_UNITS_LIST: "/statistics/demand-units",

  /**
   * List of urban demand units with optional group filter
   * @param group - Optional group filter (e.g., "swp", "cvp")
   */
  demandUnitsList: (group?: string) =>
    `/statistics/demand-units${group ? `?group=${group}` : ""}`,

  /**
   * Monthly delivery statistics for urban demand units
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param duId - Optional filter by demand unit ID (e.g., "UD_ACWD")
   * @param group - Optional group filter (e.g., "swp")
   */
  demandUnitsMonthly: (scenarioId: string, duId?: string, group?: string) => {
    const params = [duId && `du_id=${duId}`, group && `group=${group}`]
      .filter(Boolean)
      .join("&")
    return `/statistics/scenarios/${scenarioId}/demand-units/delivery-monthly${params ? `?${params}` : ""}`
  },

  /**
   * Monthly shortage statistics for urban demand units
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param duId - Optional filter by demand unit ID
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
    return `/statistics/scenarios/${scenarioId}/demand-units/shortage-monthly${params ? `?${params}` : ""}`
  },

  /**
   * Period-of-record summary for urban demand units
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param duId - Optional filter by demand unit ID
   * @param group - Optional group filter
   */
  demandUnitsPeriod: (scenarioId: string, duId?: string, group?: string) => {
    const params = [duId && `du_id=${duId}`, group && `group=${group}`]
      .filter(Boolean)
      .join("&")
    return `/statistics/scenarios/${scenarioId}/demand-units/period-summary${params ? `?${params}` : ""}`
  },

  // AG Demand Units endpoints (150 agricultural demand units)

  /**
   * List of AG demand-unit entities with optional filters.
   * Powers the "Add a demand unit" dropdown in the AG section.
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
    return `/statistics/ag-demand-units${params ? `?${params}` : ""}`
  },

  /**
   * Monthly surface-water delivery statistics for AG demand units.
   * Backend route is `sw-delivery-monthly`. The frontend remaps the
   * response's `monthly_sw_delivery` field to `monthly_delivery` so the
   * matrix code can reuse the same shape as CWS aggregates.
   *
   * Pass `duIds` to restrict the response to specific demand units via
   * the backend's comma-separated `du_id` filter. The list is sorted so
   * different call orders produce the same URL (and same SWR cache key)
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param duIds - Optional list of demand unit IDs to fetch
   */
  agDemandUnitsDeliveryMonthly: (scenarioId: string, duIds?: string[]) => {
    const qs = duIds?.length ? `?du_id=${[...duIds].sort().join(",")}` : ""
    return `/statistics/scenarios/${scenarioId}/ag-demand-units/sw-delivery-monthly${qs}`
  },

  /**
   * Monthly GW restriction shortage statistics for AG demand units.
   * Source: `GW_SHORT_*` variables. Available only for SJR / TULARE DUs.
   *
   * Pass `duIds` to restrict the response to specific demand units via the
   * backend's comma-separated `du_id` filter. The list is sorted so different
   * call orders produce the same URL (and same SWR cache key)
   * @param scenarioId - Scenario ID (e.g., "s0025")
   * @param duIds - Optional list of demand unit IDs to fetch
   */
  agDemandUnitsShortageMonthly: (scenarioId: string, duIds?: string[]) => {
    const qs = duIds?.length ? `?du_id=${[...duIds].sort().join(",")}` : ""
    return `/statistics/scenarios/${scenarioId}/ag-demand-units/shortage-monthly${qs}`
  },

  /**
   * Period-of-record summary for AG demand units.
   * Pass `duIds` to restrict the response to specific demand units via
   * the backend's comma-separated `du_id` filter. The list is sorted
   * so different call orders share a cache entry
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param duIds - Optional list of demand unit IDs to fetch
   */
  agDemandUnitsPeriod: (scenarioId: string, duIds?: string[]) => {
    const qs = duIds?.length ? `?du_id=${[...duIds].sort().join(",")}` : ""
    return `/statistics/scenarios/${scenarioId}/ag-demand-units/period-summary${qs}`
  },

  // Wildlife Refuge demand unit endpoints

  /** List of wildlife refuge demand units */
  refugeDemandUnitsList: () => `/statistics/refuge-demand-units`,

  /**
   * Monthly delivery statistics for refuge demand units
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  refugeDusDeliveryMonthly: (scenarioId: string) =>
    `/statistics/scenarios/${scenarioId}/refuge-demand-units/delivery-monthly`,

  /**
   * Monthly shortage statistics for refuge demand units
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  refugeDusShortageMonthly: (scenarioId: string) =>
    `/statistics/scenarios/${scenarioId}/refuge-demand-units/shortage-monthly`,

  /**
   * Period-of-record summary for refuge demand units
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  refugeDusPeriod: (scenarioId: string) =>
    `/statistics/scenarios/${scenarioId}/refuge-demand-units/period-summary`,

  // Environmental River Flows endpoints (59 CalSim channel reaches)

  /** List of all 59 env-flow channel reaches with watershed attributes */
  CHANNELS_LIST: "/statistics/channels",

  /**
   * Filtered list of channel reaches
   * @param channelClass - 'stream', 'canal', or 'reservoir_release'
   */
  channelsList: (channelClass?: string, watershed?: string) => {
    const params = [
      channelClass && `channel_class=${channelClass}`,
      watershed && `watershed=${watershed}`,
    ]
      .filter(Boolean)
      .join("&")
    return `/statistics/channels${params ? `?${params}` : ""}`
  },

  // Delta statistics endpoints (X2, salinity, outflow)

  /**
   * Monthly Delta statistics (X2, salinity, outflow)
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param category - Optional: 'x2', 'salinity_compliance', 'salinity_pumps', 'outflow'
   */
  deltaMonthly: (scenarioId: string, category?: string) =>
    `/statistics/scenarios/${scenarioId}/delta/monthly${category ? `?category=${category}` : ""}`,

  // Batch statistics endpoint (for Data Explorer performance)

  /**
   * Batch fetch statistics for multiple scenarios
   * @param scenarios - Comma-separated scenario IDs (e.g., "s0020,s0021,s0022")
   * @param types - Comma-separated data types (e.g., "storage,cws,ag")
   */
  batchStatistics: (
    scenarios: string[],
    types: string[] = ["storage", "cws", "ag"],
  ) =>
    `/statistics/batch?scenarios=${scenarios.join(",")}&types=${types.join(",")}`,
} as const
