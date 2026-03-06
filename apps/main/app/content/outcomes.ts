/**
 * Outcome content - single source of truth for outcome codes and display names
 *
 * Design principle: Short codes are the canonical identifier.
 * Pass codes through components/state, look up display names only at render time.
 */

// =============================================================================
// OUTCOME CODES AND NAMES
// =============================================================================

/**
 * Canonical mapping from API short codes to UI display names.
 * This is the SINGLE source of truth for outcome names.
 */
export const OUTCOME_NAMES = {
  CWS_DEL: "Community deliveries",
  AG_REV: "Agricultural revenue",
  ENV_FLOWS: "Environmental flows",
  RES_STOR: "Reservoir storage",
  GW_STOR: "Groundwater storage",
  DELTA_ECO: "Delta estuary ecology",
  FW_EXP: "Freshwater for Delta exports",
  FW_DELTA_USES: "Freshwater for in-Delta uses",
  WRC_SALMON_AB: "Winter-run salmon",
} as const

/** Valid outcome codes */
export type OutcomeCode = keyof typeof OUTCOME_NAMES

/** All valid outcome codes as an array */
export const OUTCOME_CODES = Object.keys(OUTCOME_NAMES) as OutcomeCode[]

/**
 * Get display name for an outcome code.
 * Returns the code itself if not found (graceful fallback).
 */
export function getOutcomeName(code: string): string {
  return OUTCOME_NAMES[code as OutcomeCode] ?? code
}

/**
 * Get outcome code from display name.
 * Returns undefined if not found.
 */
export function getOutcomeCode(displayName: string): OutcomeCode | undefined {
  const entry = Object.entries(OUTCOME_NAMES).find(
    ([, name]) => name === displayName,
  )
  return entry ? (entry[0] as OutcomeCode) : undefined
}

// =============================================================================
// METRIC ID MAPPINGS (for Data Explorer)
// =============================================================================

/**
 * Map Data Explorer metric IDs directly to outcome codes.
 * This eliminates the need for intermediate display name lookups.
 */
export const METRIC_ID_TO_OUTCOME_CODE: Record<string, OutcomeCode> = {
  "cws-delivery-tier": "CWS_DEL",
  "ag-revenue-tier": "AG_REV",
  "env-flow-tier": "ENV_FLOWS",
  "env-delta-ecology-tier": "DELTA_ECO",
  "salinity-in-delta-tier": "FW_DELTA_USES",
  "salinity-exports-tier": "FW_EXP",
  "reservoir-storage-tier": "RES_STOR",
  "gw-storage-tier": "GW_STOR",
  "salmon-tier": "WRC_SALMON_AB",
}

/**
 * Get outcome code from Data Explorer metric ID.
 * Returns the metric ID as fallback if no mapping found.
 */
export function getOutcomeCodeFromMetricId(
  metricId: string,
): OutcomeCode | string {
  return METRIC_ID_TO_OUTCOME_CODE[metricId] ?? metricId
}

/**
 * Get display name from Data Explorer metric ID.
 * Combines metric→code and code→name lookups.
 */
export function getOutcomeNameFromMetricId(metricId: string): string {
  const code = METRIC_ID_TO_OUTCOME_CODE[metricId]
  return code ? OUTCOME_NAMES[code] : metricId
}

/**
 * Ordered list of outcome codes for UI display.
 * Use this to iterate outcomes in consistent order.
 */
export const OUTCOME_CODE_ORDER: OutcomeCode[] = [
  "CWS_DEL",
  "AG_REV",
  "ENV_FLOWS",
  "RES_STOR",
  "GW_STOR",
  "DELTA_ECO",
  "FW_EXP",
  "FW_DELTA_USES",
  "WRC_SALMON_AB",
]

// =============================================================================
// OUTCOME DEFINITIONS
// =============================================================================

/**
 * Outcome definitions - detailed descriptions keyed by outcome code.
 */
export const OUTCOME_DEFINITIONS: Record<OutcomeCode, string> = {
  CWS_DEL:
    "Extent to which water deliveries to cities, towns, and communities are sufficient to satisfy needs for drinking water, sanitation, and municipal uses. Water deliveries are evaluated for **140 community water systems**.",
  AG_REV:
    "How average agricultural revenue changes in response to water deliveries. Revenues are estimated at **134 agricultural water districts** and evaluated relative to historical values.",
  ENV_FLOWS:
    "Extent to which river flows are of sufficient magnitude across seasons and year-to-year to support healthy riverine ecosystems, evaluated at **17 locations** on the Sacramento and San Joaquin Rivers and their major tributaries.",
  RES_STOR:
    "How full reservoirs are on April 30, which is an important benchmark for the amount of water available for delivery in the dry season (April – October). Reservoir storage outcomes are assessed in **8 large reservoirs**.",
  GW_STOR:
    "Trends in groundwater storage, relative to 1960 – 2021 historical conditions. Groundwater storage outcomes are assessed in XX groundwater basins in the Central Valley.",
  DELTA_ECO:
    "Extent to which seasonal outflows from the Sacramento-San Joaquin River Delta through the estuary support beneficial ecological responses. More high-flow years in a row generally support more suitable habitat for native species in the Delta.",
  FW_EXP:
    "How often salinity meets or exceeds water quality requirements for exporting water for drinking water or irrigation needs, assessed at the **Banks and Jones pumping plants**.",
  FW_DELTA_USES:
    "How often water in the Delta is fresh enough for in-Delta uses, assessed at **two compliance locations** in the western Delta.",
  WRC_SALMON_AB:
    "Change in population trend for endangered Sacramento River winter-run Chinook salmon.",
}

