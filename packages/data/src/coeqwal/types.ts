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

// ============================================================================
// Tier Location Types (for map visualization)
// ============================================================================

/**
 * A single feature in the tier location GeoJSON response
 */
export interface TierFeature {
  type: "Feature"
  geometry: {
    type: "Point" | "Polygon" | "MultiPolygon"
    coordinates: number[] | number[][][] | number[][][][]
  }
  properties: {
    /** Location identifier (e.g., demand unit ID) */
    location_id: string
    /** Human-readable location name */
    location_name: string
    /** Type of location (e.g., "demand_unit", "river_reach") */
    location_type: string
    /** Display-friendly location type */
    location_type_display: string
    /** Tier level (1-4, where 1 is best, 4 is worst) */
    tier_level: number
    /** Raw tier value */
    tier_value: number
    /** Order for display purposes */
    display_order: number
    /** CSS class for tier color styling */
    tier_color_class: string
  }
}

/**
 * Response from /api/tier-map/:scenarioId/:tierCode endpoint
 * Returns GeoJSON FeatureCollection of tier locations
 */
export interface TierLocationResponse {
  type: "FeatureCollection"
  features: TierFeature[]
  metadata: {
    /** Scenario ID */
    scenario: string
    /** Tier short code (e.g., "AG_REV") */
    tier_code: string
    /** Tier display name */
    tier_name: string
    /** Whether tier has single or multiple values */
    tier_type: "multi_value" | "single_value"
    /** Number of features in response */
    feature_count: number
    /** Types of locations included */
    location_types: string[]
  }
}

// ============================================================================
// Statistics Types (for reservoir percentile charts)
// ============================================================================

/**
 * Reservoir info from /api/statistics/reservoirs endpoint
 */
export interface ReservoirInfo {
  /** Reservoir ID (e.g., "S_SHSTA") */
  reservoir_id: string
  /** Human-readable name (e.g., "Shasta") */
  reservoir_name: string
}

/**
 * Scenario with percentile data from /api/statistics/scenarios endpoint
 */
export interface StatisticsScenarioInfo {
  /** Scenario ID (e.g., "s0020") */
  scenario_id: string
  /** Array of reservoir IDs with data */
  reservoirs: string[]
  /** Count of reservoirs */
  reservoir_count: number
}

/**
 * Percentile values for a single month
 * All values are percentage of reservoir capacity (0-100+)
 */
export interface PercentileValues {
  /** Minimum (0th percentile) */
  q0: number
  /** 10th percentile */
  q10: number
  /** 30th percentile */
  q30: number
  /** Median (50th percentile) */
  q50: number
  /** 70th percentile */
  q70: number
  /** 90th percentile */
  q90: number
  /** Maximum (100th percentile) */
  q100: number
  /** Mean value */
  mean: number
}

/**
 * Monthly percentile data keyed by water month (1=Oct, 12=Sep)
 */
export type MonthlyPercentiles = Record<string, PercentileValues>

/**
 * Response from /api/statistics/scenarios/:scenarioId/reservoirs/:reservoirId/percentiles
 */
