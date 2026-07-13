/**
 * Outcome content - outcome definitions and display names
 *
 * Short codes are the identifier.
 * Pass codes through components/state, look up display names at render time.
 */

// =============================================================================
// OUTCOME CODES AND NAMES
// =============================================================================

/**
 * Canonical mapping from API short codes to UI display names.
 * This is the source of truth for outcome names.
 */
export const OUTCOME_NAMES = {
  CWS_DEL: "Community surface water",
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
    "Tiers reflect the extent to which surface water deliveries to cities and towns satisfy associated drinking water demands. Water deliveries are evaluated relative to estimated recent potable water demands for these deliveries at 74 locations of interest.",
  AG_REV:
    "Tiers reflect how average agricultural revenue changes in response to water delivery and groundwater shortages. Revenues are estimated at 134 agricultural water districts and evaluated relative to revenues if no supply shortages occur.",
  ENV_FLOWS:
    "Tiers reflect the extent to which river flows are of sufficient magnitude across seasons and year-to-year to support healthy riverine ecosystems, evaluated at 17 locations on the Sacramento and San Joaquin Rivers and their major tributaries.",
  RES_STOR:
    'Tier reflects the degree to which a reservoir fills each spring in advance of the summer delivery season (Apr-Oct) during which reservoirs provide water to irrigators and communities. Tiers are designated for select key reservoirs based on how frequently those reservoirs have April 30 (end of month) storage above or below certain thresholds. These thresholds are different for each reservoir and are set here based on percentiles of recent historical data, but may be adjusted in the future. The scheme described here yields tier designations that will be "1" if storage conditions are more consistently higher than recent historical conditions; "2" if they are roughly equivalent to recent conditions; "3" if they are moderately lower than recent conditions; and "4" if they are consistently and substantially lower than recent conditions',
  GW_STOR:
    "Tier reflects how groundwater storage conditions (total water in the theoretically accessible aquifer system) compares to a reference condition. Groundwater responds slowly (at least compared to surface water systems) and can exhibit long-term upward or downward storage trends. Different scenarios may also exhibit shifts in the magnitude of storage but with a similar trend. The tiers attempt to assign tier designations at the Water Budget Area (WBA) level based on these trend and magnitude characteristics.",
  DELTA_ECO:
    "Tiers reflect the extent to which winter and spring outflows from the Sacramento-San Joaquin River Delta through the estuary support beneficial ecological responses, assessed by growth of submerged aquatic vegetation, salinity, turbidity, and microhabitat availability.",
  FW_EXP:
    "Tier reflects the amount of fresh water exported from the Delta pumps (Banks, Jones) over a 100-year simulation period. For this tier calculation, the volume of water pumped at either pumping location is reduced proportionally by the amount the salinity of that water exceeds 900 uS/cm. Water pumped with salinity greater than 2500 uS/cm is assigned a 0 value. Tiers are defined based on the combined total volume pumped at each pumping location for the 100-year period.",
  FW_DELTA_USES:
    "Tiers reflect the frequency with which water in the western Delta falls into fresh, moderate, or saline categories as an indicator of its suitability for in-Delta uses. Tiers are defined based on the frequency with which two west-Delta salinity stations (Emmaton [EM], Jersey Point [JP]) are below/above three salinity thresholds (measured in microSiemens/cm, uS/cm): **900 uS/cm** low salinity - **1600 uS/cm** moderate - **2500 uS/cm** high",
  WRC_SALMON_AB:
    "Tiers reflect condition of the endangered Sacramento River winter-run Chinook salmon population, assessed by a life cycle model. Population condition is assessed by the proportion of spawning habitat potentially utilized by natural-origin adult females over a 3-year rolling average.",
}

export const OUTCOME_FOOTER_DEFINITIONS: Record<OutcomeCode, string> = {
  CWS_DEL:
    "Only surface water deliveries from the State Water Project and Central Valley Project are evaluated. Other water sources, including groundwater and other surface water supplies, are not considered. Thus the outcome metric does not indicate the ability of a community water system or wholesale distributor to provide reliable water supplies to its customers. Deliveries are estimated relative to potable drinking water demands only and do not include other municipal and industrial uses, such as aquifer storage and recovery. For more information, see technical documentation on **Data** page.",
  AG_REV:
    "For more information, see technical documentation on **Data** page.",
  ENV_FLOWS:
    "For more information, see technical documentation on **Data** page.",
  RES_STOR:
    "",
  GW_STOR:
    "",
  DELTA_ECO:
    "For more information, see technical documentation on **Data** page.",
  FW_EXP:
    "",
  FW_DELTA_USES:
    "",
  WRC_SALMON_AB:
    "The lowest outcome level corresponds to approximately 3,000 total returning female spawners. Below this level, changes in commercial harvest practices are required to mitigate impacts to the population. For more information, see technical documentation on **Data** page.",
}