/**
 * Get outcome definition by code.
 */
export function getOutcomeDefinition(code: string): string | undefined {
  return OUTCOME_DEFINITIONS[code as OutcomeCode]
}

// =============================================================================
// TIER VALUE DEFINITIONS
// =============================================================================

export interface TierValueDefinitions {
  tier1: string
  tier2: string
  tier3: string
  tier4: string
}

/**
 * Tier value definitions for each outcome, keyed by outcome code.
 */
export const OUTCOME_TIER_VALUES: Record<OutcomeCode, TierValueDefinitions> = {
  CWS_DEL: {
    tier1: "Optimal: Water deliveries reduced by less than 10% of planned",
    tier2: "Sub-optimal: Water deliveries reduced by less than 20% of planned",
    tier3: "At-risk: Water deliveries reduced by less than 30% of planned",
    tier4: "Critical: Water deliveries reduced by more than 30% of planned",
  },
  AG_REV: {
    tier1: "Optimal: Agricultural revenue remains stable or increase",
    tier2: "Sub-optimal: Agricultural revenue declines less than 5%",
    tier3: "At-risk: Agricultural revenue declines between 5% and 20%",
    tier4: "Critical: Agricultural revenue decreases more than 20%",
  },
  ENV_FLOWS: {
    tier1:
      "Optimal: Flows exhibit sufficient magnitude and variation in 90% of years",
    tier2:
      "Sub-optimal: Flows in the wet season and spring are below target ranges, but flows in the dry season are sufficient in 90% of years.",
    tier3:
      "At-risk: Seasonal flow targets are not achieved in wet season, spring, or dry season, but existing regulatory minimum flows are met in 90% of years.",
    tier4:
      "Critical: Minimum flow requirements are met in fewer than 90% of years.",
  },
  RES_STOR: {
    tier1:
      "Optimal: Reservoir storage is frequently high. There is a 90% chance that end-of-April reservoir storage is greater than the long-term median value",
    tier2:
      "Sub-optimal: Reservoir storage is lower, but similar to recent history. In two out of three years (66%), end-of-April storage exceeds the **33rd percentile** of long-term values",
    tier3:
      "At-risk: Reservoir storage is slightly lower than recent history. In three out of ten years (30%), end-of-April storage exceeds the **33rd percentile** of long-term values",
    tier4:
      "Critical: Reservoir storage is much lower than recent history. In fewer than three out of ten years (30%), end-of-April storage exceeds the **33rd percentile** of long-term values",
  },
  GW_STOR: {
    tier1:
      "Optimal: Groundwater trend is **stable or increasing** and average total storage is **greater than historical**.",
    tier2:
      "At-risk: Groundwater trend is **stable or increasing** and average total storage is **less than historical**.",
    tier3:
      "Compromised: Groundwater trend is **declining at a moderate rate**.",
    tier4: "Critical: Groundwater trend is **declining at a rapid rate**.",
  },
  DELTA_ECO: {
    tier1:
      "Optimal: Scores in top 25% of healthy flows compared to historical record",
    tier2:
      "Sub-optimal: Scores in top 50% of healthy flows compared to historical record",
    tier3:
      "At-risk: Scores in top 75% of healthy flows compared to historical record",
    tier4: "Critical: Doesn't meet any of the above thresholds",
  },
  FW_EXP: {
    tier1:
      "Optimal: Average salinity at pumping plants meets water quality standards for drinking and irrigation year round in 95% of years",
    tier2:
      "Sub-optimal: Average salinity at pumping plants remains suitable for drinking and irrigation (but with potential need for extra treatment) for at least 10 months per year in 95% of years",
    tier3:
      "At-risk: Average salinity at pumping plants is unsuitable for drinking and irrigation for 2 months in any year, in more than 5% of years at either site",
    tier4:
      "Critical: Average salinity at pumping plants is unsuitable for irrigation or drinking water for **more than two months in any year**",
  },
  FW_DELTA_USES: {
    tier1:
      "Optimal: Water is fresh enough for human use with no restrictions in at least 75% of all months, and unusable no more than in 5% of all months.",
    tier2:
      "Sub-optimal: Water is fresh enough for human use with no restrictions in at least 65% of all months, fresh enough for human use with some treatment or cropping adjustments in at least 75% of months, and unusable in no more than 12% of all months.",
    tier3:
      "At-risk: Water is fresh enough for human use with no restrictions in at least 55% of all months, fresh enough for human use with some treatment or cropping adjustments in at least 65% of months, and unusable in no more than 20% of all months.",
    tier4:
      "Critical: Water is fresh enough for human use with no restrictions in less than 55% of all months and/or is unusable in more than 20% of all months.",
  },
  WRC_SALMON_AB: {
    tier1:
      "Optimal: There is at least an 80% chance that the population grows to 8 times its current size",
    tier2:
      "Sub-optimal: There is at least an 80% chance that the population grows to 2 to 8 times its current size",
    tier3:
      "At-risk: There is at least an 80% chance that the population grows from its current size, but does not exceed 2 times its current size",
    tier4:
      "Critical: The population **does not grow** from its current size, **remains stable** at current levels, or the population **declines**.",
  },
}
