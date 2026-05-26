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
  /** Description of what this tier measures. Null when no description was seeded. */
  description: string | null
  /** Whether this tier has a single value or distribution across tiers */
  tier_type: "single_value" | "multi_value"
  /** Number of tier levels (typically 4) */
  tier_count: number
  /** Whether this tier is currently active/visible */
  is_active: boolean
}

/**
 * Data point for multi-value tiers (distribution across tier levels).
 *
 * `value` and `normalized` are nullable because the backend emits the raw
 * row values as `safe_int` / `safe_float`. A NULL in the underlying tier
 * result table flows through as `null` rather than being coerced to 0.
 */
export interface MultiValueTierData {
  /** Tier level (tier1 = best, tier4 = worst) */
  tier: "tier1" | "tier2" | "tier3" | "tier4"
  /** Raw count or value, or null if missing */
  value: number | null
  /** Normalized value (0-1), or null if missing */
  normalized: number | null
}

/**
 * Multi-value tier structure (used in chart conversion).
 *
 * `total` is nullable because the backend now passes through NULL totals
 * directly instead of coercing them to 0.
 */
export interface MultiValueTier {
  name: string
  type: "multi_value"
  data: MultiValueTierData[]
  total: number | null
}

/**
 * Calculated score fields returned by the API for each tier.
 *
 * Every field is nullable. The backend returns `null` for the entire score
 * bundle when a tier row is missing or its tier distribution is degenerate
 * (e.g. all four normalized values are zero or NULL). Consumers must treat
 * `null` as "no data" rather than zero.
 */
export interface TierScores {
  /** Weighted average tier score (1.0-4.0, lower = better). Use for sorting. */
  weighted_score: number | null
  /** Normalized score (0.0-1.0, higher = better). Use for parallel plot Y-axis. */
  normalized_score: number | null
  /** Gini coefficient (0.0-1.0, lower = more equitable). Use for equity indicator. */
  gini: number | null
  /** Spread band top edge (0.0-1.0). Where best locations are. */
  band_upper: number | null
  /** Spread band bottom edge (0.0-1.0). Where worst locations are. */
  band_lower: number | null
}

/**
 * Full tier information from scenario endpoint
 */
