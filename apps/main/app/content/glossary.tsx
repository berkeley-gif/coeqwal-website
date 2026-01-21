/**
 * Glossary terms and definitions for COEQWAL
 * Main app glossary data
 */

import React from "react"
import {
  WaterIcon,
  SettingsIcon,
  EngineeringIcon,
  LocationOnIcon,
  AgricultureIcon,
  AccountBalanceIcon,
  Diversity3Icon,
  LocalShippingIcon,
  CloudIcon,
  GroupsIcon,
  AssessmentIcon,
  CategoryIcon,
  WavesIcon,
  TimelineIcon,
  Box,
} from "@repo/ui/mui"

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
    icon: <AgricultureIcon />,
    term: "Agricultural deliveries",
    definition:
      "The amount of water delivered to farms and agricultural operations for crop irrigation, livestock, and food processing. Agriculture uses the largest share of California's developed water supply.",
  },
  {
    icon: <AgricultureIcon />,
    term: "Agricultural revenues",
    definition:
      "How average agricultural revenue changes in response to water deliveries.",
  },
  {
    icon: <SettingsIcon />,
    term: "Allocation",
    definition:
      "The amount of water allocated to a particular water users, based on available water supplies, regulations, and priorities established by law and policy. In the CalSim model, available water is distributed across the Central Valley and inter-connected regions to satisfy agricultural, community, and environmental water demands. CalSim estimates the amount of water delivered to every water use specified in the model for each month in a 100-year period, which may represent historical conditions or future hydroclimates.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "California Department of Water Resources (DWR)",
    definition:
      "A state agency that manages California's water resources. DWR operates the State Water Project and plays a central role in planning, modeling, and allocating water in California.",
  },
  {
    icon: <EngineeringIcon />,
    term: "California water system",
    definition:
      "A vast, interconnected network of rivers, reservoirs, aqueducts, dams, canals, and pumps that moves water across the state from mountains and rivers to communities, farms, and ecosystems. It is one of the most physically complex engineered water systems in the world, with an equally complex network of agencies and laws that govern its operation.",
  },
  {
    icon: <EngineeringIcon />,
    term: "CalSim",
    definition:
      "A computational water planning model used to simulate how water moves through California's Central Valley water system. CalSim3 is used by the state's Department of Water Resources and the federal U.S. Bureau of Reclamation to model the storage, conveyance, and delivery of water in the Central Valley. COEQWAL is using this same open-source model to explore how a broad range of water management strategies and hydroclimates could affect water allocations and different outcomes for people and the environment.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Central Valley",
    definition:
      "The Central Valley is the large, relatively flat valley running roughly 450 miles north to south throughout the center of California.  It includes the Sacramento Valley in the north and the San Joaquin Valley and Tulare Basin region in the south, and is home to some of the most productive farmland in the world. Much of California's complex water infrastructure is designed to move water to farms through the Central Valley, but also to cities within the Valley and along the coast, including in the San Francisco Bay Area and Southern California.",
  },
  {
    icon: <Diversity3Icon />,
    term: "COEQWAL",
    definition:
      'A collaborative project focused on exploring alternative water management strategies and supporting more equitable and inclusive stewardship of California\'s water under a changing climate. See "About COEQWAL" for more information.',
  },
  {
    icon: <LocalShippingIcon />,
    term: "Conveyance",
    definition:
      "The movement of water through managed infrastructure such as canals, aqueducts, pipes, and pumps. Conveyance is central to California's water system, which transports water hundreds of miles between regions.",
  },
  {
    icon: <SettingsIcon />,
    term: "Current operations",
    definition:
      "Represents how California manages water today, including the laws, regulations, priorities, and decisions that affect how California's water supply is allocated. This water management strategy uses a current operations scenario developed by the Department of Water Resources in 2020, with a representation of current agricultural land use (2020) and Temporary Use Change Petitions (TUCPs). Current operations serve as a baseline to help us understand how and why water is allocated to different users and how water allocations shift with changes in water management strategies.",
  },
  {
    icon: <LocalShippingIcon />,
    term: "Deliveries",
    definition:
      "The distribution of water from storage and conveyance systems to end users, including farms, communities, and environmental uses. Water deliveries are managed according to water rights, contracts, and regulatory requirements. See also allocation.",
  },
  {
    icon: <WaterIcon />,
    term: "Demands",
    definition: "TODO",
  },
  {
    icon: <EngineeringIcon />,
    term: "Delta Conveyance Project",
    definition:
      "A proposed water infrastructure project by the state Department of Water Resources designed to improve the reliability of water deliveries from the Sacramento-San Joaquin Delta. The project includes tunnel alternatives that would convey water from the Sacramento River, under the Delta, to pumping plants in the southern Delta. The Bethany Alternative refers to a specific tunnel route ending at Bethany Reservoir instead of Clifton Court Forebay.",
  },
  {
    icon: <GroupsIcon />,
    term: "Distributional equity",
    definition:
      "How fairly the benefits and burdens of water allocations are shared.",
  },
  {
    icon: <WaterIcon />,
    term: "Environmental river flows",
    definition:
      "Water maintained in rivers to sustain fish populations and other benefits and services that healthy river ecosystems support",
  },
  {
    icon: <WaterIcon />,
    term: "Environmental water",
    definition:
      "Water allocated to benefit the environment, including river flows, Delta outflows for estuary health, and deliveries to wetland refuges.",
  },
  {
    icon: <WaterIcon />,
    term: "Groundwater",
    definition:
      "Water that is stored underground in aquifers—layers of rock, sand, and soil that hold water. Groundwater is pumped from wells and provides a significant portion of California's water supply, especially during droughts. It is recharged naturally by rainfall and snowmelt, and artificially through managed aquifer recharge programs. Unlike surface water, groundwater moves slowly through underground formations and can take decades to millennia to replenish.",
  },
  {
    icon: <CloudIcon />,
    term: "Hydroclimate",
    definition:
      "Current and projected shifts in California's climate and hydrology include rising temperatures, changing precipitation patterns, reduced snowpack, more extreme weather events, and sea level rise. These changes affect water availability, timing, and quality. Hydroclimate futures represent potential future climatic and hydrologic conditions that are based on modeled physical changes in the hydrology of river basins that supply most of California's water. These hydroclimate futures can be combined with water management strategies to see how water allocation outcomes change under different conditions.",
  },
  {
    icon: <WavesIcon />,
    term: "Reservoir storage",
    definition: "The volume of water held behind large dams in California.",
  },
  {
    icon: <TimelineIcon />,
    term: "Scenarios",
    definition:
      "Unique combinations of water management strategies and hydroclimates designed to explore possibilities for California's water future. Scenarios can help answer questions like: What if we limited groundwater pumping? What if we prioritized drinking water? How will allocations change if the state gets drier? Evaluation of scenarios help us to understand tradeoffs and impacts to different water users.",
  },
  {
    icon: (
      <Box sx={{ transform: "rotate(90deg)", display: "inline-flex" }}>
        <AssessmentIcon />
      </Box>
    ),
    term: "Scenario outcomes",
    definition:
      'The detailed outputs produced by modeling unique combinations of hydroclimate futures and operational scenarios in CalSim3. The CalSim3 model outputs include things like river flows, reservoir levels, and water deliveries. Additional "sub-models" are used to estimate how changes in water allocations affect agricultural revenues, Delta salinity, and salmon populations. These data help us understand and respond to the anticipated effects of specific water management decisions under current or future hydroclimates.',
  },
  {
    icon: <WaterIcon />,
    term: "Surface water",
    definition:
      "Surface water is water that flows over, or is stored on, the Earth's surface. It includes water flowing in rivers and artificial channels and water stored in lakes and reservoirs. Surface water plays a key role in supporting ecosystems, agriculture, and communities.",
  },
  {
    icon: <WaterIcon />,
    term: "Sustainable Groundwater Management Act (SGMA)",
    definition:
      "A California law enacted in 2014 that requires local agencies to manage groundwater sustainably. SGMA establishes a framework for local groundwater management, requiring agencies to balance water use and recharge to avoid long-term depletion of aquifers. The law aims to achieve groundwater sustainability by 2040 in most parts of the Central Valleys.",
  },
  {
    icon: <SettingsIcon />,
    term: "Temporary Urgent Change Petitions (TUCPs)",
    definition:
      "Temporary Urgent Change Petitions (TUCPs, also known as TUCOs) permit changes during droughts to meet human health and safety needs and protect endangered species.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "U.S. Bureau of Reclamation",
    definition:
      "A federal agency that manages water in the western U.S., including operation of the Central Valley Project in California. It works alongside state agencies and plays a key role in delivering water to farms, communities, and wildlife refuges throughout the Central Valley.",
  },
  {
    icon: <EngineeringIcon />,
    term: "Water management strategies",
    definition:
      "Decisions made by water system operators about how to manage water infrastructure and allocate water. These include decisions about when to release water from reservoirs, how much water to pump through canals, how to satisfy regulatory and legal requirements, and how to balance competing demands for water across the system.",
  },
  {
    icon: <CategoryIcon />,
    term: "Water management themes",
    definition: "Groups of related water management strategies",
  },
].sort((a, b) => a.term.localeCompare(b.term))
