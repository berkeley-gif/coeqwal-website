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

  /** List of reservoirs with percentile data */
  STATISTICS_RESERVOIRS: "/statistics/reservoirs",

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
} as const