export interface TierInfo extends TierScores {
  name: string
  type: "single_value" | "multi_value"
  /** Tier level for single_value tiers (1-4), or null if no row exists */
  level?: number | null
  /** Distribution data for multi_value tiers */
  data?: MultiValueTierData[]
  /** Total count for multi_value tiers */
  total?: number | null
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
  short_code: string
  /** Technical run name (e.g., "s0020_DCRadjBL_2020LU_wTUCP") */
  run_name: string
  /** Full scenario name */
  name: string
  /** Short summary description (1-2 sentences) */
  short_description: string | null
  /** Whether this scenario is active/visible */
  is_active: boolean
  /** Hydroclimate variant numeric id (internal). Prefer hydroclimate_short_code. */
  hydroclimate_id: number
  /**
   * Hydroclimate short code, e.g. "historical", "cc50", "cc95".
   * Prefer this over `hydroclimate_id` when resolving sibling groups to
   * concrete scenario runs; it removes the need for a hardcoded numeric map
   * on the client. Present on recent API deployments; may be null/absent on
   * older deployments, in which case fall back to `hydroclimate_id`.
   */
  hydroclimate_short_code?: string | null
  /** Short code of the baseline scenario this derives from, or null for baselines */
  baseline_scenario: string | null
  /** Sibling group ID.same scenario under different hydroclimates share this value */
  sibling_group: string
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
// Tier Location Assignment Types (lightweight, no geometry)
// ============================================================================

export interface TierLocationAssignment {
  location_id: string
  location_name: string
  location_type: string
  tier_level: number
  tier_value: number | null
  display_order: number
}

export interface TierLocationAssignmentsResponse {
  locations: TierLocationAssignment[]
  tier_code: string
  metadata: {
    total_locations: number
    tier_counts: Record<string, number>
  }
}

/**
 * Response from the batch tier-location-assignments endpoint.
 *
 * `results` is keyed by the tier short code (e.g. `"CWS_DEL"`) and each entry
 * matches the per-code shape returned by `fetchTierLocationAssignments`. Codes
 * that were requested but have no active rows for this scenario land in
 * `missing` (this is a normal case, e.g. `WRC_SALMON_AB` on `s0065`).
 */
export interface TierLocationAssignmentsBatchResponse {
  scenario: string
  results: Record<string, TierLocationAssignmentsResponse>
  missing: string[]
}

// ============================================================================
// Statistics Types (for reservoir percentile charts)
// ============================================================================

/**
 * Percentile values for a single month.
 *
 * Fields are non-null because the reservoir ETL emits all percentiles
 * together when a row exists, or omits the month entirely when it does
 * not. Consumers should treat a missing month key in `MonthlyPercentiles`
 * as "no data" and skip it; do not assume any month has fewer than 8
 * populated fields.
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
  /** Total reservoir capacity in thousand acre-feet, or null when missing */
  capacity_taf: number | null
  /** Dead pool storage in thousand acre-feet, or null when missing */
  dead_pool_taf: number | null
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
  /** Total reservoir capacity in thousand acre-feet, or null when missing */
  capacity_taf: number | null
  /** Dead pool storage in thousand acre-feet, or null when missing */
  dead_pool_taf: number | null
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
 * Reservoir info from /api/statistics/reservoirs/all endpoint
 * Includes capacity information for all available reservoirs
 */
export interface AllReservoirInfo {
  /** Reservoir ID (e.g., "SHSTA") */
  reservoir_id: string
  /** Human-readable name (e.g., "Shasta") */
  name: string
  /** Total reservoir capacity in thousand acre-feet, or null when missing */
  capacity_taf: number | null
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

// ============================================================================
// Spill Monthly Types (for spill frequency charts)
// ============================================================================

/**
 * Monthly spill statistics for a single month.
 *
 * All numeric fields are nullable. The reservoir ETL does not populate
 * `spill_avg_cfs` / `spill_max_cfs` / `spill_q*` for most reservoirs at the
 * moment, so they ride through as null. `spill_frequency_pct` and the
 * months counts may also be null when there is no data for that water month.
 */
export interface SpillMonthlyStats {
  /** Number of months with spill events */
  spill_months_count: number | null
  /** Total months in the record */
  total_months: number | null
  /** Spill frequency as percentage for this month */
  spill_frequency_pct: number | null
  /** Average spill in CFS */
  spill_avg_cfs: number | null
  /** Maximum spill in CFS */
  spill_max_cfs: number | null
  /** 50th percentile spill */
  spill_q50: number | null
  /** 90th percentile spill */
  spill_q90: number | null
  /** 100th percentile (max) spill */
  spill_q100: number | null
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

// ============================================================================
// CWS Aggregate Types (for M&I delivery/shortage statistics, served via batch endpoint)
// ============================================================================

/**
 * Monthly delivery statistics for a single month
 * Used for CWS aggregates, M&I contractors, and demand units
 */
export interface CwsDeliveryMonthlyStats {
  /** Average delivery in thousand acre-feet */
  avg_taf: number
  /** Coefficient of variation */
  cv: number
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
  /** Value exceeded 5% of time (wet conditions) */
  exc_p5?: number
  /** Value exceeded 10% of time */
  exc_p10?: number
  /** Value exceeded 25% of time */
  exc_p25?: number
  /** Value exceeded 50% of time (median) */
  exc_p50?: number
  /** Value exceeded 75% of time */
  exc_p75?: number
  /** Value exceeded 90% of time */
  exc_p90?: number
  /** Value exceeded 95% of time (dry conditions) */
  exc_p95?: number
}

/**
 * Monthly shortage statistics for a single month
 * Extends delivery stats with shortage frequency
 */
export interface CwsShortageMonthlyStats extends CwsDeliveryMonthlyStats {
  /** Percentage of months/years with shortage > 0 */
  frequency_pct: number
}

/**
 * CWS aggregate data with monthly delivery and shortage statistics
 */
export interface CwsAggregateData {
  /** Display label (e.g., "SWP Total M&I") */
  label: string
  /** Monthly delivery statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_delivery: Record<string, CwsDeliveryMonthlyStats>
  /** Monthly shortage statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_shortage: Record<string, CwsShortageMonthlyStats>
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/cws-aggregates/monthly
 */
export interface CwsAggregateMonthlyResponse {
  scenario_id: string
  /** Aggregate data keyed by short_code (e.g., "swp_total", "cvp_nod") */
  aggregates: Record<string, CwsAggregateData>
}

/**
 * Period-of-record summary for a CWS aggregate
 */
export interface CwsAggregatePeriodSummary {
  /** Display label */
  label: string
  /** First year of simulation */
  simulation_start_year: number
  /** Last year of simulation */
  simulation_end_year: number
  /** Total years in record */
  total_years: number
  /** Annual average delivery in TAF */
  annual_delivery_avg_taf: number
  /** Coefficient of variation for annual delivery */
  annual_delivery_cv: number
  /** Minimum annual delivery in TAF */
  annual_delivery_min_taf: number
  /** Maximum annual delivery in TAF */
  annual_delivery_max_taf: number
  /** Delivery exceedance values (p5, p10, p25, p50, p75, p90, p95) */
  delivery_exceedance: Record<string, number>
  /** Annual average shortage in TAF */
  annual_shortage_avg_taf: number
  /** Number of years with shortage > 0 */
  shortage_years_count: number
  /** Percentage of years with shortage > 0 */
  shortage_frequency_pct: number
  /** Shortage exceedance values (p5, p10, p25, p50, p75, p90, p95) */
  shortage_exceedance: Record<string, number>
  /** Percentage of months meeting full demand (shortage = 0) */
  reliability_pct: number
  /** Average (delivery / demand) × 100 across all months */
  avg_pct_allocation_met: number
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/cws-aggregates/period-summary
 */
export interface CwsAggregatePeriodResponse {
  scenario_id: string
  /** Period summary data keyed by short_code */
  aggregates: Record<string, CwsAggregatePeriodSummary>
}

// ============================================================================
// M&I Contractors Types (30 SWP water agency contractors)
// ============================================================================

/**
 * M&I contractor data with monthly delivery and shortage statistics
 * Same structure as CwsAggregateData
 */
export interface MiContractorData {
  /** Display label */
  label: string
  /** Monthly delivery statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_delivery: Record<string, CwsDeliveryMonthlyStats>
  /** Monthly shortage statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_shortage: Record<string, CwsShortageMonthlyStats>
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/mi-contractors/delivery-monthly
 */
export interface MiContractorMonthlyResponse {
  scenario_id: string
  /** Contractor data keyed by short_code */
  contractors: Record<string, MiContractorData>
}

/**
 * Period summary for an M&I contractor
 * Same structure as CwsAggregatePeriodSummary
 */
export interface MiContractorPeriodSummary {
  /** Display label */
  label: string
  /** First year of simulation */
  simulation_start_year: number
  /** Last year of simulation */
  simulation_end_year: number
  /** Total years in record */
  total_years: number
  /** Annual average delivery in TAF */
  annual_delivery_avg_taf: number
  /** Coefficient of variation for annual delivery */
  annual_delivery_cv: number
  /** Minimum annual delivery in TAF */
  annual_delivery_min_taf: number
  /** Maximum annual delivery in TAF */
  annual_delivery_max_taf: number
  /** Delivery exceedance values (p5, p10, p25, p50, p75, p90, p95) */
  delivery_exceedance: Record<string, number>
  /** Annual average shortage in TAF */
  annual_shortage_avg_taf: number
  /** Number of years with shortage > 0 */
  shortage_years_count: number
  /** Percentage of years with shortage > 0 */
  shortage_frequency_pct: number
  /** Shortage exceedance values (p5, p10, p25, p50, p75, p90, p95) */
  shortage_exceedance: Record<string, number>
  /** Percentage of months meeting full demand (shortage = 0) */
  reliability_pct: number
  /** Average (delivery / demand) × 100 across all months */
  avg_pct_allocation_met: number
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/mi-contractors/period-summary
 */
export interface MiContractorPeriodResponse {
  scenario_id: string
  /** Period summary data keyed by short_code */
  contractors: Record<string, MiContractorPeriodSummary>
}

// ============================================================================
// Urban Demand Units Types (46 demand units)
// ============================================================================

/**
 * Urban demand unit entity from /api/statistics/demand-units endpoint
 */
export interface DemandUnit {
  /** Demand unit ID (e.g., "UD_ACWD", "UD_MWD") */
  du_id: string
  /** Display label (e.g., "Alameda County Water District", "Metropolitan Water District") */
  label: string
  /** Group identifier (e.g., "swp", "cvp") */
  group?: string
}

/**
 * Response from /api/statistics/demand-units endpoint
 */
export interface DemandUnitsListResponse {
  demand_units: DemandUnit[]
}

/**
 * Urban demand unit data with monthly delivery and shortage statistics
 */
export interface DemandUnitData {
  /** Display label */
  label: string
  /** Monthly delivery statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_delivery: Record<string, CwsDeliveryMonthlyStats>
  /** Monthly shortage statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_shortage: Record<string, CwsShortageMonthlyStats>
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/demand-units/delivery-monthly
 */
export interface DemandUnitMonthlyResponse {
  scenario_id: string
  /** Demand unit data keyed by du_id */
  demand_units: Record<string, DemandUnitData>
}

/**
 * Period summary for an urban demand unit
 */
export interface DemandUnitPeriodSummary {
  /** Display label */
  label: string
  /** First year of simulation */
  simulation_start_year: number
  /** Last year of simulation */
  simulation_end_year: number
  /** Total years in record */
  total_years: number
  /** Annual average delivery in TAF */
  annual_delivery_avg_taf: number
  /** Coefficient of variation for annual delivery */
  annual_delivery_cv: number
  /** Minimum annual delivery in TAF */
  annual_delivery_min_taf: number
  /** Maximum annual delivery in TAF */
  annual_delivery_max_taf: number
  /** Delivery exceedance values (p5, p10, p25, p50, p75, p90, p95) */
  delivery_exceedance: Record<string, number>
  /** Annual average shortage in TAF */
  annual_shortage_avg_taf: number
  /** Number of years with shortage > 0 */
  shortage_years_count: number
  /** Percentage of years with shortage > 0 */
  shortage_frequency_pct: number
  /** Shortage exceedance values (p5, p10, p25, p50, p75, p90, p95) */
  shortage_exceedance: Record<string, number>
  /** Percentage of months meeting full demand (shortage = 0) */
  reliability_pct: number
  /** Average (delivery / demand) × 100 across all months */
  avg_pct_allocation_met: number
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/demand-units/period-summary
 */
export interface DemandUnitPeriodResponse {
  scenario_id: string
  /** Period summary data keyed by du_id */
  demand_units: Record<string, DemandUnitPeriodSummary>
}

/**
 * Monthly delivery statistics for a demand unit
 */
export interface DemandUnitMonthlyStats {
  avg_taf: number
  cv: number
  q0: number
  q10: number
  q30: number
  q50: number
  q70: number
  q90: number
  q100: number
  sample_count: number
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/demand-units/:duId/statistics
 * Returns complete statistics for a single demand unit
 */
export interface DemandUnitStatisticsResponse {
  scenario_id: string
  du_id: string
  community_agency: string
  hydrologic_region: string
  /** Period summary with annual averages and exceedance values */
  period_summary: DemandUnitPeriodSummary
  /** Monthly delivery statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_delivery: Record<string, DemandUnitMonthlyStats> | null
  /** Monthly shortage statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_shortage: Record<string, DemandUnitMonthlyStats> | null
}

// ============================================================================
// AG Aggregate Types (Agricultural delivery statistics)
// ============================================================================

/**
 * AG aggregate data with monthly delivery statistics
 * Reuses CwsDeliveryMonthlyStats for per-month shape (q*, exc_p*, avg_taf, cv)
 */
export interface AgAggregateData {
  /** Display label (e.g., "SWP Project AG") */
  label: string
  /** Project (e.g., "SWP", "CVP") */
  project: string
  /** Region (e.g., "TOTAL", "NOD", "SOD") */
  region: string
  /** Monthly delivery statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_delivery: Record<string, CwsDeliveryMonthlyStats>
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/ag-aggregates/monthly
 */
export interface AgAggregateMonthlyResponse {
  scenario_id: string
  /** Aggregate data keyed by short_code (e.g., "swp_pag", "cvp_pag_n") */
  aggregates: Record<string, AgAggregateData>
}

/**
 * Period-of-record summary for an AG aggregate
 */
export interface AgAggregatePeriodSummary {
  /** Display label */
  label: string
  /** Project */
  project: string
  /** Region */
  region: string
  /** First year of simulation */
  simulation_start_year: number
  /** Last year of simulation */
  simulation_end_year: number
  /** Total years in record */
  total_years: number
  /** Annual average delivery in TAF */
  annual_delivery_avg_taf: number
  /** Coefficient of variation for annual delivery */
  annual_delivery_cv: number
  /** Delivery exceedance values (p5, p10, p25, p50, p75, p90, p95) */
  delivery_exceedance: Record<string, number>
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/ag-aggregates/period-summary
 */
export interface AgAggregatePeriodResponse {
  scenario_id: string
  /** Period summary data keyed by short_code */
  aggregates: Record<string, AgAggregatePeriodSummary>
}

// ============================================================================
// AG Demand Unit Types (150 agricultural demand units)
// ============================================================================

/**
 * One row in the AG demand-units list endpoint. Used to populate the
 * "Add a demand unit" dropdown in AgSection. Fields mirror the columns in
 * `du_agriculture_entity` plus a few aggregate-style helpers
 */
export interface AgDemandUnitListItem {
  /** Demand unit id, e.g. "64_PA1" */
  du_id: string
  /** Numeric WBA id as a string */
  wba_id: string | null
  /** Hydrologic region: "SAC", "SJR", "TULARE", or null */
  hydrologic_region: string | null
  /** CS3 contractor type: "PA", "SA", "XA", "PR", "NR", or null */
  cs3_type: string | null
  /** Display name, e.g. "Westlands WD" */
  agency: string | null
  /** Water provider: "CVP", "SWP", "Reclamation", or null */
  provider: string | null
  /** True if this DU has groundwater supply data */
  gw: boolean
  /** True if this DU has surface-water supply data */
  sw: boolean
  /** Total acres if known */
  total_acres: number | null
  /** True if a GIS polygon exists for this DU */
  has_gis_data: boolean
}

/**
 * Response from `/api/statistics/ag-demand-units` (the list endpoint)
 */
export interface AgDemandUnitsListResponse {
  demand_units: AgDemandUnitListItem[]
  count: number
}

/**
 * AG demand unit delivery data with monthly statistics
 */
export interface AgDemandUnitDeliveryData {
  /** Agency name */
  agency: string
  /** Hydrologic region ("SAC", "SJR", "TULARE", or null) */
  hydrologic_region: string | null
  /** CS3 contractor type ("PA", "SA", "XA", or null) */
  cs3_type: string | null
  /** Water provider ("CVP", "SWP", or null) */
  provider: string | null
  /** Monthly delivery statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_delivery: Record<string, CwsDeliveryMonthlyStats>
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/ag-demand-units/delivery-monthly
 */
export interface AgDemandUnitDeliveryMonthlyResponse {
  scenario_id: string
  /** Demand unit data keyed by DU ID (e.g., "02_NA", "50_PA1") */
  demand_units: Record<string, AgDemandUnitDeliveryData>
}

/**
 * Period summary for an AG demand unit.
 *
 * Shape mirrors the backend's `ag_du_period_summary` table.
 * AG demand units distinguish demand (applied water requirement) from
 * actual surface-water delivery, with the remainder met by groundwater
 * pumping or counted as shortage
 */
export interface AgDemandUnitPeriodSummary {
  /** Agency name */
  agency: string
  /** Hydrologic region */
  hydrologic_region: string | null
  /** CS3 contractor type */
  cs3_type: string | null
  /** Water provider */
  provider: string | null
  /** First year of simulation */
  simulation_start_year: number
  /** Last year of simulation */
  simulation_end_year: number
  /** Total years in record */
  total_years: number
  /** Annual average applied-water demand in TAF */
  annual_demand_avg_taf: number
  /** Coefficient of variation for annual demand */
  annual_demand_cv: number | null
  /** Demand exceedance values keyed by percentile (p5, p10, p25, p50, p75, p90, p95) */
  demand_exceedance: Record<string, number>
  /** Annual average surface-water delivery in TAF */
  annual_sw_delivery_avg_taf: number | null
  /** Coefficient of variation for annual SW delivery */
  annual_sw_delivery_cv: number | null
  /** Annual average groundwater pumping in TAF */
  annual_gw_pumping_avg_taf: number | null
  /** Coefficient of variation for annual GW pumping */
  annual_gw_pumping_cv: number | null
  /** GW pumping as a percentage of total demand */
  gw_pumping_pct_of_demand: number | null
  /** Annual average shortage in TAF (null if no shortage data) */
  annual_shortage_avg_taf: number | null
  /** Number of years with shortage > 0 */
  shortage_years_count: number | null
  /** Percentage of years with shortage > 0 */
  shortage_frequency_pct: number | null
  /** Average shortage as percentage of demand */
  annual_shortage_pct_of_demand: number | null
  /** Average percent of annual demand met, computed by the backend as
   *  (annual_demand - annual_shortage) / annual_demand × 100 */
  reliability_pct: number | null
  /** Same value as `reliability_pct`, kept for backward compatibility */
  avg_pct_demand_met: number | null
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/ag-demand-units/period-summary
 */
export interface AgDemandUnitPeriodResponse {
  scenario_id: string
  /** Period summary data keyed by DU ID */
  demand_units: Record<string, AgDemandUnitPeriodSummary>
}

// ============================================================================
// Batch Statistics Types
// ============================================================================

/**
 * Storage data for a single scenario in batch response.
 *
 * Mirrors `fetch_storage_monthly` on the backend. `monthly_percent` and
 * `monthly_taf` are keyed by water-month string. Note the backend doesn't
 * populate `dead_pool_taf` here. To get dead-pool metadata, use
 * `useGroupedReservoirPercentiles`.
 */
export interface BatchStorageData {
  scenario_id: string
  reservoirs: Record<
    string,
    {
      name: string
      capacity_taf: number | null
      monthly_percent: MonthlyPercentiles
      monthly_taf: MonthlyPercentiles
    }
  >
}

/**
 * CWS data for a single scenario in batch response
 */
export interface BatchCwsData {
  monthly: CwsAggregateMonthlyResponse
  period: CwsAggregatePeriodResponse
}

/**
 * AG data for a single scenario in batch response
 */
export interface BatchAgData {
  monthly: AgAggregateMonthlyResponse
  period: AgAggregatePeriodResponse
}

/**
 * Environmental flow data for a single scenario in batch response.
 *
 * Each sub-call may fail independently in the backend (which returns the
 * partial result rather than failing the whole batch), so each field is
 * optional.
 */
export interface BatchEnvFlowData {
  monthly?: ChannelsMonthlyResponse
  seasonal?: ChannelsSeasonalResponse
  period?: ChannelsPeriodSummaryResponse
}

/**
 * Response from /api/statistics/batch
 *
 * Combines storage, CWS, AG, and env_flow data for multiple scenarios in
 * a single response. Sub-fields are populated only when the caller requests
 * the corresponding type via the `types` query param.
 */
export interface BatchStatisticsResponse {
  scenarios: string[]
  storage?: Record<string, BatchStorageData>
  cws?: Record<string, BatchCwsData>
  ag?: Record<string, BatchAgData>
  env_flow?: Record<string, BatchEnvFlowData>
}

// ============================================================================
// Wildlife Refuge Delivery Types
// ============================================================================

/**
 * Refuge demand unit metadata
 * from /api/statistics/refuge-demand-units
 */
export interface RefugeDemandUnitData {
  /** Demand unit ID (e.g., "08N_PR1"), references du_refuge_entity.du_id */
  du_id: string
  /** Water balance area ID */
  wba_id: string
  /** Hydrologic region ("SAC", "SJR", "TULARE") */
  hydrologic_region: string
  /** CS3 contractor type ("PR" = Priority Refuge, "NR" = Non-priority Refuge) */
  cs3_type: string
  /** Refuge or wildlife area name */
  refuge_or_wildlife_area: string | null
  /** Managing agency (e.g., "USFWS") */
  managed_by: string | null
  /** Water provider description */
  provider: string | null
  /** Whether the DU receives surface water */
  sw: boolean
}

/**
 * Response from /api/statistics/refuge-demand-units
 */
export interface RefugeDemandUnitsListResponse {
  demand_units: RefugeDemandUnitData[]
  total: number
}

/**
 * Monthly delivery statistics for one (du_id × water_month) combination
 */
export interface RefugeDeliveryMonthlyStats {
  /** Demand unit ID */
  du_id: string
  /** Water month (1=Oct, 12=Sep) */
  water_month: number
  /** Mean delivery for this water month across all simulated years (TAF) */
  delivery_avg_taf: number | null
  /** Coefficient of variation of monthly delivery */
  delivery_cv: number | null
  /** 0th percentile delivery (TAF) */
  q0: number | null
  q10: number | null
  q30: number | null
  q50: number | null
  q70: number | null
  q90: number | null
  q100: number | null
  /** Exceedance percentiles: exc_pX = value exceeded X% of time */
  exc_p5: number | null
  exc_p10: number | null
  exc_p25: number | null
  exc_p50: number | null
  exc_p75: number | null
  exc_p90: number | null
  exc_p95: number | null
  sample_count: number | null
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/refuge-demand-units/delivery-monthly
 */
export interface RefugeDeliveryMonthlyResponse {
  scenario_id: string
  data: RefugeDeliveryMonthlyStats[]
  count: number
}

/**
 * Monthly shortage statistics for one (du_id × water_month) combination.
 * Shortage = max(demand - delivery, 0). No native CalSim shortage variable exists.
 */
export interface RefugeShortageMonthlyStats {
  /** Demand unit ID */
  du_id: string
  /** Water month (1=Oct, 12=Sep) */
  water_month: number
  /** Mean shortage for this water month (TAF) */
  shortage_avg_taf: number | null
  /** CV of monthly shortage (TAF) */
  shortage_cv: number | null
  /** Mean shortage as % of demand */
  shortage_pct_avg: number | null
  /** CV of monthly shortage % */
  shortage_pct_cv: number | null
  /** Fraction of months with shortage > 0.1 TAF threshold */
  shortage_frequency_pct: number | null
  /** Percentile bands of monthly shortage TAF */
  q0: number | null
  q10: number | null
  q30: number | null
  q50: number | null
  q70: number | null
  q90: number | null
  q100: number | null
  /** Exceedance percentiles of monthly shortage TAF */
  exc_p5: number | null
  exc_p10: number | null
  exc_p25: number | null
  exc_p50: number | null
  exc_p75: number | null
  exc_p90: number | null
  exc_p95: number | null
  sample_count: number | null
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/refuge-demand-units/shortage-monthly
 */
export interface RefugeShortageMonthlyResponse {
  scenario_id: string
  data: RefugeShortageMonthlyStats[]
  count: number
}

/**
 * Period-of-record summary for one (scenario × du_id) pair
 */
export interface RefugePeriodSummary {
  /** Demand unit ID */
  du_id: string
  simulation_start_year: number | null
  simulation_end_year: number | null
  total_years: number | null
  /** Mean of annual delivery totals (TAF) */
  annual_delivery_avg_taf: number | null
  annual_delivery_cv: number | null
  /** Annual delivery exceedance curve */
  delivery_exc_p5: number | null
  delivery_exc_p10: number | null
  delivery_exc_p25: number | null
  delivery_exc_p50: number | null
  delivery_exc_p75: number | null
  delivery_exc_p90: number | null
  delivery_exc_p95: number | null
  /** Mean of annual shortage totals (TAF) */
  annual_shortage_avg_taf: number | null
  annual_shortage_cv: number | null
  /** Mean annual shortage as % of demand */
  annual_shortage_pct_avg: number | null
  annual_shortage_pct_cv: number | null
  /**
   * 95th percentile of annual shortage %.
   * "In 95 of 100 years, annual shortage ≤ this value."
   * 0 = perfectly reliable in 95% of years.
   */
  reliability_pct_95: number | null
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/refuge-demand-units/period-summary
 */
export interface RefugePeriodResponse {
  scenario_id: string
  data: RefugePeriodSummary[]
  count: number
}

// ============================================================================
// Environmental River Flows types
// ============================================================================

/**
 * A single CalSim channel reach from /api/statistics/channels
 */
export interface ChannelEntity {
  network_arc_id: string
  label: string
  channel_class: "stream" | "canal" | "reservoir_release" | null
  channel_class_label: string | null
  watershed_short_code: string | null
  watershed_name: string | null
  hydrologic_region: string | null
  /** SV variable name for natural unimpaired flow reference (e.g., "UNIMP_SHAS") */
  unimp_sv_variable: string | null
  /** true if this reach has a C_{reach}_MIF binding minimum instream flow in the DV */
  has_mif: boolean
  /** true if this reach has an EFLOWS_{reach} functional flow target in the SV */
  has_eflows: boolean
}

/** Response from /api/statistics/channels */
export interface ChannelsListResponse {
  channels: ChannelEntity[]
  total: number
}

/**
 * One (channel × water_month) row from
 * /api/statistics/scenarios/:scenarioId/channels/monthly
 *
 * Stores two parallel statistic families (migration 28 added the flow_q* columns):
 *
 *   Flow volume (all channels):
 *     flow_avg_cfs/taf: mean monthly flow
 *     flow_q{p}_cfs/taf: percentile bands of per-year monthly flow in CFS and TAF/month
 *     flow_exc_p{p}_cfs/taf: exceedance percentiles
 *
 *   % unimpaired (channels with a UNIMP reference only):
 *     q* / exc_p*: percentile distribution of pct_unimpaired
 *     NULL for Mokelumne reaches and any channel without unimp_sv_variable.
 */
export interface ChannelMonthlyStats {
  network_arc_id: string
  /** 1=October ... 12=September */
  water_month: number

