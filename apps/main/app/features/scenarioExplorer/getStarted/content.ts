/**
 * getStarted/content
 */

import { type OutcomeCode } from "../../../content/outcomes"

export interface WaterIssueTheme {
  title: string
  description: string
  themeKey: string
  dimmed?: boolean
}

export const WATER_ISSUE_THEMES: ReadonlyArray<WaterIssueTheme> = [
  {
    title: "Community water systems",
    description:
      "Whether people and communities can reliably access safe drinking water for daily life, health, and essential services",
    themeKey: "cws",
  },
  {
    title: "Farms and groundwater",
    description:
      "Whether agricultural water deliveries can sustain food production, while preventing over-draft of groundwater basins",
    themeKey: "ag_gw",
  },
  {
    title: "Rivers, salmon and the Delta ecosystem",
    description:
      "Whether rivers, salmon, and the Delta estuary receive the flows they need to thrive",
    themeKey: "eco",
  },
  {
    title: "The Delta as a living place",
    description:
      "Whether the Delta is a place where communities, farms, and ecosystems coexist and thrive",
    themeKey: "delta",
  },
  {
    title: "Operations and impacts",
    description:
      "How management decisions affect trade-offs, equity and resilience",
    themeKey: "governance",
    dimmed: true,
  },
] as const

export interface HydroclimateFuture {
  title: string
  description: string
  dimmed?: boolean
}

export const HYDROCLIMATES: ReadonlyArray<HydroclimateFuture> = [
  {
    title: "Historical hydroclimate (baseline)",
    description:
      "Temperature, precipitation, and streamflow patterns reflect historical conditions",
  },
  {
    title: "Moderate-dry climate risk",
    description:
      "Warmer and slightly drier conditions (\u22121% runoff change) - 50th percentile level of concern",
  },
  {
    title: "Moderate-wet climate risk",
    description:
      "Warmer and wetter conditions (+7% runoff change) - 44th percentile level of concern",
    dimmed: true,
  },
  {
    title: "High climate risk",
    description:
      "Warmer and much drier conditions (\u22127% runoff change) - 95th percentile level of concern",
  },
  {
    title: "Extreme climate risk",
    description:
      "Much warmer and extremely drier conditions (\u221221% runoff change) - 99th percentile level of concern",
    dimmed: true,
  },
] as const

export interface KeyOutcome {
  outcomeCode: OutcomeCode
  title: string
  description: string
}

export const KEY_OUTCOMES: ReadonlyArray<KeyOutcome> = [
  {
    outcomeCode: "CWS_DEL",
    title: "Community water deliveries",
    description:
      "Reliability of water supplies to communities to satisfy essential drinking water needs",
  },
  {
    outcomeCode: "AG_REV",
    title: "Agricultural revenue",
    description:
      "Economic productivity of agricultural crops based on water availability",
  },
  {
    outcomeCode: "ENV_FLOWS",
    title: "Environmental flows",
    description:
      "Seasonal patterns of river flows needed to support healthy ecosystems",
  },
  {
    outcomeCode: "DELTA_ECO",
    title: "Delta estuary ecology",
    description:
      "Seasonal patterns of flows needed to support the health of the Bay Delta estuary",
  },
  {
    outcomeCode: "WRC_SALMON_AB",
    title: "Winter-run salmon",
    description:
      "Population status of Sacramento River winter-run Chinook salmon",
  },
  {
    outcomeCode: "FW_DELTA_USES",
    title: "Freshwater for in-Delta uses",
    description:
      "Availability of freshwater in the Delta to support local communities and farms",
  },
  {
    outcomeCode: "FW_EXP",
    title: "Freshwater for Delta exports",
    description: "Availability of freshwater for export to other regions",
  },
  {
    outcomeCode: "RES_STOR",
    title: "Reservoir storage",
    description: "Levels of water stored in major reservoirs",
  },
  {
    outcomeCode: "GW_STOR",
    title: "Groundwater storage",
    description: "Amount and trends of water stored in groundwater basins",
  },
] as const

export interface InterpretingLens {
  label: string
  description: string
}

export const INTERPRETING_LENSES: ReadonlyArray<InterpretingLens> = [
  {
    label: "Trade-offs",
    description:
      "How outcomes improve or decline together across scenarios",
  },
  {
    label: "Equity",
    description:
      "How benefits and impacts are distributed across outcomes and locations of interest",
  },
  {
    label: "Resilience",
    description:
      "How outcomes change under increasing levels of climate stress",
  },
] as const

export interface VizTool {
  title: string
  description: string
  dimmed?: boolean
}

export const VIZ_TOOLS: ReadonlyArray<VizTool> = [
  {
    title: "Map view",
    description:
      "Displays how outcomes vary across locations of interest and reveals spatial patterns in outcomes.",
  },
  {
    title: "Distribution viewer",
    description:
      "Highlights how outcomes vary across key outcomes and among different locations of interest and communities, revealing who benefits and who is most impacted.",
  },
  {
    title: "Radar chart",
    description:
      "Shows how outcomes vary within a scenario and enables comparisons across scenarios, highlighting commonalities, differences, and trade-offs.",
  },
  {
    title: "Scatterplot",
    description:
      "Compares scenarios at the system level to reveal the relative effects of operational decisions and climate change on outcomes.",
    dimmed: true,
  },
  {
    title: "Heatmaps",
    description:
      "Show how scenarios perform across increasing levels of climate stress, highlighting which management strategies are most resilient or vulnerable to climate impacts.",
  },
] as const

export interface ScenarioQuestion {
  title: string
  description: string
}

export const SCENARIO_QUESTIONS: ReadonlyArray<ScenarioQuestion> = [
  {
    title: "How is my water interest doing now?",
    description:
      "This is the current operations scenario under the historical hydroclimate, which serves as a baseline for comparison.",
  },
  {
    title: "How could alternative strategies impact my water interest?",
    description:
      "Select one or more scenarios to compare against the current operations scenario under the historical hydroclimate.",
  },
  {
    title: "How does climate change shift the picture?",
    description:
      "Select scenarios that represent how current operations and alternative strategies perform under alternative hydroclimates.",
  },
] as const

export const CAVEATS: ReadonlyArray<string> = [
  "All scenarios are created by CalSim3, a water planning tool to guide operations of California\u2019s water supply system in the Central Valley.",
  "The scenarios do not include all regions of California nor certain aspects of our water system that may be of interest.",
  "Key outcomes summarize scenario results over a 100-year period. Annual variation in outcomes can be explored with the DATA IN DEPTH view and in the GET DATA section.",
  "The hydroclimates used in scenarios approximate the range of historical and potential future conditions that our system may experience. They do not represent historical observations or predicted future conditions according to climate models.",
  "Estimates of water deliveries to locations of interest with small water demands may be less reliable than delivery estimates for water users that receive larger volumes.",
  "The outcomes of CalSim scenarios are best interpreted in a comparative manner \u2014 evaluating how outcomes change relative to current operations (as a baseline) is more appropriate than assessing the specific outcomes of any particular scenario.",
] as const
