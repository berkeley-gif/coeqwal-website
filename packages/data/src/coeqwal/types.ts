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

// ============================================================================
// CWS Aggregate Types (for M&I delivery/shortage statistics)
// ============================================================================

/**
 * CWS aggregate entity from /api/statistics/cws-aggregates endpoint
 */
export interface CwsAggregate {
  /** Short code identifier (e.g., "swp_total", "cvp_nod") */
  short_code: string
  /** Display label (e.g., "SWP Total M&I", "CVP North") */
  label: string
}

/**
 * Response from /api/statistics/cws-aggregates endpoint
 */
export interface CwsAggregatesListResponse {
  aggregates: CwsAggregate[]
}

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
 * M&I contractor entity from /api/statistics/mi-contractors endpoint
 */
export interface MiContractor {
  /** Short code identifier (e.g., "mwd_mi", "acwd_mi") */
  short_code: string
  /** Display label (e.g., "Metropolitan Water District", "Alameda County WD") */
  label: string
  /** Group identifier (e.g., "swp") */
  group?: string
}

/**
 * Response from /api/statistics/mi-contractors endpoint
 */
export interface MiContractorsListResponse {
  contractors: MiContractor[]
}

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
 * Response from /api/statistics/demand-units/groups endpoint
 * Returns demand units organized by group (e.g., "swp", "cvp")
 */
export interface DemandUnitsGroupedResponse {
  /** Demand units organized by group key */
  groups: Record<string, DemandUnit[]>
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
 * AG demand unit shortage data with monthly statistics
 */
export interface AgDemandUnitShortageData {
  /** Agency name */
  agency: string
  /** Hydrologic region */
  hydrologic_region: string | null
  /** CS3 contractor type */
  cs3_type: string | null
  /** Monthly shortage statistics keyed by water month (1=Oct, 12=Sep) */
  monthly_shortage: Record<string, CwsShortageMonthlyStats>
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/ag-demand-units/shortage-monthly
 */
export interface AgDemandUnitShortageMonthlyResponse {
  scenario_id: string
  /** Demand unit data keyed by DU ID */
  demand_units: Record<string, AgDemandUnitShortageData>
}

/**
 * Period summary for an AG demand unit
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
  /** Annual average delivery in TAF */
  annual_delivery_avg_taf: number
  /** Coefficient of variation for annual delivery */
  annual_delivery_cv: number
  /** Delivery exceedance values (p5, p10, p25, p50, p75, p90, p95) */
  delivery_exceedance: Record<string, number>
  /** Annual average shortage in TAF (null if no shortage data) */
  annual_shortage_avg_taf: number | null
  /** Number of years with shortage > 0 */
  shortage_years_count: number | null
  /** Percentage of years with shortage > 0 */
  shortage_frequency_pct: number | null
  /** Average shortage as percentage of demand */
  annual_shortage_pct_of_demand: number | null
  /** Percentage of months meeting full demand */
  reliability_pct: number | null
  /** Average percent of demand met */
  avg_pct_demand_met: number | null
  /** Annual average demand in TAF */
  annual_demand_avg_taf: number | null
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
// Reservoir Period Summary Types
// ============================================================================

/**
 * Period-of-record data for a single reservoir
 */
export interface ReservoirPeriodData {
  /** Human-readable name */
  name: string
  /** Total reservoir capacity in TAF */
  capacity_taf: number
  /** Storage exceedance values as % of capacity (p5, p10, p25, p50, p75, p90, p95) */
  storage_exceedance: Record<string, number>
  /** Threshold levels */
  thresholds: {
    dead_pool_taf: number
    dead_pool_pct: number
    spill_threshold_pct: number | null
  }
  /** Annual spill summary statistics */
  spill: {
    years_count: number
    frequency_pct: number
    mean_cfs: number
    peak_cfs: number
    annual_avg_taf: number
    annual_cv: number
    annual_max_taf: number
    annual_max_q50: number
    annual_max_q90: number
    annual_max_q100: number
  }
}

/**
 * Response from /api/statistics/scenarios/:scenarioId/period-summary
 */
export interface ReservoirPeriodSummaryResponse {
  scenario_id: string
  /** Reservoir data keyed by short ID (e.g., "FOLSM", "SHSTA") */
  reservoirs: Record<string, ReservoirPeriodData>
}