  // ── Flow volume
  /** Mean monthly flow (CFS) across all simulated years */
  flow_avg_cfs: number | null
  flow_cv: number | null
  /** Mean monthly flow volume (TAF/month) across all simulated years */
  flow_avg_taf: number | null
  /** Percentile bands of per-year monthly flow, CFS */
  flow_q0_cfs: number | null
  flow_q10_cfs: number | null
  flow_q30_cfs: number | null
  flow_q50_cfs: number | null
  flow_q70_cfs: number | null
  flow_q90_cfs: number | null
  flow_q100_cfs: number | null
  /** Exceedance percentiles, CFS (exc_p5 = value exceeded 5 % of years) */
  flow_exc_p5_cfs: number | null
  flow_exc_p10_cfs: number | null
  flow_exc_p25_cfs: number | null
  flow_exc_p50_cfs: number | null
  flow_exc_p75_cfs: number | null
  flow_exc_p90_cfs: number | null
  flow_exc_p95_cfs: number | null
  /** Percentile bands of per-year monthly flow, TAF/month */
  flow_q0_taf: number | null
  flow_q10_taf: number | null
  flow_q30_taf: number | null
  flow_q50_taf: number | null
  flow_q70_taf: number | null
  flow_q90_taf: number | null
  flow_q100_taf: number | null
  /** Exceedance percentiles, TAF/month */
  flow_exc_p5_taf: number | null
  flow_exc_p10_taf: number | null
  flow_exc_p25_taf: number | null
  flow_exc_p50_taf: number | null
  flow_exc_p75_taf: number | null
  flow_exc_p90_taf: number | null
  flow_exc_p95_taf: number | null