export interface ReservoirPercentiles {
  /** Reservoir ID (e.g., "S_SHSTA") */
  reservoir_id: string
  /** Human-readable name (e.g., "Shasta") */
  reservoir_name: string
  /** Scenario ID */
  scenario_id: string
  /** Unit description */
  unit: string
  /** Total reservoir capacity in thousand acre-feet */
  capacity_taf: number
  /** Dead pool storage in thousand acre-feet */
  dead_pool_taf: number
  /** Monthly percentile data */
  monthly_percentiles: MonthlyPercentiles
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/reservoir-percentiles
 * Returns all reservoirs for a scenario
 */
export interface AllReservoirPercentilesResponse {
  scenario_id: string
  reservoirs: Record<string, Omit<ReservoirPercentiles, "scenario_id">>
}

/**
 * Reservoir data in grouped percentiles response
 * Uses shorter reservoir IDs (e.g., "FOLSM" instead of "S_FOLSM")
 */
export interface GroupedReservoirData {
  /** Human-readable name (e.g., "Folsom") */
  name: string
  /** Total reservoir capacity in thousand acre-feet */
  capacity_taf: number
  /** Dead pool storage in thousand acre-feet */
  dead_pool_taf: number
  /** Monthly percentile data */
  monthly_percentiles: MonthlyPercentiles
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/reservoir-percentiles?group=:group
 * Returns reservoirs for a specific group (e.g., "major")
 */
export interface GroupedReservoirPercentilesResponse {
  scenario_id: string
  /** Reservoir group (e.g., "major") */
  group: string
  /** Reservoir data keyed by short ID (e.g., "FOLSM", "SHSTA") */
  reservoirs: Record<string, GroupedReservoirData>
}

/**
 * Response from /api/statistics/reservoirs endpoint
 */
export interface ReservoirListResponse {
  reservoirs: ReservoirInfo[]
}

/**
 * Reservoir info from /api/statistics/reservoirs/all endpoint
 * Includes capacity information for all available reservoirs
 */
export interface AllReservoirInfo {
  /** Reservoir ID (e.g., "SHSTA") */
  reservoir_id: string
  /** Human-readable name (e.g., "Shasta") */
  name: string
  /** Total reservoir capacity in thousand acre-feet */
  capacity_taf: number
}

/**
 * Response from /api/statistics/reservoirs/all endpoint
 */
export interface AllReservoirsListResponse {
  /** Array of major reservoir IDs */
  major: string[]
  /** Array of all reservoir info */
  all: AllReservoirInfo[]
  /** Total count of reservoirs */
  total: number
}

/**
 * Response from /api/statistics/scenarios endpoint
 */
export interface StatisticsScenariosResponse {
  scenarios: StatisticsScenarioInfo[]
  total: number
}

// ============================================================================
// Storage Monthly Types (for dual-unit percentile charts)
// ============================================================================

/**
 * Reservoir data in storage-monthly response
 * Contains both percentage and TAF values for percentile bands
 */
export interface StorageMonthlyReservoirData {
  /** Human-readable name (e.g., "Shasta") */
  name: string
  /** Total reservoir capacity in thousand acre-feet */
  capacity_taf: number
  /** Monthly percentile data as percentage of capacity (0-100+) */
  monthly_percent: MonthlyPercentiles
  /** Monthly percentile data as volume in TAF */
  monthly_taf: MonthlyPercentiles
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/storage-monthly?group=:group
 * Returns reservoirs with both percentage and TAF percentile data
 */
export interface StorageMonthlyResponse {
  scenario_id: string
  /** Reservoir group (e.g., "major") */
  group: string
  /** Reservoir data keyed by short ID (e.g., "FOLSM", "SHSTA") */
  reservoirs: Record<string, StorageMonthlyReservoirData>
}

// ============================================================================
// Spill Monthly Types (for spill frequency charts)
// ============================================================================

/**
 * Monthly spill statistics for a single month
 */
export interface SpillMonthlyStats {
  /** Number of months with spill events */
  spill_months_count: number
  /** Total months in the record */
  total_months: number
  /** Spill frequency as percentage for this month */
  spill_frequency_pct: number
  /** Average spill in CFS */
  spill_avg_cfs: number
  /** Maximum spill in CFS */
  spill_max_cfs: number
  /** 50th percentile spill */
  spill_q50: number
  /** 90th percentile spill */
  spill_q90: number
  /** 100th percentile (max) spill */
  spill_q100: number
  /** Average storage at time of spill (percentage), null if no spills */
  storage_at_spill_avg_pct: number | null
}

/**
 * Monthly spill data keyed by month (1-12)
 */
export type MonthlySpillData = Record<string, SpillMonthlyStats>

/**
 * Reservoir data in spill-monthly response
 */
export interface SpillMonthlyReservoirData {
  /** Human-readable name (e.g., "Shasta") */
  name: string
  /** Monthly spill statistics keyed by month number */
  monthly: MonthlySpillData
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/spill-monthly?group=:group
 * Returns reservoirs with spill statistics
 */
export interface SpillMonthlyResponse {
  scenario_id: string
  /** Reservoir group (e.g., "major") */
  group: string
  /** Reservoir data keyed by short ID (e.g., "FOLSM", "SHSTA") */
  reservoirs: Record<string, SpillMonthlyReservoirData>
}
