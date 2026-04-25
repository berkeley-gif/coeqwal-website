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
 * Get display name for an outcome code (checks both API and NOD/SOD codes).
 * Returns the code itself if not found (graceful fallback).
 */
export function getOutcomeName(code: string): string {
  return (
    OUTCOME_NAMES[code as OutcomeCode] ??
    NOD_SOD_NAMES[code as NodSodCode] ??
    code
  )
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
 * Combines metric->code and code->name lookups.
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
// NOD/SOD SPLIT AXES (temporary local data from COEQWAL_V3)
// =============================================================================

export const NOD_SOD_NAMES = {
  NOD_DW: "NOD: Community deliveries",
  SOD_DW: "SOD: Community deliveries",
  NOD_AG: "NOD: Agricultural revenue",
  SOD_AG: "SOD: Agricultural revenue",
  NOD_EFLOWS: "NOD: Environmental flows",
  SOD_EFLOWS: "SOD: Environmental flows",
  NOD_RES: "NOD: Reservoir storage",
  SOD_RES: "SOD: Reservoir storage",
  NOD_GW: "NOD: Groundwater storage",
  SOD_GW: "SOD: Groundwater storage",
} as const

export type NodSodCode = keyof typeof NOD_SOD_NAMES

export const NOD_SOD_OUTCOME_CODES: NodSodCode[] = [
  "NOD_DW",
  "SOD_DW",
  "NOD_AG",
  "SOD_AG",
  "NOD_EFLOWS",
  "SOD_EFLOWS",
  "NOD_RES",
  "SOD_RES",
  "NOD_GW",
  "SOD_GW",
]

/** NOD-only codes, in the same category order as OUTCOME_CODE_ORDER */
export const NOD_CODES: NodSodCode[] = [
  "NOD_DW",
  "NOD_AG",
  "NOD_EFLOWS",
  "NOD_RES",
  "NOD_GW",
]

/** SOD-only codes, in the same category order as OUTCOME_CODE_ORDER */
export const SOD_CODES: NodSodCode[] = [
  "SOD_DW",
  "SOD_AG",
  "SOD_EFLOWS",
  "SOD_RES",
  "SOD_GW",
]

/** Maps each key outcome to its [NOD, SOD] variant codes (if any). */
export const OUTCOME_REGIONAL_VARIANTS: Partial<
  Record<OutcomeCode, [NodSodCode, NodSodCode]>
> = {
  CWS_DEL: ["NOD_DW", "SOD_DW"],
  AG_REV: ["NOD_AG", "SOD_AG"],
  ENV_FLOWS: ["NOD_EFLOWS", "SOD_EFLOWS"],
  RES_STOR: ["NOD_RES", "SOD_RES"],
  GW_STOR: ["NOD_GW", "SOD_GW"],
}

/**
 * Radar spoke order (codes): each aggregate outcome, then its NOD and SOD axes
 * when those exist - so e.g. Community deliveries → NOD → SOD clockwise.
 * Outcomes without regional splits appear alone. Selected-only subsets keep
 * this relative order (see RadarPanel `visibleAxisNames`).
 */
export const ALL_RADAR_AXES_ORDER: string[] = OUTCOME_CODE_ORDER.flatMap(
  (code) => {
    const v = OUTCOME_REGIONAL_VARIANTS[code]
    return v ? [code, v[0], v[1]] : [code]
  },
)

// =============================================================================
// OUTCOME LOCATION DESCRIPTIONS
// =============================================================================

/**
 * Number of measurement locations for single-value outcomes.
 * Matches the polygon counts in the get-started overlay.
 */
export function getSingleValueLocationCount(code: string): number {
  switch (code) {
    case "DELTA_ECO":
      return 1
    case "FW_EXP":
      return 2
    case "FW_DELTA_USES":
      return 2
    case "WRC_SALMON_AB":
      return 1
    default:
      return 0
  }
}

/**
 * Describe the locations measured for an outcome.
 * Matches the captions shown below distribution squares in the get-started overlay.
 */
export function describeOutcomeLocations(
  code: string,
  locationCount?: number,
): string {
  switch (code) {
    case "ENV_FLOWS":
      return locationCount
        ? `${locationCount} river & tributary reaches`
        : "river & tributary reaches"
    case "RES_STOR":
      return locationCount
        ? `${locationCount} major California reservoirs`
        : "major California reservoirs"
    case "DELTA_ECO":
      return "Sacramento-San Joaquin Delta"
    case "FW_EXP":
      return "Banks & Jones Pumping Plants"
    case "FW_DELTA_USES":
      return "Emmaton & Jersey Point"
    case "WRC_SALMON_AB":
      return "population health along the Sacramento"
    default:
      return locationCount ? `${locationCount} locations` : ""
  }
}

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
    'Tier reflects the degree to which a reservoir fills each spring in advance of the summer delivery season (Apr-Oct) during which reservoirs provide water to irrigators and communities. Tiers are designated for select key reservoirs based on how frequently those reservoirs have April 30 (end of month) storage above or below certain thresholds. These thresholds are different for each reservoir and are set here based on percentiles of recent historical data, but may be adjusted in the future. The scheme described here yields tier designations that will be "1" if storage conditions are more consistently higher than recent historical conditions; "2" if they are roughly equivalent to recent conditions; "3" if they are moderately lower than recent conditions; and "4" if they are consistently and substantially lower than recent conditions',
  GW_STOR:
    "Tier reflects how groundwater storage conditions (total water in the theoretically accessible aquifer system) compares to a reference condition. Groundwater responds slowly (at least compared to surface water systems) and can exhibit long-term upward or downward storage trends. Different scenarios may also exhibit shifts in the magnitude of storage but with a similar trend. The tiers attempt to assign tier designations at the Water Budget Area (WBA) level based on these trend and magnitude characteristics.",
  DELTA_ECO:
    "Tiers reflect ecological responses to flow, measured by direct indicators (submerged aquatic vegetation growth, salinity, turbidity, and microhabitat availability). Indicators are assigned a given score based on average winter/spring flows, and scores are scaled accordingly to accommodate threshold effects and additive impacts from multiple years of wet/dry conditions.",
  FW_EXP:
    "Tier reflects the amount of fresh water exported from the Delta pumps (Banks, Jones) over a 100-year simulation period. For this tier calculation, the volume of water pumped at either pumping location is reduced proportionally by the amount the salinity of that water exceeds 900 uS/cm. Water pumped with salinity greater than 2500 uS/cm is assigned a 0 value. Tiers are defined based on the combined total volume pumped at each pumping location for the 100-year period.",
  FW_DELTA_USES:
    "Tiers reflect the frequency with which water in the western Delta falls into fresh, moderate, or saline categories as an indicator of its suitability for in-Delta uses. Tiers are defined based on the frequency with which two west-Delta salinity stations (Emmaton [EM], Jersey Point [JP]) are below/above three salinity thresholds (measured in microSiemens/cm, uS/cm): **900 uS/cm** low salinity - **1600 uS/cm** moderate - **2500 uS/cm** high",
  WRC_SALMON_AB:
    "Tiers reflect whether the population shows strong growth (Tier 1), moderate growth (Tier 2), little or no change (Tier 3), or experiences population decline (Tier 4).",
}

