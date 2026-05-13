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
   * Tier data for a single outcome within a scenario
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param tierCode - Tier short code (e.g., "ENV_FLOWS", "AG_REV")
   */
  scenarioTierByCode: (scenarioId: string, tierCode: string) =>
    `/tiers/scenarios/${scenarioId}/tiers/${tierCode}`,

  /**
   * Batch tier data for multiple scenarios in one request
   * @param scenarioIds - Array of scenario IDs
   */
  batchScenarioTiers: (scenarioIds: string[]) =>
    `/tiers/batch?scenarios=${scenarioIds.join(",")}`,

  /**
   * Tier location GeoJSON (includes full polygon geometry, heavy).
   * Prefer `tierLocationAssignments` for treemap/table use cases.
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param tierCode - Tier short code (e.g., "AG_REV")
   */
  tierLocations: (scenarioId: string, tierCode: string) =>
    `/tier-map/${scenarioId}/${tierCode}`,

  /**
   * Lightweight tier assignments per location (no geometry).
   * Returns location_id, location_name, tier_level, tier_value, display_order.
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param tierCode - Tier short code (e.g., "CWS_DEL", "AG_REV")
   */
  tierLocationAssignments: (scenarioId: string, tierCode: string) =>
    `/tier-map/${scenarioId}/${tierCode}/locations`,

  /**
   * Batch: lightweight tier assignments per location for multiple outcomes in
   * one request. One SQL query server-side instead of N parallel per-code
   * calls. Additive. the single-outcome route above still works.
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param codes - Tier short codes (e.g., ["CWS_DEL", "AG_REV", "ENV_FLOWS"]).
   *                Order is normalized (sorted+deduped) so cache keys and
   *                URLs do not depend on caller order.
   */
  tierLocationAssignmentsBatch: (scenarioId: string, codes: string[]) => {
    const normalized = Array.from(new Set(codes)).sort().join(",")
    return `/tier-map/${scenarioId}/locations?codes=${normalized}`
  },

  // Statistics endpoints (reservoir percentiles)

  /** List of reservoirs with percentile data (grouped) */
  STATISTICS_RESERVOIRS: "/statistics/reservoirs",

  /** List of all reservoirs with statistics data */
  STATISTICS_RESERVOIRS_ALL: "/statistics/reservoirs/all",

  /** List of scenarios with percentile data */
  STATISTICS_SCENARIOS: "/statistics/scenarios",

  /**
   * Percentile data for a single reservoir
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param reservoirId - Reservoir ID (e.g., "S_SHSTA")
   */
  reservoirPercentiles: (scenarioId: string, reservoirId: string) =>
    `/statistics/scenarios/${scenarioId}/reservoirs/${reservoirId}/percentiles`,

  /**
   * Percentile data for all reservoirs in a scenario
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  allReservoirPercentiles: (scenarioId: string) =>
    `/statistics/scenarios/${scenarioId}/reservoir-percentiles`,

  /**
   * Percentile data for a group of reservoirs in a scenario
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param group - Reservoir group (e.g., "major")
   */
  groupedReservoirPercentiles: (scenarioId: string, group: string) =>
    `/statistics/scenarios/${scenarioId}/reservoir-percentiles?group=${group}`,

  /**
   * Monthly storage data with both percentage and TAF values
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param group - Reservoir group (e.g., "major")
   */
  storageMonthly: (scenarioId: string, group: string) =>
    `/statistics/scenarios/${scenarioId}/storage-monthly?group=${group}`,

  /**
   * Monthly spill statistics for reservoirs
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param group - Reservoir group (e.g., "major")
   */
  spillMonthly: (scenarioId: string, group: string) =>
    `/statistics/scenarios/${scenarioId}/spill-monthly?group=${group}`,

  // CWS Aggregate endpoints (M&I delivery/shortage statistics)

  /** List of CWS aggregate entities */
  CWS_AGGREGATES_LIST: "/statistics/cws-aggregates",

  /**
   * Monthly delivery and shortage statistics for CWS aggregates
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param aggregate - Optional filter by aggregate short_code (e.g., "swp_total")
   */
  cwsAggregatesMonthly: (scenarioId: string, aggregate?: string) =>
    `/statistics/scenarios/${scenarioId}/cws-aggregates/monthly${aggregate ? `?aggregate=${aggregate}` : ""}`,

  /**
   * Period-of-record summary for CWS aggregates
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param aggregate - Optional filter by aggregate short_code
   */
  cwsAggregatesPeriod: (scenarioId: string, aggregate?: string) =>
    `/statistics/scenarios/${scenarioId}/cws-aggregates/period-summary${aggregate ? `?aggregate=${aggregate}` : ""}`,

  // M&I Contractors endpoints (30 SWP water agency contractors)

  /**
   * List of M&I contractors
   * @param group - Optional filter by group (e.g., "swp")
   */
  MI_CONTRACTORS_LIST: "/statistics/mi-contractors",

  /**
   * List of M&I contractors with optional group filter
   * @param group - Optional group filter (e.g., "swp")
   */
  miContractorsList: (group?: string) =>
    `/statistics/mi-contractors${group ? `?group=${group}` : ""}`,

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
   * List of urban demand units organized by group
   * Returns units grouped by "swp", "cvp", etc.
   */
  DEMAND_UNITS_GROUPS: "/statistics/demand-units/groups",

  /**
   * List of urban demand units with optional group filter
   * @param group - Optional group filter (e.g., "swp", "cvp")
   */
  demandUnitsList: (group?: string) =>
    `/statistics/demand-units${group ? `?group=${group}` : ""}`,

  /**
   * Statistics for a single demand unit (includes both monthly and period data)
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param duId - Demand unit ID (e.g., "MWD", "SBA029")
   */
  demandUnitStatistics: (scenarioId: string, duId: string) =>
    `/statistics/scenarios/${scenarioId}/demand-units/${duId}/statistics`,

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

  // AG Aggregate endpoints (Agricultural delivery statistics)

  /**
   * Monthly delivery statistics for AG aggregates
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  agAggregatesMonthly: (scenarioId: string) =>
    `/statistics/scenarios/${scenarioId}/ag-aggregates/monthly`,

  /**
   * Period-of-record summary for AG aggregates
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  agAggregatesPeriod: (scenarioId: string) =>
    `/statistics/scenarios/${scenarioId}/ag-aggregates/period-summary`,

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
   * Monthly shortage statistics for AG demand units
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  agDemandUnitsShortageMonthly: (scenarioId: string) =>
    `/statistics/scenarios/${scenarioId}/ag-demand-units/shortage-monthly`,

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

  // Reservoir period summary endpoint

  /**
   * Period-of-record summary for all reservoirs (storage exceedance + spill stats)
   * @param scenarioId - Scenario ID (e.g., "s0020")
   */
  reservoirPeriodSummary: (scenarioId: string) =>
    `/statistics/scenarios/${scenarioId}/period-summary`,

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

  /** List of all 5 CEFF seasonal definitions (static lookup) */
  ENV_FLOW_SEASONS: "/statistics/env-flow-seasons",

  /**
   * Monthly % unimpaired flow statistics (Metric 1)
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param channelId - Optional single channel filter (e.g., "C_SAC049")
   */
  channelsMonthly: (scenarioId: string, channelId?: string) =>
    `/statistics/scenarios/${scenarioId}/channels/monthly${channelId ? `?channel_id=${channelId}` : ""}`,

  /**
   * Seasonal flow volumes + % unimpaired + % functional flow (Metrics 1+2)
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param channelId - Optional single channel filter
   */
  channelsSeasonal: (scenarioId: string, channelId?: string) =>
    `/statistics/scenarios/${scenarioId}/channels/seasonal${channelId ? `?channel_id=${channelId}` : ""}`,

  /**
   * Period-of-record flow alteration index (Metric 3) + full-period aggregates
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param channelId - Optional single channel filter
   */
  channelsPeriodSummary: (scenarioId: string, channelId?: string) =>
    `/statistics/scenarios/${scenarioId}/channels/period-summary${channelId ? `?channel_id=${channelId}` : ""}`,

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

  // Verification status endpoints

  VERIFICATION_STATUS: "/verification/status",

  verificationScenario: (scenarioId: string) =>
    `/verification/status/${scenarioId}`,
} as const
