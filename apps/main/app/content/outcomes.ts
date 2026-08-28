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

/**
 * Two-line breaks for chart axis labels. Keyed off OUTCOME_NAMES/NOD_SOD_NAMES
 * values (not typed-out strings) so a rename in either map can't silently
 * orphan an entry here the way "Community deliveries" → "Community surface
 * water" did.
 */
export const OUTCOME_LABEL_BREAKS: Record<string, [string, string]> = {
  [OUTCOME_NAMES.CWS_DEL]: ["Community", "surface water"],
  [OUTCOME_NAMES.AG_REV]: ["Agricultural", "revenue"],
  [OUTCOME_NAMES.ENV_FLOWS]: ["Environmental", "flows"],
  [OUTCOME_NAMES.RES_STOR]: ["Reservoir", "storage"],
  [OUTCOME_NAMES.GW_STOR]: ["Groundwater", "storage"],
  [OUTCOME_NAMES.DELTA_ECO]: ["Delta estuary", "ecology"],
  [OUTCOME_NAMES.FW_EXP]: ["Freshwater for", "Delta exports"],
  [OUTCOME_NAMES.FW_DELTA_USES]: ["Freshwater for", "in-Delta uses"],
  [OUTCOME_NAMES.WRC_SALMON_AB]: ["Winter-run", "salmon"],
  [NOD_SOD_NAMES.NOD_DW]: ["NOD:", "Community deliveries"],
  [NOD_SOD_NAMES.SOD_DW]: ["SOD:", "Community deliveries"],
  [NOD_SOD_NAMES.NOD_AG]: ["NOD:", "Agricultural revenue"],
  [NOD_SOD_NAMES.SOD_AG]: ["SOD:", "Agricultural revenue"],
  [NOD_SOD_NAMES.NOD_EFLOWS]: ["NOD:", "Environmental flows"],
  [NOD_SOD_NAMES.SOD_EFLOWS]: ["SOD:", "Environmental flows"],
  [NOD_SOD_NAMES.NOD_RES]: ["NOD:", "Reservoir storage"],
  [NOD_SOD_NAMES.SOD_RES]: ["SOD:", "Reservoir storage"],
  [NOD_SOD_NAMES.NOD_GW]: ["NOD:", "Groundwater storage"],
  [NOD_SOD_NAMES.SOD_GW]: ["SOD:", "Groundwater storage"],
}

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
    "The extent to which surface water deliveries to cities and towns satisfy associated drinking water demands. Water deliveries are evaluated relative to independent estimates of recent potable water demands at each of 74 locations of interest.",
  AG_REV:
    "How average agricultural revenue changes in response to water delivery and groundwater shortages. Revenues are estimated at 134 agricultural water districts and evaluated relative to revenues if no supply shortages occur.",
  ENV_FLOWS:
    "The extent to which river flows are of sufficient magnitude across seasons and years to support healthy riverine ecosystems, evaluated at 17 locations on the Sacramento and San Joaquin Rivers and their major tributaries.",
  RES_STOR:
    "How full reservoirs are on April 30, which is an important benchmark for the amount of water available for delivery in the dry season (April – October). Reservoir storage outcomes are assessed in seven large reservoirs in the Central Valley.",
  GW_STOR:
    "Trends in groundwater storage, relative to 1960 – 2021 historical conditions. Groundwater storage outcomes are assessed in 42 groundwater basins in the Central Valley.",
  DELTA_ECO:
    "The extent to which winter and spring outflows from the Sacramento-San Joaquin River Delta through the estuary support beneficial ecological responses, assessed by growth of submerged aquatic vegetation (SAV), salinity, turbidity, and microhabitat availability.",
  FW_EXP:
    "The amount of freshwater exported from the Delta (Banks and Jones pumping plants), with volumes reduced if salinity exceeds water quality requirements for drinking water or irrigation needs.",
  FW_DELTA_USES:
    "How often water in the Delta is fresh enough for in-Delta community and agricultural uses, assessed at two compliance locations (Jersey Point and Emmaton) in the western Delta.",
  WRC_SALMON_AB:
    "The condition of the endangered Sacramento River winter-run Chinook salmon population, assessed by a life cycle model. Population condition is assessed by the proportion of spawning habitat potentially utilized by natural-origin adult females over a 3-year rolling average.",
}