  // ── % unimpaired ─────────────────────────────────────────────────────────
  /** Mean of unimpaired reference flow (CFS) for this month */
  unimp_avg_cfs: number | null
  /** Mean (C_{reach} / UNIMP) × 100 across years, NULL if no UNIMP reference */
  pct_unimpaired_avg: number | null
  pct_unimpaired_cv: number | null
  /** Percentile distribution of pct_unimpaired across years */
  q0: number | null
  q10: number | null
  q30: number | null
  q50: number | null
  q70: number | null
  q90: number | null
  q100: number | null
  exc_p5: number | null
  exc_p10: number | null
  exc_p25: number | null
  exc_p50: number | null
  exc_p75: number | null
  exc_p90: number | null
  exc_p95: number | null

  sample_count: number | null
}

/** Response from /api/statistics/scenarios/:scenarioId/channels/monthly */
export interface ChannelsMonthlyResponse {
  scenario_id: string
  /** Flat array: 59 channels × 12 months = 708 rows */
  data: ChannelMonthlyStats[]
  count: number
}

/**
 * One (channel × CEFF season) row from
 * /api/statistics/scenarios/:scenarioId/channels/seasonal
 *
 * Contains three metric families (all may be partially NULL):
 *   flow_*: raw CFS volume distribution (all 59 channels)
 *   unimp_* / pct_unimpaired_*: Metric 1 seasonal (57 channels; NULL for Mokelumne)
 *   pct_ff_* / ff_* / deviation_avg: Metric 2 (17 EFLOWS channels; NULL otherwise)
 */
export interface ChannelSeasonalStats {
  network_arc_id: string
  season_id: number
  season_short_code:
    | "wet_peak"
    | "wet_base"
    | "spring_recession"
    | "dry"
    | "fall_pulse"
  season_name: string
  season_sort_order: number
  // Raw flow volume (CFS)
  flow_avg_cfs: number | null
  flow_cv: number | null
  flow_q0: number | null
  flow_q10: number | null
  flow_q30: number | null
  flow_q50: number | null
  flow_q70: number | null
  flow_q90: number | null
  flow_q100: number | null
  flow_exc_p5: number | null
  flow_exc_p10: number | null
  flow_exc_p25: number | null
  flow_exc_p50: number | null
  flow_exc_p75: number | null
  flow_exc_p90: number | null
  flow_exc_p95: number | null
  // % unimpaired (Metric 1 seasonal)
  unimp_avg_cfs: number | null
  pct_unimpaired_avg: number | null
  pct_unimpaired_cv: number | null
  unimp_q0: number | null
  unimp_q10: number | null
  unimp_q30: number | null
  unimp_q50: number | null
  unimp_q70: number | null
  unimp_q90: number | null
  unimp_q100: number | null
  unimp_exc_p5: number | null
  unimp_exc_p10: number | null
  unimp_exc_p25: number | null
  unimp_exc_p50: number | null
  unimp_exc_p75: number | null
  unimp_exc_p90: number | null
  unimp_exc_p95: number | null
  // % functional flows (Metric 2, NULL unless has_eflows = true)
  /** Mean (C_{reach} / EFLOWS_{reach}) × 100 across simulated years, by season */
  pct_ff_avg: number | null
  pct_ff_cv: number | null
  /** pct_ff_avg − 100.0; negative = below functional flow target */
  deviation_avg: number | null
  /** Fraction of years where seasonal pct_ff >= 100% (target met) */
  target_met_pct: number | null
  ff_q0: number | null
  ff_q10: number | null
  ff_q30: number | null
  ff_q50: number | null
  ff_q70: number | null
  ff_q90: number | null
  ff_q100: number | null
  ff_exc_p5: number | null
  ff_exc_p10: number | null
  ff_exc_p25: number | null
  ff_exc_p50: number | null
  ff_exc_p75: number | null
  ff_exc_p90: number | null
  ff_exc_p95: number | null
  sample_count: number | null
}

/** Response from /api/statistics/scenarios/:scenarioId/channels/seasonal */
export interface ChannelsSeasonalResponse {
  scenario_id: string
  /** Flat array: 59 channels × 5 seasons = 295 rows */
  data: ChannelSeasonalStats[]
  count: number
}

/**
 * One channel's period-of-record summary from
 * /api/statistics/scenarios/:scenarioId/channels/period-summary
 *
 * Metric 3, Pearson r flow alteration index (monthly simulated vs. unimpaired).
 * r ≈ +1: natural seasonal timing preserved.
 * r ≈ 0: seasonal pattern substantially altered.
 * NULL where no unimpaired reference variable exists.
 */
export interface ChannelPeriodSummary {
  network_arc_id: string
  simulation_start_year: number | null
  simulation_end_year: number | null
  total_months: number | null
  /** Pearson r between monthly C_{reach} and UNIMP_{watershed} (full period of record) */
  pearson_r: number | null
  /** Two-tailed p-value for pearson_r (total_months = sample size) */
  p_value: number | null
  /** Mean of all monthly pct_unimpaired values over the full period */
  avg_pct_unimpaired: number | null
  annual_cv_pct_unimpaired: number | null
  /** Mean of all monthly pct_ff values (NULL if no EFLOWS target) */
  avg_pct_ff: number | null
  annual_cv_pct_ff: number | null
  /** % of months where C_{reach} >= binding MIF (NULL if has_mif = false) */
  mif_met_pct: number | null
  has_mif: boolean
  has_eflows: boolean
  unimp_sv_variable: string | null
}

/** Response from /api/statistics/scenarios/:scenarioId/channels/period-summary */
export interface ChannelsPeriodSummaryResponse {
  scenario_id: string
  /** One row per channel reach (59 rows) */
  data: ChannelPeriodSummary[]
  count: number
}

// ============================================================================
// DELTA STATISTICS
// ============================================================================

/**
 * Monthly statistics for one (variable_code × water_month) from delta_monthly.
 *
 * Variables: x2 (KM), em_ec/jp_ec/rs_ec/co_ec (UMHOS/CM),
 *            banks_ec/tracy_ec (UMHOS/CM), ndo (TAF).
 */
export interface DeltaMonthlyStats {
  variable_code: string
  water_month: number
  avg: number | null
  cv: number | null
  unit: string
  avg_cfs: number | null
  q0: number | null
  q10: number | null
  q30: number | null
  q50: number | null
  q70: number | null
  q90: number | null
  q100: number | null
  exc_p5: number | null
  exc_p10: number | null
  exc_p25: number | null
  exc_p50: number | null
  exc_p75: number | null
  exc_p90: number | null
  exc_p95: number | null
  sample_count: number | null
}

/** Response from /api/statistics/scenarios/:scenarioId/delta/monthly */
export interface DeltaMonthlyResponse {
  scenario_id: string
  data: DeltaMonthlyStats[]
  count: number
}
