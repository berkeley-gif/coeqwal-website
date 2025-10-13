/**
 * Glossary terms and definitions for COEQWAL
 * Centralized glossary data that can be reused across apps
 */

import React from "react"
// Import icons
import {
  WaterIcon,
  SettingsIcon,
  EngineeringIcon,
  LocationOnIcon,
} from "../mui-components"
// Import additional icons directly from @mui/icons-material
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"
import CompareIcon from "@mui/icons-material/Compare"
import Psychology from "@mui/icons-material/Psychology"
import Diversity3Icon from "@mui/icons-material/Diversity3"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import ThermostatIcon from "@mui/icons-material/Thermostat"
import CloudIcon from "@mui/icons-material/Cloud"

// Glossary term type definitions
export interface TierInfo {
  tier: string
  color: string
  description: string
}

export interface GlossaryTerm {
  icon: React.ReactNode
  term: string
  definition: string
  seeAlso?: string
  tiers?: TierInfo[]
}

// Complete array of glossary terms with Material Icons
export const glossaryTerms: GlossaryTerm[] = [
  {
    icon: <Diversity3Icon />,
    term: "COEQWAL",
    definition:
      "A collaborative project focused on exploring alternative water management strategies and supporting more equitable and inclusive stewardship of California's water under a changing climate. See 'About COEQWAL' for more information.",
  },
  {
    icon: <EngineeringIcon />,
    term: "Operational strategies",
    definition:
      "Decisions made by water system operators about how to manage water infrastructure and allocate water. These include decisions about when to release water from reservoirs, how much water to pump through canals, how to satisfy regulatory and legal requirements, and how to balance competing demands for water across the system.",
  },
  {
    icon: <CloudIcon />,
    term: "Hydroclimate",
    definition:
      "Current and projected shifts in California's climate and hydrology include rising temperatures, changing precipitation patterns, reduced snowpack, more extreme weather events, and sea level rise. These changes affect water availability, timing, and quality. Hydroclimate futures represent potential future climatic and hydrologic conditions that are based on modeled physical changes in the hydrology of river basins that supply most of California's water. These hydroclimate futures can be combined with operational strategies to see how water allocation outcomes change under different conditions, hydroclimates.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "California Department of Water Resources (DWR)",
    definition:
      "A state agency that manages California's water resources. DWR operates the State Water Project and plays a central role in planning, modeling, and allocating water in California.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "California water system",
    definition:
      "A vast, interconnected network of rivers, reservoirs, aqueducts, dams, canals, and pumps that moves water across the state from mountains and rivers to communities, farms, and ecosystems. It is one of the most physically complex engineered water systems in the world, with an equally complex network of agencies and laws that govern its operation.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "California's major water projects",
    definition:
      "Large-scale water infrastructure systems including the State Water Project (SWP) operated by the California Department of Water Resources and the Central Valley Project (CVP) operated by the U.S. Bureau of Reclamation. These projects include major reservoirs like Shasta and Oroville, the California Aqueduct, Delta pumping facilities, and hundreds of miles of canals that move water throughout the Central Valley and to Southern California.",
    seeAlso: "Central Valley, CalSim",
  },
  {
    icon: <LocalShippingIcon />,
    term: "Conveyance",
    definition:
      "The movement of water through managed infrastructure such as canals, aqueducts, pipes, and pumps. Conveyance is central to California's water system, which transports water hundreds of miles between regions.",
  },
  {
    icon: <LocalShippingIcon />,
    term: "Deliveries",
    definition:
      "The distribution of water from storage and conveyance systems to end users, including farms, communities, and environmental uses. Water deliveries are managed according to water rights, contracts, and regulatory requirements. See also allocation.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Distributional equity",
    definition:
      "How fairly the benefits and burdens of water allocations are shared.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Environmental river flows",
    definition:
      "Water maintained in rivers to sustain fish populations and other benefits and services that healthy river ecosystems support.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Environmental water",
    definition:
      "Water allocated to benefit the environment, including river flows, Delta outflows for estuary health, and deliveries to wetland refuges.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Groundwater",
    definition:
      "Water that is stored underground in aquifers—layers of rock, sand, and soil that hold water. Groundwater is accessed through wells and provides a significant portion of California's water supply, especially during droughts. It is recharged naturally by rainfall and snowmelt, and artificially through managed aquifer recharge programs. Unlike surface water, groundwater moves slowly through underground formations and can take decades to millennia to replenish.",
  },
  {
    icon: <EngineeringIcon />,
    term: "Delta Conveyance Project",
    definition:
      "A proposed water infrastructure project by the state Department of Water Resources designed to improve the reliability of water deliveries from the Sacramento-San Joaquin Delta. The project includes tunnel alternatives that would convey water from the Sacramento River, under the Delta, to pumping plants in the southern Delta. The Bethany Alternative refers to a specific tunnel route ending at Bethany Reservoir instead of Clifton Court Forebay.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Scenario data",
    definition:
      "The detailed outputs produced by modeling unique combinations of hydroclimate futures and operational scenarios in CalSim3. The CalSim3 model outputs include things like river flows, reservoir levels, salinity, and water deliveries. These data help us understand and respond to the anticipated effects of specific water management decisions in combination with current or future climate and hydrologic conditions.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Scenario themes",
    definition: "Groups of related operational strategies.",
  },
  {
    icon: <CompareIcon />,
    term: "Scenarios",
    definition:
      "Combined sets of operational strategies and hydroclimates designed to explore different water management possibilities. Scenarios can help answer questions like: What if we limited groundwater pumping? What if we prioritized drinking water? How will allocations change if the state gets drier? Scenarios help us to understand tradeoffs and impacts.",
    seeAlso: "Operational strategies, Hydroclimate, CalSim",
  },
  {
    icon: <LocalShippingIcon />,
    term: "Water allocations",
    definition:
      "The distribution of available water among different users including communities, agriculture, and environmental needs. Water allocations are determined by water rights, regulations, and operational decisions, and can vary significantly based on water availability, climate conditions, and management strategies.",
    seeAlso: "Water management decisions, COEQWAL",
  },
  {
    icon: <LocationOnIcon />,
    term: "Storage",
    definition:
      "The holding of water in reservoirs, tanks, and other facilities for later use. Water storage allows California to capture water during wet periods and release it during dry periods, helping to balance supply and demand across seasons and years.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Surface water",
    definition:
      "Surface water is water that flows over or is stored on the Earth's surface in natural or engineered systems. It includes water flowing in rivers and artificial channels and water stored in lakes and reservoirs. Surface water plays a key role in ecosystems, agriculture, community supply, and flood control.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "U.S. Bureau of Reclamation",
    definition:
      "A federal agency that manages water in the western U.S., including operation of the Central Valley Project in California. It works alongside state agencies and plays a key role in delivering water to farms, communities, and wildlife refuges.",
  },
  {
    icon: <SettingsIcon />,
    term: "Water management decisions",
    definition:
      "Choices made by agencies and water operators about how water is stored, moved, and delivered across the system. These decisions affect how much water reaches farms, communities, rivers, and wetlands.",
  },
  {
    icon: <SettingsIcon />,
    term: "Operational decisions",
    definition:
      "Day-to-day and seasonal choices made by water system operators about how to manage water infrastructure. These include decisions about when to release water from reservoirs, how much water to pump through canals, and how to balance competing demands for water across the system.",
  },
  {
    icon: <SettingsIcon />,
    term: "Allocation",
    definition:
      "The process of distributing available water among different users and uses, such as agriculture, communities, and environmental needs. Water allocation decisions determine who gets water, when, and how much, based on water rights, regulations, and priorities established by law and policy.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Central Valley",
    definition:
      "The Central Valley is the large, relatively flat valley running roughly 450 miles north to south throughout the center of California. It includes the Sacramento Valley in the north and the San Joaquin Valley and Tulare Basin region in the south, and is home to some of the most productive farmland in the world. Much of California's complex water infrastructure is designed to move water through the Central Valley, but also to cities along the coast, including in the San Francisco Bay Area and Southern California.",
  },
  {
    icon: <EngineeringIcon />,
    term: "CalSim",
    definition:
      "A computational water planning model used to simulate how water moves through California's Central Valley water system. CalSim is used by the state's Department of Water Resources and the federal U.S. Bureau of Reclamation to model the storage, conveyance, and delivery of water in the Central Valley. COEQWAL is using this same open-source model to explore how a broad range of operational strategies and hydroclimates could affect water allocations and different outcomes for people and the environment.",
  },
  {
    icon: <ThermostatIcon />,
    term: "Changing climate",
    definition:
      "The ongoing shifts in California's climate patterns, including rising temperatures, changing precipitation patterns, reduced snowpack, more extreme weather events, and sea level rise. These changes affect water availability, timing, and quality. Different climate scenarios represent potential future conditions based on varying precipitation and temperature patterns. These scenarios help evaluate how water management strategies perform under different climate conditions.",
  },
  {
    icon: <Psychology />,
    term: "Actionable insights",
    definition:
      "Information and data that can be used to support decision-making, advocacy, or planning. COEQWAL helps turn complex hydroclimate and operational strategies data into actionable insights for communities, agencies, and advocates.",
  },
  {
    icon: <WaterIcon />,
    term: "Sustainable Groundwater Management Act (SGMA)",
    definition:
      "A California law enacted in 2014 that requires local agencies to manage groundwater sustainably. SGMA establishes a framework for local groundwater management, requiring agencies to balance water use and recharge to avoid long-term depletion. The law aims to achieve groundwater sustainability by 2040 for high and medium priority basins.",
    seeAlso: "Groundwater",
  },
  {
    icon: <LocationOnIcon />,
    term: "Community deliveries",
    definition:
      "The amount of water delivered to cities, towns, and communities for drinking water, sanitation, and municipal uses.",
    tiers: [
      {
        tier: "Tier 1",
        color: "tier1",
        description:
          "Community water systems receive enough water to meet their full demands in at least 95% of years",
      },
      {
        tier: "Tier 2",
        color: "tier2",
        description:
          "Community water systems receive enough water to maintain human health and safety in addition to meeting minimal industrial and commercial demands in all years",
      },
      {
        tier: "Tier 3",
        color: "tier3",
        description:
          "Community water systems receive enough water to deliver the minimum water needed for human health and safety in all years",
      },
      {
        tier: "Tier 4",
        color: "tier4",
        description:
          "Human health and safety minimums are not achieved in all years",
      },
    ],
  },
  {
    icon: <LocationOnIcon />,
    term: "Agricultural deliveries",
    definition:
      "The amount of water delivered to farms and agricultural operations for crop irrigation, livestock, and food processing. Agriculture uses the largest share of California's developed water supply.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Agricultural revenue",
    definition:
      "The change to average agricultural revenue compared to today's outcomes.",
    tiers: [
      {
        tier: "Tier 1",
        color: "tier1",
        description:
          "Agricultural revenue increases compared to historical values",
      },
      {
        tier: "Tier 2",
        color: "tier2",
        description:
          "Agricultural revenue declines less than 5% compared to historical values",
      },
      {
        tier: "Tier 3",
        color: "tier3",
        description:
          "Agricultural revenue declines between 5% and 20% compared to historical values",
      },
      {
        tier: "Tier 4",
        color: "tier4",
        description:
          "Agricultural revenue decreases more than 20% compared to historical values",
      },
    ],
  },
  {
    icon: <LocationOnIcon />,
    term: "Environmental flows",
    definition:
      "Tiers reflect the extent to which river flows vary seasonally and year-to-year within ranges to support healthy riverine ecosystems.",
    tiers: [
      {
        tier: "Tier 1",
        color: "tier1",
        description:
          "Flows vary enough between years and seasons to support a healthy, functioning ecosystem in 90% of years",
      },
      {
        tier: "Tier 2",
        color: "tier2",
        description:
          "Flows in the wet season and spring are below target ranges, but flows in the dry season are sufficient in 90% of years",
      },
      {
        tier: "Tier 3",
        color: "tier3",
        description:
          "Seasonal flow targets are not achieved in wet season, spring, or dry season, but existing regulatory minimum flows are met in 90% of years",
      },
      {
        tier: "Tier 4",
        color: "tier4",
        description:
          "Minimum flow requirements are met in fewer than 90% of years",
      },
    ],
  },
  {
    icon: <LocationOnIcon />,
    term: "Salmon abundance",
    definition:
      "Tiers reflect whether the population shows strong growth (Tier 1), moderate growth (Tier 2), little or no change (Tier 3), or experiences population decline (Tier 4).",
    tiers: [
      {
        tier: "Tier 1",
        color: "tier1",
        description:
          "There is at least an 80% chance that the population grows to 8 times its current size for Winter Run Chinook salmon on the Sacramento River",
      },
      {
        tier: "Tier 2",
        color: "tier2",
        description:
          "There is at least an 80% chance that the population grows to 2 to 8 times its current size for Winter Run Chinook salmon on the Sacramento River",
      },
      {
        tier: "Tier 3",
        color: "tier3",
        description:
          "There is at least an 80% chance that the population of Winter Run Chinook salmon on the Sacramento River grows from its current size",
      },
      {
        tier: "Tier 4",
        color: "tier4",
        description:
          "The population of Winter Run Chinook salmon on the Sacramento River remains stable at current levels or declines",
      },
    ],
  },
].sort((a, b) => a.term.localeCompare(b.term))
