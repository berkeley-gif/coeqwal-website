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
   * Tier location data for map visualization
   * @param scenarioId - Scenario ID (e.g., "s0020")
   * @param tierCode - Tier short code (e.g., "AG_REV")
   */
  tierLocations: (scenarioId: string, tierCode: string) =>
    `/tier-map/${scenarioId}/${tierCode}`,

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
    const params = [
      duId && `du_id=${duId}`,
      group && `group=${group}`,
    ]
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
    const params = [
      duId && `du_id=${duId}`,
      group && `group=${group}`,
    ]
      .filter(Boolean)
      .join("&")
    return `/statistics/scenarios/${scenarioId}/demand-units/period-summary${params ? `?${params}` : ""}`
  },
} as const
