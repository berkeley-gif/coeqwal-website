/**
 * COEQWAL API utilities
 *
 * This module provides everything needed to interact with the COEQWAL API:
 * - Type definitions for API responses
 * - Fetch functions for direct API calls
 * - React hooks with SWR caching
 *
 * ## Usage
 *
 * ```typescript
 * // Types
 * import type { TierListItem, ScenarioTiersResponse } from "@repo/data/coeqwal"
 *
 * // Fetch functions (for server components or non-React code)
 * import { fetchTierList, fetchScenarioTiers } from "@repo/data/coeqwal"
 *
 * // React hooks (for client components)
 * import { useTiers, useTierMapping, useScenarios } from "@repo/data/coeqwal/hooks"
 * ```
 */

// Types
export type {
  TierListItem,
  MultiValueTierData,
  MultiValueTier,
  TierScores,
  TierInfo,
  ScenarioTiersResponse,
  ScenarioListItem,
  TierMapping,
} from "./types"

// API constants
export { DEFAULT_API_BASE, ENDPOINTS } from "./api"

// Fetch functions
export {
  fetchTierList,
  fetchScenarioTiers,
  fetchScenarioList,
  fetchAllScenarioTiers,
} from "./fetchers"

// Re-export hooks for convenience
export * from "./hooks"
