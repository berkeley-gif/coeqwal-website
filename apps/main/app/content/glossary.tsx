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
  AccountBalanceIcon,
  Diversity3Icon,
  LocalShippingIcon,
  CloudIcon,
  GrassIcon,
  WavesIcon,
  TimelineIcon,
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
    icon: <SettingsIcon />,
    term: "Allocation",
    definition:
      "The amount of water distributed to a particular water user, based on available water supplies, regulations, and priorities established by law and policy.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "California Department of Water Resources (DWR)",
    definition:
      "The state agency that operates the State Water Project (SWP) and plays a central role in planning, modeling, and allocating water in California.",
  },
  {
    icon: <EngineeringIcon />,
    term: "California water system",
    definition:
      "A vast, interconnected network of rivers, reservoirs, aqueducts, dams, canals, and pumps that moves water across the state from mountains and rivers to communities, farms, and ecosystems. It is one of the most physically complex engineered water systems in the world, with an equally complex network of agencies and laws that govern its operation.",
  },
  {
    icon: <EngineeringIcon />,
    term: "CalSim3",
    definition:
      "A computational water planning model used to simulate how water moves through California's Central Valley water system. CalSim3 is used by the state's Department of Water Resources and the federal U.S. Bureau of Reclamation to model the storage, conveyance, and delivery of water in the Central Valley. COEQWAL is using this same open-source model to explore how a broad range of water management strategies and hydroclimates could affect water allocations and outcomes for people and the environment.",
  },
  {
    icon: <WaterIcon />,
    term: "Central Valley Project",
    definition:
      "Federally operated water distribution system serving farms, homes, and industry in California's Central Valley and some urban Bay Area centers. A multi-purpose network of dams, reservoirs, canals, hydroelectric power plants, and other facilities run by the U.S. Bureau of Reclamation.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Central Valley",
    definition:
      "The Central Valley is the large, relatively flat valley running roughly 450 miles north to south throughout the center of California. It includes the Sacramento Valley in the north and the San Joaquin Valley and Tulare Basin region in the south, and is home to some of the most productive farmland in the world. Much of California's complex water infrastructure is designed to move water to farms through the Central Valley, but also to cities within the Valley and along the coast, including in the San Francisco Bay Area and Southern California.",
  },
  {
    icon: <Diversity3Icon />,
    term: "COEQWAL",
    definition:
      "The Collaboratory for Equity in Water Allocation – is a publicly-funded project that works with communities to better understand how water decisions affect us now and for generations to come. Visit ABOUT to learn more about the project.",
  },
  {
    icon: <LocalShippingIcon />,
    term: "Deliveries",
    definition:
      "The distribution of water from storage and conveyance systems to end users, including farms, communities, and environmental uses. Water deliveries are managed according to water rights, contracts, and regulatory requirements. See also allocation.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Delta",
    definition:
      "The Sacramento–San Joaquin Delta is a river delta and estuary at the confluence of the Sacramento and San Joaquin rivers. Many of California’s water challenges intersect here because of the presence of large pumps that export water from the Delta, a long history of habitat modification that have transformed the Delta ecosystem, and competing demands on the Delta to serve the needs of communities, agriculture, recreational uses, and the environment.",
  },
  {
    icon: <EngineeringIcon />,
    term: "Delta Conveyance Project",
    definition:
      "A proposed water infrastructure project by the Department of Water Resources designed to improve the reliability of water deliveries from the Sacramento-San Joaquin Delta. The project includes tunnel alternatives that would convey water from the Sacramento River, through a tunnel, to pumping plants in the southern Delta. The Bethany Alternative refers to a specific tunnel route ending at Bethany Reservoir instead of Clifton Court Forebay.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Fall X2 Salinity Standard",
    definition:
      "The X2 refers to the geographic distance, measured in kilometers from the Golden Gate Bridge, to the point in the Delta where daily average salinity is 2 parts per thousand (ppt). Current regulations require that the location of the X2 in the fall be maintained below a maximum distance, primarily for ecological purposes.",
  },
  {
    icon: <WaterIcon />,
    term: "Groundwater",
    definition:
      "Water that is stored underground in aquifers-layers of rock, sand, and soil that hold water. Groundwater is pumped from wells and provides a significant portion of California's water supply, especially during droughts. It is recharged naturally by rainfall and snowmelt, and artificially through managed aquifer recharge programs. Unlike surface water, groundwater moves slowly through underground formations and can take decades to millennia to replenish.",
  },
  {
    icon: <WaterIcon />,
    term: "Groundwater basin",
    definition:
      "Layers of rock, sand, and soil that hold water underground over a defined geographic area. Groundwater basins are important because they provide a significant portion of California's water supply, especially during droughts.",
  },
  {
    icon: <CloudIcon />,
    term: "Hydroclimate",
    definition:
      "Temperature, precipitation, and streamflow patterns that affect water supplies. In the context of COEQWAL, hydroclimate refers to one potential version of current or future hydroclimates, informed by historical conditions, climate model projections or statistical models.",
  },
  {
    icon: <CloudIcon />,
    term: "Key outcomes",
    definition:
      "COEQWAL scenario results summarized by nine variables relating to different aspects of the water system: community surface water, agricultural revenue, environmental flows, groundwater storage, reservoir storage, Delta estuary ecology, freshwater for in-Delta uses, freshwater for Delta exports, and winter-run salmon.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Location of interest",
    definition: "Locations at which key outcomes are evaluated.",
  },
  {
    icon: <CloudIcon />,
    term: "Management strategies",
    definition:
      "Decisions made by water system operators about how to manage water infrastructure and allocate water. These include decisions about when to release water from reservoirs, how much water to pump through canals, how to satisfy regulatory and legal requirements, and how to balance competing demands for water across the system. Management strategies are combined with hydroclimates to create different CalSim3 scenarios.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Microhabitat",
    definition:
      "Small patches of wetland or floodplain in the Delta that, when wetted, are highly productive and can serve as nursery or feeding grounds for a variety of species. Microhabitats are typically only inundated during high flows.",
  },
  {
    icon: <LocationOnIcon />,
    term: "Sacramento River",
    definition:
      "The Sacramento River is the largest river in California by volume of water carried. It flows about 400 miles South from Northern California before reaching the Sacramento-San Joaquin Delta.",
  },
  {
    icon: <SettingsIcon />,
    term: "Salinity",
    definition:
      "A measure of salt concentration in water. Salinity levels are important in the Delta estuary because they affect habitats, the quality of water exported south for farms and communities, and the quality of water used within the Delta for human purposes.",
  },
  {
    icon: <LocationOnIcon />,
    term: "San Joaquin River",
    definition:
      "The San Joaquin River flows approximately 366 miles from the high Sierra Nevadas down to, and then through, California’s Central Valley before reaching the Sacramento-San Joaquin Delta. It is the longest river in California’s Central Valley.",
  },
  {
    icon: <TimelineIcon />,
    term: "Scenario",
    definition:
      "Unique combinations of water management strategies and hydroclimates designed to explore possibilities for California's water future. Scenarios can help answer questions like: What if we limited groundwater pumping? What if we prioritized deliveries for drinking water? How will allocations change if the state gets warmer and drier? Evaluation of scenarios help us to understand tradeoffs and impacts to different water users.",
  },
  {
    icon: <WaterIcon />,
    term: "State Water Project",
    definition:
      "A state-operated, multi-purpose water storage and delivery system — canals, pipelines, reservoirs, and hydroelectric facilities delivering water to homes, agriculture, and businesses — managed by the California Department of Water Resources.",
  },
  {
    icon: <GrassIcon />,
    term: "Submerged Aquatic Vegetation (SAV)",
    definition:
      "SAV refers to the invasive vegetation that grows in many Delta waterways. When SAV, particularly the Brazilian waterweed (Egeria densa), grows in high densities, it reduces turbidity, clogs boating paths, and provides habitat for non-native fishes. Very high flows reduce the density and extent of SAV for a period of time.",
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
    icon: <WaterIcon />,
    term: "Tributary",
    definition:
      "A stream or other body of water that flows into a larger stream or river.",
  },
  {
    icon: <SettingsIcon />,
    term: "Turbidity",
    definition:
      "A measure of water clarity. In the historic Delta, water was more turbid (less clear), and many native species endemic to the Delta are adapted to turbid conditions. Higher delta outflows typically coincide with higher turbidity because as more water flows through the system, more sediment is disturbed.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "U.S. Bureau of Reclamation",
    definition:
      'Federal agency that operates the Central Valley Project (CVP). Also referred to as "Reclamation."',
  },
  {
    icon: <WavesIcon />,
    term: "Winter-run Chinook salmon",
    definition:
      "Sacramento River winter-run Chinook salmon (Oncorhynchus tshawytscha) are a critically endangered salmon population unique to California that enter fresh water in winter and historically spawned in cold, spring-fed headwaters and tributaries of the Sacramento River. Today, Shasta Dam blocks access to most of those habitats, and winter-run primarily spawn downstream of Shasta Dam during the warmest part of the year. Their egg survival now depends heavily on cold water stored in Shasta Reservoir and released downstream during summer.",
  },
].sort((a, b) => a.term.localeCompare(b.term))

/**
 * Resolves a possibly-mistyped-case string to its canonical glossary term
 * name (e.g. "calsim" -> "CalSim"). Falls back to the original input if
 * nothing matches, so an unknown term fails the same way it always did.
 */
export function resolveGlossaryTerm(input: string): string {
  const match = glossaryTerms.find(
    (entry) => entry.term.toLowerCase() === input.toLowerCase(),
  )
  return match ? match.term : input
}