/**
 * Outcome-specific caveat shown before the shared "see technical
 * documentation" footer (that sentence is rendered once, in
 * TierTooltipContent). Only outcomes with extra context to add need an
 * entry here.
 */
export const OUTCOME_FOOTER_PREFIXES: Partial<Record<OutcomeCode, string>> = {
  CWS_DEL:
    "Only surface water deliveries from the State Water Project and Central Valley Project are evaluated. Other water sources, including groundwater and other surface water supplies, are not considered. Thus the outcome metric does not indicate the ability of a community water system or wholesale distributor to provide reliable water supplies to its customers. Deliveries are estimated relative to potable drinking water demands only and do not include other municipal and industrial uses, such as aquifer storage and recovery.",
  WRC_SALMON_AB:
    "The lowest outcome level corresponds to approximately 3,000 total returning female spawners. Below this level, changes in commercial harvest practices are required to mitigate impacts to the population.",
  RES_STOR:
    "Note that the Central Valley Project and State Water Project portions of San Luis Reservoir are evaluated separately.",
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
    "Tier reflects how full NOD reservoirs are on April 30, which is an important benchmark for the amount of water available for delivery in the dry season (April – October). Reservoir storage outcomes are assessed in seven large reservoirs in the Central Valley.",
  SOD_RES:
    "Tier reflects how full SOD reservoirs are on April 30, which is an important benchmark for the amount of water available for delivery in the dry season (April – October). Reservoir storage outcomes are assessed in seven large reservoirs in the Central Valley.",
  NOD_GW:
    "Tier reflects trends in NOD groundwater storage, relative to 1960 – 2021 historical conditions. Groundwater storage outcomes are assessed in 42 groundwater basins in the Central Valley.",
  SOD_GW:
    "Tier reflects trends in SOD groundwater storage, relative to 1960 – 2021 historical conditions. Groundwater storage outcomes are assessed in 42 groundwater basins in the Central Valley.",
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
      "Optimal: Surface water deliveries satisfy associated drinking water demands in nearly all years, with no years with significant shortfalls (**> 90%** of drinking water demand satisfied in **≥ 90%** of years, with no shortfall years **< 70%** of demand).",
    tier2:
      "Acceptable: Surface water deliveries satisfy associated drinking water demands in majority of years, with no years with critical shortfalls (**> 90%** of drinking water demand satisfied in **≥ 50%** of years, with no shortfall years **< 50%** of demand).",
    tier3:
      "At-risk: Surface water deliveries satisfy associated drinking water demands in majority of years, with some years with critical shortfalls (**> 90%** of drinking water demand satisfied in **≥ 50%** of years, with no more than **20%** of shortfall years **< 50%** of demand).",
    tier4:
      "Critical: None of the above criteria met (**> 90%** of estimated potable demand met in **< 50%** of years and/or **> 20%** of years in which **50%** of demand is not satisfied).",
  },
  AG_REV: {
    tier1: "Optimal: Agricultural revenue increases (**≥ 0%**).",
    tier2: "Acceptable: Agricultural revenue declines **< 5%**.",
    tier3: "At-risk: Agricultural revenue declines between **5% and 20%**.",
    tier4: "Critical: Agricultural revenue declines **> 20%**.",
  },
  ENV_FLOWS: {
    tier1:
      "Optimal: Flows meet or exceed all seasonal functional flow targets in at least **95%** of years.",
    tier2:
      "Acceptable: Flows meet or exceed all seasonal functional flow targets set for dry years in at least **90%** of years.",
    tier3:
      "At-risk: Flows meet or exceed functional flow targets for wet and dry season baseflows in dry years in at least **90%** of years",
    tier4: "Critical: None of the above criteria are satisfied.",
  },
  RES_STOR: {
    tier1:
      "Optimal: Reservoir storage is frequently high (In more than 9 out of 10 years, end-of-April reservoir storage is greater than the long-term median value).",
    tier2:
      "Acceptable: Reservoir storage is similar to recent history (In more than two out of three years, end-of-April storage exceeds the **33rd** percentile of long-term values).",
    tier3:
      "At-risk: Reservoir storage is slightly lower than recent history (In more than three out of ten years, end-of-April storage exceeds the **33rd** percentile of long-term values).",
    tier4:
      "Critical: Reservoir storage is much lower than recent history (In fewer than three out of ten years, end-of-April storage exceeds the **33rd** percentile of long-term values).",
  },
  GW_STOR: {
    tier1:
      "Optimal: Groundwater trend is stable or increasing and is greater than the historical trend.",
    tier2:
      "Acceptable: Groundwater trend is stable or increasing but is less than the historical trend.",
    tier3: "At-risk: Groundwater trend is declining at a moderate rate.",
    tier4: "Critical: Groundwater trend is declining at a rapid rate.",
  },
  DELTA_ECO: {
    tier1:
      "Optimal: Flows support ecological indicators in best possible conditions (low SAV, high turbidity, seasonally fresh conditions, expanded microhabitats in most years, representing **upper 25%** of indicator values).",
    tier2:
      "Acceptable: Flows support ecological indicators in moderate conditions (moderate SAV, high turbidity, seasonally fresh conditions, some microhabitats available in most years, representing **25-50%** of indicator values).",
    tier3:
      "At-risk: Flows support ecological indicators in poor conditions (moderate SAV, moderate turbidity, moderate salinity, few microhabitats available in most years, representing **lower 50%-75%** of indicator values).",
    tier4:
      "Critical: Flows are insufficient to maintain beneficial ecological processes (moderate SAV, low turbidity, moderate to high salinity, few microhabitats available in most years, representing **lowest 25%** of indicator values).",
  },
  FW_EXP: {
    tier1:
      "Optimal: Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is **> 505 million acre-feet**.",
    tier2:
      "Acceptable: Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is **> 465 million acre-feet but <= 505 million acre-feet**",
    tier3:
      "At-risk: Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is **> 400 million acre-feet but <= 465 million acre-feet**",
    tier4:
      "Critical: Total combined salinity-penalized export volume pumped at Banks and Jones pumping plants is **< 400 million acre-feet.**",
  },
  FW_DELTA_USES: {
    tier1:
      "Optimal: Water is fresh enough for human use with no restrictions in ≥ **75%** of all months, and unusable in ≤ **5%** of all months.",
    tier2:
      "Acceptable: Water is fresh enough for human use with no restrictions in ≥ **65%** of all months, fresh enough for human use with some treatment or cropping adjustments in ≥ **75%** of months, and unusable in ≤ **12%** of all months.",
    tier3:
      "At-risk: Water is fresh enough for human use with no restrictions in ≥ **55%** of all months, fresh enough for human use with some treatment or cropping adjustments in ≥ **65%** of months, and unusable in ≤ **20%** of all months.",
    tier4:
      "Critical: Water is fresh enough for human use with no restrictions in ≤ **55%** of all months and/or is unusable in ≥ **20%** of all months.",
  },
  WRC_SALMON_AB: {
    tier1:
      "Optimal: There is ≥ **80%** chance that > **50%** of maximum available spawning habitat is utilized.",
    tier2:
      "Acceptable: There is ≥ **80%** chance that between **18% and 50%** of maximum available spawning habitat is utilized.",
    tier3:
      "At-risk: There is ≥ **80%** chance that between **6% and 18%** of maximum available spawning habitat is utilized.",
    tier4:
      "Critical: There is ≥ **80%** chance that < **6%** of maximum available spawning habitat is utilized.",
  },
}
