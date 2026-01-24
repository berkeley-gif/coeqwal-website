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
} as const
