import { OUTCOME_DISPLAY_ORDER } from "../features/scenarios/hooks"

export type Outcome = (typeof OUTCOME_DISPLAY_ORDER)[number]

/**
 * Outcome definitions
 * Maps outcome display names to their descriptions.
 * These definitions are also in the database. The thinking is that we want to
 * allow frontend developers to modify the definitions without having to wait
 * for a database update. TODO: re-evaluate this usage once project nears end.
 */
export const OUTCOME_DEFINITIONS: Record<string, string> = {
  "Community deliveries":
    "This chart reflects how much municipal & industrial water deliveries satisfy the demands of each region, under current plans and assumptions.",
  "Agricultural revenue":
    "How average agricultural revenue changes in response to water deliveries. Revenues are estimated at 134 agricultural water districts and evaluated relative to historical values.",
  "Environmental flows":
    "Extent to which river flows are of sufficient magnitude across seasons and year-to-year to support healthy riverine ecosystems, evaluated at 17 locations on the Sacramento and San Joaquin Rivers and their major tributaries.",
  "Delta estuary ecology":
    "Extent to which seasonal outflows from the Sacramento-San Joaquin River Delta through the estuary support beneficial ecological responses. More high-flow years in a row generally support more suitable habitat for native species in the Delta.",
  "Freshwater for Delta exports":
    "How often salinity meets or exceeds water quality requirements for exporting water for drinking water or irrigation needs, assessed at the Banks and Jones pumping plants.",
  "Freshwater for in-Delta uses":
    "How often water in the Delta is fresh enough for in-Delta uses, assessed at two compliance locations in the western Delta.",
  "Reservoir storage":
    "How full reservoirs are on April 30, which is an important benchmark for the amount of water available for delivery in the dry season (April – October). Reservoir storage outcomes are assessed in XX large reservoirs.",
  "Groundwater storage":
    "Trends in groundwater storage, relative to 1960 – 2021 historical conditions. Groundwater storage outcomes are assessed in XX groundwater basins in the Central Valley.",
  "Salmon abundance":
    "Change in population trend for endangered Sacramento River winter-run Chinook salmon.",
}

// Async version for backwards compatibility (wraps the constant)
// TODO: Re-enable database fetch when ready
export async function getOutcomeDefinitions(): Promise<Record<string, string>> {
  return OUTCOME_DEFINITIONS
}

// For backwards compatibility, export the function result
// TODO: use React Query or SWR to call getOutcomeDefinitions()
export const outcomeDefinitions = getOutcomeDefinitions()

// Tier value definitions for each outcome
export const outcomeTierValues: Record<
  string,
  { tier1: string; tier2: string; tier3: string; tier4: string }
> = {
  "Community deliveries": {
    tier1: "Optimal: Water deliveries reduced by less than 10% of planned",
    tier2: "Sub-optimal: Water deliveries reduced by less than 20% of planned",
    tier3: "At-risk: Water deliveries reduced by less than 30% of planned",
    tier4: "Critical: Water deliveries reduced by more than 30% of planned",
  },
  "Agricultural revenue": {
    tier1: "Optimal: Agricultural revenue remains stable or increase",
    tier2: "Sub-optimal: Agricultural revenue declines less than 5%",
    tier3: "At-risk: Agricultural revenue declines between 5% and 20%",
    tier4: "Critical: Agricultural revenue decreases more than 20%",
  },
  "Environmental flows": {
    tier1:
      "Optimal: Flows exhibit sufficient magnitude and variation in 90% of years",
    tier2:
      "Sub-optimal: Flows in the wet season and spring are below target ranges, but flows in the dry season are sufficient in 90% of years.",
    tier3:
      "At-risk: Seasonal flow targets are not achieved in wet season, spring, or dry season, but existing regulatory minimum flows are met in 90% of years.",
    tier4:
      "Critical: Minimum flow requirements are met in fewer than 90% of years.",
  },
  "Delta estuary ecology": {
    tier1:
      "Optimal: Scores in top 25% of healthy flows compared to historical record",
    tier2:
      "Sub-optimal: Scores in top 50% of healthy flows compared to historical record",
    tier3:
      "At-risk: Scores in top 75% of healthy flows compared to historical record",
    tier4: "Critical: Doesn't meet any of the above thresholds",
  },
  "Freshwater for Delta exports": {
    tier1:
      "Optimal: Average salinity at pumping plants meets water quality standards for drinking and irrigation year round in 95% of years",
    tier2:
      "Sub-optimal: Average salinity at pumping plants remains suitable for drinking and irrigation (but with potential need for extra treatment) for at least 10 months per year in 95% of years",
    tier3:
      "At-risk: Average salinity at pumping plants is unsuitable for drinking and irrigation for 2 months in any year, in more than 5% of years at either site",
    tier4:
      "Critical: Average salinity at pumping plants is unsuitable for irrigation or drinking water for **more than two months in any year**",
  },
  "Freshwater for in-Delta uses": {
    tier1:
      "Optimal: Water is fresh enough for human use with no restrictions in at least 75% of all months, and unusable no more than in 5% of all months.",
    tier2:
      "Sub-optimal: Water is fresh enough for human use with no restrictions in at least 65% of all months, fresh enough for human use with some treatment or cropping adjustments in at least 75% of months, and unusable in no more than 12% of all months.",
    tier3:
      "At-risk: Water is fresh enough for human use with no restrictions in at least 55% of all months, fresh enough for human use with some treatment or cropping adjustments in at least 65% of months, and unusable in no more than 20% of all months.",
    tier4:
      "Critical: Water is fresh enough for human use with no restrictions in less than 55% of all months and/or is unusable in more than 20% of all months.",
  },
  "Reservoir storage": {
    tier1:
      "Optimal: Reservoir storage is frequently high. There is a 90% chance that end-of-April reservoir storage is greater than the long-term median value",
    tier2:
      "Sub-optimal: Reservoir storage is lower, but similar to recent history. In two out of three years (66%), end-of-April storage exceeds the **33rd percentile** of long-term values",
    tier3:
      "At-risk: Reservoir storage is slightly lower than recent history. In three out of ten years (30%), end-of-April storage exceeds the **33rd percentile** of long-term values",
    tier4:
      "Critical: Reservoir storage is much lower than recent history. In fewer than three out of ten years (30%), end-of-April storage exceeds the **33rd percentile** of long-term values",
  },
  "Groundwater storage": {
    tier1:
      "Optimal: Groundwater trend is **stable or increasing** and average total storage is **greater than historical**.",
    tier2:
      "At-risk: Groundwater trend is **stable or increasing** and average total storage is **less than historical**.",
    tier3:
      "Compromised: Groundwater trend is **declining at a moderate rate**.",
    tier4: "Critical: Groundwater trend is **declining at a rapid rate**.",
  },
  "Salmon abundance": {
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