export const NOD_SOD_DEFINITIONS: Record<NodSodCode, string> = {
  NOD_DW:
    "Tiers reflect the degree of NOD Municipal & Industrial demands satisfied by CalSim demand unit or diversion node",
  SOD_DW:
    "Tiers reflect the degree of SOD Municipal & Industrial demands satisfied by CalSim demand unit or diversion node",
  NOD_AG:
    "Tiers correspond to the impact of water shortages on NOD agricultural production",
  SOD_AG:
    "Tiers correspond to the impact of water shortages on SOD agricultural production",
  NOD_EFLOWS:
    "Tiers reflect the extent to which NOD modeled flows sustain ecological function relative to natural or functional flow targets",
  SOD_EFLOWS:
    "Tiers reflect the extent to which SOD modeled flows sustain ecological function relative to natural or functional flow targets",
  NOD_RES:
    "Tier reflects the degree to which NOD reservoirs fill each spring in advance of the summer delivery season",
  SOD_RES:
    "Tier reflects the degree to which SOD reservoirs fill each spring in advance of the summer delivery season",
  NOD_GW:
    "Tier reflects how NOD groundwater storage conditions compare to a reference condition",
  SOD_GW:
    "Tier reflects how SOD groundwater storage conditions compare to a reference condition",
}

/**
 * Get outcome definition by code (checks both API and NOD/SOD codes).
 */
