/**
 * Shared types for COEQWAL API responses
 *
 * These types are the source of truth for API response shapes.
 * Import from "@repo/data/coeqwal" instead of defining locally.
 */

/**
 * A tier/outcome from the /api/tiers/list endpoint
 */
export interface TierListItem {
  /** Short code identifier (e.g., "AG_REV", "ENV_FLOW") */
  short_code: string
  /** Full name from API */
  name: string
  /** Description of what this tier measures */
  description: string
  /** Whether this tier has a single value or distribution across tiers */
  tier_type: "single_value" | "multi_value"
  /** Number of tier levels (typically 4) */
  tier_count: number
  /** Whether this tier is currently active/visible */
  is_active: boolean
}

/**
 * Data point for multi-value tiers (distribution across tier levels)
 */
export interface MultiValueTierData {
  /** Tier level (tier1 = best, tier4 = worst) */
  tier: "tier1" | "tier2" | "tier3" | "tier4"
  /** Raw count or value */
  value: number
  /** Normalized value (0-1) */
  normalized: number
}

/**
 * Multi-value tier structure (used in chart conversion)
 */
export interface MultiValueTier {
  name: string
  type: "multi_value"
  data: MultiValueTierData[]
  total: number
}

/**
 * Calculated score fields returned by the API for each tier
 * These enable sorting, parallel plot visualization, and equity analysis
 */
export interface TierScores {
  /** Weighted average tier score (1.0-4.0, lower = better). Use for sorting. */
  weighted_score: number
  /** Normalized score (0.0-1.0, higher = better). Use for parallel plot Y-axis. */
  normalized_score: number
  /** Gini coefficient (0.0-1.0, lower = more equitable). Use for equity indicator. */
  gini: number
  /** Spread band top edge (0.0-1.0). Where best locations are. */
  band_upper: number
  /** Spread band bottom edge (0.0-1.0). Where worst locations are. */
  band_lower: number
}

/**
 * Full tier information from scenario endpoint
 */
export interface TierInfo extends TierScores {
  name: string
  type: "single_value" | "multi_value"
  /** Tier level for single_value tiers (1-4) */
  level?: number
  /** Distribution data for multi_value tiers */
  data?: MultiValueTierData[]
  /** Total count for multi_value tiers */
  total?: number
}

/**
 * Response from /api/tiers/scenarios/:scenarioId/tiers
 */
export interface ScenarioTiersResponse {
  /** Scenario identifier */
  scenario: string
  /** Tier data keyed by short_code */
  tiers: Record<string, TierInfo>
}

/**
 * Scenario metadata from /api/scenarios endpoint
 */
export interface ScenarioListItem {
  /** Unique scenario identifier (e.g., "s0020") */
  scenario_id: string
  /** Short code for display */
  short_code: string
  /** Full scenario name */
  name: string
  /** Brief title for UI */
  short_title: string
  /** Detailed description */
  description: string
  /** Whether this scenario is active/visible */
  is_active: boolean
}

/**
 * Mapping from tier short_code to display name
 */
export type TierMapping = Record<string, string>
