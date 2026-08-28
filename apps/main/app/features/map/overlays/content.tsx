/**
 * getStarted/content
 */

import React from "react"
import { type OutcomeCode } from "../../../content/outcomes"
import { GlossaryTermLink } from "../../glossary"

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
  description: string
}

export const KEY_OUTCOMES: ReadonlyArray<KeyOutcome> = [
  {
    outcomeCode: "CWS_DEL",
    description:
      "Reliability of surface water deliveries to communities to satisfy existing potable demands",
  },
  {
    outcomeCode: "AG_REV",
    description:
      "Economic productivity of agricultural crops based on water availability",
  },
  {
    outcomeCode: "ENV_FLOWS",
    description:
      "Seasonal patterns of river flows needed to support healthy ecosystems",
  },
  {
    outcomeCode: "DELTA_ECO",
    description:
      "Seasonal patterns of flows needed to support the health of the Bay Delta estuary",
  },
  {
    outcomeCode: "WRC_SALMON_AB",
    description:
      "Population status of Sacramento River winter-run Chinook salmon",
  },
  {
    outcomeCode: "FW_DELTA_USES",
    description:
      "Availability of freshwater in the Delta to support local communities and farms",
  },
  {
    outcomeCode: "FW_EXP",
    description:
      "Volume of availability of freshwater for export to other regions",
  },
  {
    outcomeCode: "RES_STOR",
    description: "Levels of water stored in major reservoirs",
  },
  {
    outcomeCode: "GW_STOR",
    description: "Amount and trends of water stored in groundwater basins",
  },
] as const

export interface InterpretingLens {
  label: string
  description: React.ReactNode
}

export const INTERPRETING_LENSES: ReadonlyArray<InterpretingLens> = [
  {
    label: "Trade-offs",
    description: (
      <>
        How outcomes improve or decline together across{" "}
        <GlossaryTermLink term="Scenario">scenarios</GlossaryTermLink>
      </>
    ),
  },
  {
    label: "Equity",
    description: (
      <>
        How benefits and impacts are distributed across outcomes and{" "}
        <GlossaryTermLink term="Location of interest">
          locations of interest
        </GlossaryTermLink>
      </>
    ),
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
    title: "Bar chart",
    description:
      "Summarizes how outcomes vary within and across key outcomes for a selected scenario.",
  },
  {
    title: "Radar chart",
    description:
      "Shows how outcomes vary within a scenario and enables comparisons across scenarios to highlight commonalities, differences, and trade-offs.",
  },
  {
    title: "Distribution view",
    description:
      "Shows how outcomes vary among different locations of interest, including rivers, communities, and farms to reveal who benefits and who is most impacted.",
  },
  {
    title: "Heatmap",
    description:
      "Shows how scenarios perform under increasing levels of climate stress, to highlight which management strategies are more resilient or vulnerable to climate impacts.",
  },
  {
    title: "Map",
    description:
      "Displays how outcomes vary across locations of interest and to reveal spatial patterns.",
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
      "Select the current operations scenario and identify the location(s) in which you are most interested. Determine the outcome level for that location of interest under the historical hydroclimate.",
  },
  {
    title:
      "How could alternative management strategies impact my water interest?",
    description:
      "Select one or more scenarios to compare against current operations. Assess if and how outcome levels changed for your location(s) of interest.",
  },
  {
    title: "How does climate change shift the picture?",
    description:
      "Select scenarios that represent current operations and alternative management strategies under different hydroclimates. Consider how outcomes change with increasing levels of climate stress.",
  },
] as const

export const CAVEATS: ReadonlyArray<React.ReactNode> = [
  "All scenarios are created by CalSim3, a water planning tool to guide operations of California\u2019s water supply system in the Central Valley.",
  "The scenarios do not include all regions of California nor do they represent all uses of water within the CalSim3 model area.",
  "COEQWAL scenario library represents a wide range of management strategies and hydroclimates, but not all possibilities.",
  <>
    Key outcomes summarize results of CalSim3 scenarios, which are run over a
    100-year period, into a single value for each{" "}
    <GlossaryTermLink>location of interest</GlossaryTermLink>. Annual variation
    in outcomes can be explored in the DATA IN DEPTH view and in the DATA page.
  </>,
  "Land use is specified in a static configuration in all scenarios. Land use does not dynamically change over the simulation period in response to changes in surface water or groundwater availability.",
  "All hydroclimates use a historical 1922–2021 weather sequence, adjusted to account for recent climate change (for the historical hydroclimate) and adjusted to account for possible climate conditions the state may experience by 2043 (for all future hydroclimates). They do not specifically represent historical observations or predicted future conditions according to climate models.",
  "Estimates of water deliveries to locations of interest with small water demands may be less reliable than deliveries to water users that receive large volumes.",
  "The outcomes of CalSim3 are best interpreted in a comparative manner – evaluating how outcomes change relative to current operations (as a baseline) is more appropriate than assessing the specific outcomes of any particular scenario.",
  "COEQWAL scenarios are exploratory model runs and are not intended for direct use in legal or regulatory proceedings. Visit ABOUT US to learn how COEQWAL scenarios were developed.",
] as const
