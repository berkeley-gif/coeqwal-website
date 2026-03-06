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
    "Tiers reflect the degree of Municipal & Industrial demands satisfied by CalSim demand unit or diversion node",
  AG_REV:
    "Tiers correspond to the impact of water shortages on agricultural production",
  ENV_FLOWS:
    "Tiers reflect the extent to which modeled flows sustain ecological function relative to natural or functional flow (FF) targets. The framework distinguishes between fully functional ecosystems, partially functional conditions, existing regulatory baselines, and degraded/no-function states.",
  RES_STOR:
    "Tier reflects the degree to which a reservoir fills each spring in advance of the summer delivery season (Apr-Oct) during which reservoirs provide water to irrigators and communities. Tiers are designated for select key reservoirs based on how frequently those reservoirs have April 30 (end of month) storage above or below certain thresholds. These thresholds are different for each reservoir and are set here based on percentiles of recent historical data, but may be adjusted in the future. The scheme described here yields tier designations that will be '1' if storage conditions are more consistently higher than recent historical conditions; '2' if they are roughly equivalent to recent conditions; '3' if they are moderately lower than recent conditions; and '4' if they are consistently and substantially lower than recent conditions.",
  GW_STOR:
    "Tier reflects how groundwater storage conditions (total water in the theoretically accessible aquifer system) compares to a reference condition. Groundwater responds slowly (at least compared to surface water systems) and can exhibit long-term upward or downward storage trends. Different scenarios may also exhibit shifts in the magnitude of storage but with a similar trend. The tiers attempt to assign tier designations at the Water Budget Area (WBA) level based on these trend and magnitude characteristics.",
  DELTA_ECO:
    "Tiers reflect ecological responses to flow, measured by direct indicators (SAV growth, salinity, turbidity, microhabitat availability). Indicators are assigned a given score based on average winter/spring flows, and scores are scaled accordingly to accommodate threshold effects and additive impacts from multiple years of wet/dry conditions.",
  FW_EXP:
    "Tier reflects the amount of fresh water exported from the Delta pumps (Banks, Jones) over the 100-year simulation period. For this tier calculation, the volume of water pumped at either pumping location is reduced proportionally by the amount the salinity of that water exceeds 900 uS/cm. Water pumped with salinity greater than 2500 uS/cm is assigned a 0 value. Tiers are defined based on the combined total volume pumped at each pumping location for the 100-year period.",
  FW_DELTA_USES:
    "How often water in the Delta is fresh enough for in-Delta uses, assessed at **two compliance locations** in the western Delta.",
  WRC_SALMON_AB:
    "Tiers reflect whether the population shows strong growth (Tier 1), moderate growth (Tier 2), little or no change (Tier 3), or experiences population decline (Tier 4).",
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
    tier1:
      "Near full deliveries in most years, no years with large shortfalls (Definition: ≥ 90% of target met in ≥ 90% of years, no year with ≤ 70% of target delivered)",
    tier2:
      "Near full deliveries in at least half of years, no years with critical shortfalls (Definition: ≥ 90% of target met in ≥ 50% of years, no years with ≤ 50% of target delivered)",
    tier3:
      "Near full deliveries in at least half of years, no more than 20 years with critical shortfalls (Definition: ≥ 90% of target met in ≥ 50% of years, no more than 20% of years with < 50% of target delivered)",
    tier4:
      "None of the above criteria met (Either ≥ 90% of target met in < 50% of years and/or ≥ 20% years with < 50% of target delivered)",
  },
  AG_REV: {
    tier1:
      "Optimal: Agricultural production increases with respect to today's outcomes",
    tier2:
      "Sub-optimal: Agricultural production declines less than 5% with respect to today's outcomes",
    tier3:
      "At-risk: Agricultural production declines 5%-20% with respect to today's outcomes",
    tier4:
      "Critical: Agricultural production declines more than 20% with respect to today's outcomes",
  },
  ENV_FLOWS: {
    tier1:
      "Optimal: Functional flows to sustain native freshwater species in 90% of years; must have higher mean daily flows (volume/# days) in spring and winter than summer. (Functional Ecosystem)",
    tier2:
      "Sub-optimal: Partial functional flows in wet season and spring; full functional flows in summer in 75% of years. Must have higher mean daily flows (volume/# days) in spring and winter than summer. (Modified Functional Flows)",
    tier3:
      "At-risk: CalSim minimum flow constraints for Baseline Scenario in 50% of years. (Existing Flow Requirements)",
    tier4:
      "Critical: None of the above thresholds met. (No function)",
  },
  RES_STOR: {
    tier1:
      "Optimal: Reservoir storage is greater than or equal to the top threshold for each reservoir for at least 90% of years (as represented by April values) in the dataset. As of July 2025, this threshold is set at the 50th percentile of recent historical data as available through CDEC.",
    tier2:
      "Sub-optimal: Reservoir storage is greater than or equal to the middle threshold for each reservoir for at least 67% of years (as represented by April values) in the dataset. As of July 2025, this threshold is set at the 33rd percentile of recent historical data as available through CDEC.",
    tier3:
      "At-risk: Reservoir storage is greater than or equal to the middle threshold for each reservoir for at least 30% of years (as represented by April values) in the dataset. As of July 2025, this threshold is set at the 33rd percentile of recent historical data as available through CDEC.",
    tier4:
      "Critical: Reservoir storage is not high enough to meet the conditions of Tiers 1-3. Reservoir storage is below the middle threshold (at or below the lower threshold) for more than 70% of years (as represented by April values). As of July 2025, the lower threshold is set as the 20th percentile of recent historical values.",
  },
  GW_STOR: {
    tier1:
      "Optimal: Under Tier 1 conditions, the groundwater trend in a WBA is stable or increasing from 1960-2021 and average total storage is greater than in the reference scenario.",
    tier2:
      "Sub-optimal: Under Tier 2 conditions, the groundwater trend in a WBA is stable or increasing but total storage is less than in the reference.",
    tier3:
      "At-risk: Under Tier 3, the groundwater trend is declining (not stable or increasing as in Tiers 1 or 2) but at a moderate rate (fitted linear trend is less negative than -0.015 ft/yr).",
    tier4:
      "Critical: In Tier 4, groundwater trends in a WBA are declining more severely, at a rate greater than 0.015 ft/year (slope <= -0.015 ft/yr).",
  },
  DELTA_ECO: {
    tier1:
      "Optimal: Scenario scores in the top 25% based on yearly evaluation of ecosystem indicators: low SAV, high turbidity, fresh conditions, expanded microhabitats in most years",
    tier2:
      "Sub-optimal: Scenario scores in the top 50% based on yearly evaluation of ecosystem indicators: unchanged SAV, high turbidity, fresh conditions, some microhabitats available in most years",
    tier3:
      "At-risk: Scenario scores in the top 75% based on yearly evaluation of ecosystem indicators: unchanged SAV, standard turbidity, moderate salinity, few microhabitats available in most years",
    tier4:
      "Critical: None of the above thresholds met: unchanged SAV, low turbidity, moderate to high salinity, few microhabitats available in most years",
  },
  FW_EXP: {
    tier1:
      "Optimal: Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is greater than 505 million acre-feet",
    tier2:
      "Sub-optimal: Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is greater than 465 million acre-feet but less than 505 million acre-feet",
    tier3:
      "At-risk: Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is greater than 400 million acre-feet but less than 465 million acre-feet",
    tier4:
      "Critical: Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is less than 400 million acre-feet",
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
      "Optimal: Tier 1 is met if there's at least an 80% chance (>800 out of 1,000 model runs) that the salmon population grows 8 times its starting size, using a rolling 10-year average.",
    tier2:
      "Sub-optimal: Tier 2 is met if there's at least an 80% chance (>800 out of 1,000 model runs) that the salmon population grows 2 to 8 times its starting size, using a rolling 10-year average.",
    tier3:
      "At-risk: Tier 3 is met if there's at least an 80% chance (>800 out of 1,000 model runs) that the salmon population exceeds its starting size, using a rolling 10-year average.",
    tier4:
      "Critical: Tier 4 is assigned if the change in population size does not satisfy Tier 1, 2, or 3.",
  },
}