export const NOD_SOD_DEFINITIONS: Record<NodSodCode, string> = {
  NOD_DW:
    "Tiers reflect the extent to which NOD surface water deliveries to cities and towns satisfy associated drinking water demands.",
  SOD_DW:
    "Tiers reflect the extent to which SOD surface water deliveries to cities and towns satisfy associated drinking water demands.",
  NOD_AG:
    "Tiers reflect how average NOD agricultural revenue changes in response to water delivery and groundwater shortages. Revenues are estimated at 134 agricultural water districts and evaluated relative to revenues if no supply shortages occur.",
  SOD_AG:
    "Tiers reflect how average SOD agricultural revenue changes in response to water delivery and groundwater shortages. Revenues are estimated at 134 agricultural water districts and evaluated relative to revenues if no supply shortages occur.",
  NOD_EFLOWS:
    "Tiers reflect the extent to which winter and spring NOD outflows from the Sacramento-San Joaquin River Delta through the estuary support beneficial ecological responses, assessed by growth of submerged aquatic vegetation, salinity, turbidity, and microhabitat availability.",
  SOD_EFLOWS:
    "Tiers reflect the extent to which winter and spring SOD outflows from the Sacramento-San Joaquin River Delta through the estuary support beneficial ecological responses, assessed by growth of submerged aquatic vegetation, salinity, turbidity, and microhabitat availability.",
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
      "Surface water deliveries satisfy associated drinking water demands in nearly all years, with no years with significant shortfalls (**> 90%** of drinking water demand satisfied in **≥ 90%** of years, with no shortfall years **< 70%** of demand).",
    tier2:
      "Surface water deliveries satisfy associated drinking water demands in majority of years, with no years with critical shortfalls (**> 90%** of drinking water demand satisfied in **≥ 50%** of years, with no shortfall years **< 50%** of demand).",
    tier3:
      "Surface water deliveries satisfy associated drinking water demands in majority of years, with some years with critical shortfalls (**> 90%** of drinking water demand satisfied in **≥ 50%** of years, with no more than **20%** of shortfall years **< 50%** of demand).",
    tier4:
      "None of the above criteria met (**> 90%** of estimated potable demand met in **< 50%** of years and/or **> 20%** of years in which **50%** of demand is not satisfied).",
  },
  AG_REV: {
    tier1:
      "Agricultural revenue increases (**≥ 0%**).",
    tier2:
      "Agricultural revenue declines **< 5%**.",
    tier3:
      "Agricultural revenue declines between **5% and 20%**.",
    tier4:
      "Agricultural revenue declines **> 20%**.",
  },
  ENV_FLOWS: {
    tier1:
      "Flows meet or exceed all seasonal functional flow targets in at least **95%** of years.",
    tier2:
      "Flows meet or exceed all seasonal functional flow targets set for dry years in at least **90%** of years.",
    tier3:
      "Flows meet or exceed functional flow targets for wet and dry season baseflows in dry years in at least **90%** of years",
    tier4: "None of the above criteria are satisfied.",
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
      "Flows support ecological indicators in best possible conditions (low SAV, high turbidity, seasonally fresh conditions, expanded microhabitats in most years, representing **upper 25%** of indicator values).",
    tier2:
      "Flows support ecological indicators in moderate conditions (moderate SAV, high turbidity, seasonally fresh conditions, some microhabitats available in most years, representing **25-50%** of indicator values).",
    tier3:
      "Flows support ecological indicators in poor conditions (moderate SAV, moderate turbidity, moderate salinity, few microhabitats available in most years, representing **lower 50%-75%** of indicator values).",
    tier4:
      "Flows are insufficient to maintain beneficial ecological processes (moderate SAV, low turbidity, moderate to high salinity, few microhabitats available in most years, representing **lowest 25%** of indicator values).",
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
      "There is at least an **80%** chance that greater than **50%** of maximum available spawning habitat is utilized.",
    tier2:
      "There is at least an **80%** chance that between **18 and 50%** of maximum available spawning habitat is utilized.",
    tier3:
      "There is at least an **80%** chance that between **6 and 18%** of maximum available spawning habitat is utilized.",
    tier4:
      "There is at least an **80%** chance that less than **6%** of maximum available spawning habitat is utilized.",
  },
}