export function getOutcomeDefinition(code: string): string | undefined {
  return (
    OUTCOME_DEFINITIONS[code as OutcomeCode] ??
    NOD_SOD_DEFINITIONS[code as NodSodCode]
  )
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
      "Near full deliveries in most years, no years with large shortfalls (Definition: **≥ 90%** **of target** met in **≥ 90% of years**, no year with **≤ 70%** **of target** delivered)",
    tier2:
      "Near full deliveries in at least half of years, no years with critical shortfalls (Definition: **≥ 90%** **of target** met in **≥ 50% of years**, no years with **≤ 50%** **of target** delivered)",
    tier3:
      "Near full deliveries in at least half of years, no more than 20 years with critical shortfalls (Definition: **≥ 90%** **of target** met in **≥ 50% of years**, no more than **20% of years** with **< 50%** **of target** delivered)",
    tier4:
      "None of the above criteria met (Either **≥ 90%** **of target** met in **< 50% of years** and/or **≥ 20%** years with **< 50%** **of target** delivered)",
  },
  AG_REV: {
    tier1:
      "**Increased production:** Agricultural production **increases** with respect to today's outcomes",
    tier2:
      "**Minimal impact:** Agricultural production **declines** less than 5% with respect to today's outcomes",
    tier3:
      "**Moderate impact:** Agricultural production **declines** 5%-20% with respect to today's outcomes",
    tier4:
      "**Severe impact:** Agricultural production **declines** more than 20% with respect to today's outcomes",
  },
  ENV_FLOWS: {
    tier1:
      "**Functional Ecosystem** Functional flows to sustain native freshwater species in 90% of years. Must have higher mean daily flows (volume/# days) in spring and winter than summer.",
    tier2:
      "**Modified Functional Flows** Partial functional flows in wet season and spring. Full functional flows in summer in 75% of years. Must have higher mean daily flows (volume/# days) in spring and winter than summer.",
    tier3:
      "**Existing Flow Requirements** CalSim minimum flow constraints for Baseline Scenario in 50% of years",
    tier4: "**No function** none of the above thresholds met",
  },
  RES_STOR: {
    tier1:
      "Reservoir storage is greater than or equal to the **top threshold** for each reservoir for at least **90% of years** (as represented by April values). As of July 2025, this threshold is set at the 50th percentile of recent historical data as available through CDEC.",
    tier2:
      "Reservoir storage is greater than or equal to the **middle threshold** for each reservoir for at least **67% of years** (as represented by April values). As of July 2025, this threshold is set at the 33rd percentile of recent historical data as available through CDEC.",
    tier3:
      "Reservoir storage is greater than or equal to the **middle threshold** for each reservoir for at least **30% of years** (as represented by April values). As of July 2025, this threshold is set at the 33rd percentile of recent historical data as available through CDEC.",
    tier4:
      "Reservoir storage is **not high enough to meet the conditions of Tiers 1-3**. Reservoir storage is below the middle threshold (at or below the lower threshold) for more than 70% of years (as represented by April values). As of July 2025, the lower threshold is set as the 20th percentile of recent historical values.",
  },
  GW_STOR: {
    tier1:
      "The groundwater trend in a WBA is stable or increasing from 1960-2021 and the trend is greater than that in the reference scenario",
    tier2:
      "The groundwater trend in a WBA is stable or increasing but the trend is less than that in the reference scenario",
    tier3:
      "The groundwater trend is **declining** (not stable or increasing as in Tiers 1 or 2) but at a **moderate rate** (fitted linear trend is less negative than -0.015 ft/yr)",
    tier4:
      "Groundwater trends in a WBA are **declining more severely**, at a rate greater than 0.015 ft/year (slope <= -0.015 ft/yr)",
  },
  DELTA_ECO: {
    tier1:
      "Scenario scores in the **top 25%** based on yearly evaluation of ecosystem indicators: low submerged aquatic vegetation (SAV), high turbidity, fresh conditions, and expanded microhabitats in most years",
    tier2:
      "Scenario scores in the **top 50%** based on yearly evaluation of ecosystem indicators: unchanged SAV, high turbidity, fresh conditions, some microhabitats available in most years",
    tier3:
      "Scenario scores in the **top 75%** based on yearly evaluation of ecosystem indicators: unchanged SAV, standard turbidity, moderate salinity, few microhabitats available in most years",
    tier4:
      "None of the above thresholds met: unchanged SAV, low turbidity, moderate to high salinity, few microhabitats available in most years",
  },
  FW_EXP: {
    tier1:
      "Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is **greater than 505 million acre-feet**",
    tier2:
      "Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is **greater than 465 million acre-feet but less than 505 million acre-feet**",
    tier3:
      "Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is **greater than 400 million acre-feet but less than 465 million acre-feet**",
    tier4:
      "Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is **less than 400 million acre-feet.**",
  },
  FW_DELTA_USES: {
    tier1:
      "Maximum of EM and JP is below the low threshold **75%** of all months and max of EM and JP is above the highest threshold no more than **5%** of all months",
    tier2:
      "Maximum of EM and JP is below the low threshold at least **65%** of all months, below the moderate threshold at least **75%** of months, and max of EM and JP is above the highest threshold no more than **12%** of all months",
    tier3:
      "Maximum of EM and JP is below the low threshold at least **55%** of all months, below the moderate threshold at least **65%** of months, and max of EM and JP is above the highest threshold no more than **20%** of all months",
    tier4:
      "Maximum of EM and JP is below the low threshold less than **55%** of all months and/or max of EM and JP is above the highest threshold more than **20%** of all months",
  },
  WRC_SALMON_AB: {
    tier1:
      "Tier 1 is met if there is at least an 80% chance (>800 out of 1,000 model runs) that the salmon population grows 8 times its starting size, using a rolling 3-year average.",
    tier2:
      "Tier 2 is met if there is at least an 80% chance (>800 out of 1,000 model runs) that the salmon population grows 2 to 8 times its starting size, using a rolling 3-year average.",
    tier3:
      "Tier 3 is met if there is at least an 80% chance (>800 out of 1,000 model runs) that the salmon population exceeds its starting size, using a rolling 3-year average.",
    tier4:
      "Tier 4 is assigned if the change in population size does not satisfy Tier 1, 2, or 3.",
  },
}
