/**
 * Glossary terms and definitions for COEQWAL
 */

import React from "react"
import { LocationOnIcon } from "@repo/ui/mui"

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

// Glossary terms data
export const glossaryTerms: GlossaryTerm[] = [
  {
    icon: React.createElement(LocationOnIcon),
    term: "COEQWAL",
    definition:
      "A collaborative project focused on exploring alternative water management strategies and supporting more equitable and inclusive stewardship of California's water under a changing climate. See 'About COEQWAL' for more information.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Operational strategies",
    definition:
      "Decisions made by water system operators about how to manage water infrastructure and allocate water. These include decisions about when to release water from reservoirs, how much water to pump through canals, how to satisfy regulatory and legal requirements, and how to balance competing demands for water across the system.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Hydroclimate",
    definition:
      "Current and projected shifts in California's climate and hydrology include rising temperatures, changing precipitation patterns, reduced snowpack, more extreme weather events, and sea level rise. These changes affect water availability, timing, and quality. Hydroclimate futures represent potential future climatic and hydrologic conditions that are based on modeled physical changes in the hydrology of river basins that supply most of California's water. These hydroclimate futures can be combined with operational strategies to see how water allocation outcomes change under different conditions, hydroclimates.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "California Department of Water Resources (DWR)",
    definition:
      "A state agency that manages California's water resources. DWR operates the State Water Project and plays a central role in planning, modeling, and allocating water in California.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "California water system",
    definition:
      "A vast, interconnected network of rivers, reservoirs, aqueducts, dams, canals, and pumps that moves water across the state from mountains and rivers to communities, farms, and ecosystems. It is one of the most physically complex engineered water systems in the world, with an equally complex network of agencies and laws that govern its operation.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "California's major water projects",
    definition:
      "Large-scale water infrastructure systems including the State Water Project (SWP) operated by the California Department of Water Resources and the Central Valley Project (CVP) operated by the U.S. Bureau of Reclamation. These projects include major reservoirs like Shasta and Oroville, the California Aqueduct, Delta pumping facilities, and hundreds of miles of canals that move water throughout the Central Valley and to Southern California.",
    seeAlso: "Central Valley, CalSim",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Conveyance",
    definition:
      "The movement of water through managed infrastructure such as canals, aqueducts, pipes, and pumps. Conveyance is central to California's water system, which transports water hundreds of miles between regions.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Deliveries",
    definition:
      "The distribution of water from storage and conveyance systems to end users, including farms, communities, and environmental uses. Water deliveries are managed according to water rights, contracts, and regulatory requirements. See also allocation.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Distributional equity",
    definition:
      "How fairly the benefits and burdens of water allocations are shared.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Environmental river flows",
    definition:
      "Water maintained in rivers to sustain fish populations and other benefits and services that healthy river ecosystems support.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Environmental water",
    definition:
      "Water allocated to benefit the environment, including river flows, Delta outflows for estuary health, and deliveries to wetland refuges.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Groundwater",
    definition:
      "Water that is stored underground in aquifers—layers of rock, sand, and soil that hold water. Groundwater is accessed through wells and provides a significant portion of California's water supply, especially during droughts. It is recharged naturally by rainfall and snowmelt, and artificially through managed aquifer recharge programs. Unlike surface water, groundwater moves slowly through underground formations and can take decades to millennia to replenish.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Delta Conveyance Project",
    definition:
      "A proposed water infrastructure project by the state Department of Water Resources designed to improve the reliability of water deliveries from the Sacramento-San Joaquin Delta. The project includes tunnel alternatives that would convey water from the Sacramento River, under the Delta, to pumping plants in the southern Delta. The Bethany Alternative refers to a specific tunnel route ending at Bethany Reservoir instead of Clifton Court Forebay.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Scenario data",
    definition:
      "The detailed outputs produced by modeling unique combinations of hydroclimate futures and operational scenarios in CalSim3. The CalSim3 model outputs include things like river flows, reservoir levels, salinity, and water deliveries. These data help us understand and respond to the anticipated effects of specific water management decisions in combination with current or future climate and hydrologic conditions.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Scenario themes",
    definition: "Groups of related operational strategies.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Scenarios",
    definition:
      "Combined sets of operational strategies and hydroclimates designed to explore different water management possibilities. Scenarios can help answer questions like: What if we limited groundwater pumping? What if we prioritized drinking water? How will allocations change if the state gets drier? Scenarios help us to understand tradeoffs and impacts.",
    seeAlso: "Operational strategies, Hydroclimate, CalSim",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Water allocations",
    definition:
      "The distribution of available water among different users including communities, agriculture, and environmental needs. Water allocations are determined by water rights, regulations, and operational decisions, and can vary significantly based on water availability, climate conditions, and management strategies.",
    seeAlso: "Water management decisions, COEQWAL",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Storage",
    definition:
      "The holding of water in reservoirs, tanks, and other facilities for later use. Water storage allows California to capture water during wet periods and release it during dry periods, helping to balance supply and demand across seasons and years.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Surface water",
    definition:
      "Surface water is water that flows over or is stored on the Earth's surface in natural or engineered systems. It includes water flowing in rivers and artificial channels and water stored in lakes and reservoirs. Surface water plays a key role in ecosystems, agriculture, community supply, and flood control.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "California water system",
    definition:
      "A vast, interconnected network of rivers, reservoirs, aqueducts, dams, canals, and pumps that moves water across the state from mountains and rivers to communities, farms, and ecosystems. It is one of the most complex water systems in the world.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "California Department of Water Resources (DWR)",
    definition:
      "A state agency that manages California's water resources. DWR operates the State Water Project and plays a central role in planning, modeling, and regulating water use in California.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "U.S. Bureau of Reclamation",
    definition:
      "A federal agency that manages water in the western U.S., including operation of the Central Valley Project in California. It works alongside state agencies and plays a key role in delivering water to farms, communities, and wildlife refuges.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Water management decisions",
    definition:
      "Choices made by agencies and water operators about how water is stored, moved, and delivered across the system. These decisions affect how much water reaches farms, communities, rivers, and wetlands.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Operational decisions",
    definition:
      "Day-to-day and seasonal choices made by water system operators about how to manage water infrastructure. These include decisions about when to release water from reservoirs, how much water to pump through canals, and how to balance competing demands for water across the system.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Scenarios",
    definition:
      "Alternative sets of water management decisions modeled to explore different possibilities. Scenarios can help answer questions like: What if we limited groundwater pumping? What if we prioritized drinking water? These are tools to explore tradeoffs and impacts.",
    seeAlso: "water management decisions",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Scenario themes",
    definition: "Groups of related scenarios.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Scenario data",
    definition:
      "The detailed outputs of each modeled water scenario, including things like river flows, reservoir levels, salinity, and water deliveries. This data shows the anticipated effects of specific water management decisions.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Surface water",
    definition:
      "Surface water is water that flows over or is stored on the Earth's surface in natural or engineered systems such as rivers, channels, wetlands, and reservoirs. It plays a key role in ecosystems, agriculture, community supply, and flood control. Groundwater is the other type of water that is regulated in California.",
    seeAlso: "Groundwater",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Groundwater",
    definition:
      "Water that is stored underground in aquifers—layers of rock, sand, and soil that can hold water. Groundwater is accessed through wells and provides a significant portion of California's water supply, especially during droughts. It is recharged naturally by rainfall and snowmelt, and artificially through managed aquifer recharge programs. Unlike surface water, groundwater moves slowly through underground formations and can take years or decades to replenish.",
    seeAlso: "Surface water",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Conveyance",
    definition:
      "The movement of water through infrastructure such as canals, aqueducts, pipes, and pumps. Conveyance is central to California's water system, which transports water hundreds of miles between regions.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Storage",
    definition:
      "The holding of water in reservoirs, tanks, and other facilities for later use. Water storage allows California to capture water during wet periods and release it during dry periods, helping to balance supply and demand across seasons and years.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Deliveries",
    definition:
      "The distribution of water from storage and conveyance systems to end users, including farms, communities, and environmental uses. Water deliveries are managed according to water rights, contracts, and regulatory requirements.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Allocation",
    definition:
      "The process of distributing available water among different users and uses, such as agriculture, communities, and environmental needs. Water allocation decisions determine who gets water, when, and how much, based on water rights, regulations, and priorities established by law and policy.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Central Valley",
    definition:
      "The Central Valley is the large, relatively flat valley running roughly 450 miles north to south throughout the center of California. It includes the Sacramento Valley in the north and the San Joaquin Valley and Tulare Basin region in the south, and is home to some of the most productive farmland in the world. Much of California's complex water infrastructure is designed to move water through the Central Valley, but also to cities along the coast, including in the San Francisco Bay Area and Southern California.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "CalSim",
    definition:
      "A computational water planning model used to simulate how water moves through California's Central Valley water system. CalSim is used by the state's Department of Water Resources and the federal U.S. Bureau of Reclamation to model the storage, conveyance, and delivery of water in the Central Valley. COEQWAL is using this same open-source model to explore how a broad range of operational strategies and hydroclimates could affect water allocations and different outcomes for people and the environment.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Changing climate",
    definition:
      "The ongoing shifts in California's climate patterns, including rising temperatures, changing precipitation patterns, reduced snowpack, more extreme weather events, and sea level rise. These changes affect water availability, timing, and quality. Different climate scenarios represent potential future conditions based on varying precipitation and temperature patterns. These scenarios help evaluate how water management strategies perform under different climate conditions.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Allocation",
    definition:
      "The amount of water allocated to a particular water users, based on available water supplies, regulations, and priorities established by law and policy. In the CalSim model, available water is distributed across the Central Valley to satisfy agricultural, community, and environmental water demands. CalSim estimates the amount of water delivered to every water use specified in the model for each month in a 100-year period, which may represent historical conditions or future hydroclimates.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Actionable insights",
    definition:
      "Information and data that can be used to support decision-making, advocacy, or planning. COEQWAL helps turn complex hydroclimate and operational strategies data into actionable insights for communities, agencies, and advocates.",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Sustainable Groundwater Management Act (SGMA)",
    definition:
      "A California law enacted in 2014 that requires local agencies to manage groundwater sustainably. SGMA establishes a framework for local groundwater management, requiring agencies to balance water use and recharge to avoid long-term depletion. The law aims to achieve groundwater sustainability by 2040 for high and medium priority basins.",
    seeAlso: "Groundwater",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "SGMA, San Joaquin Valley only",
    definition:
      "SGMA implementation focused exclusively on the San Joaquin Valley groundwater basins. This scenario applies sustainable groundwater management requirements only to the southern Central Valley, maintaining current land use patterns and agricultural practices while establishing groundwater sustainability by 2040.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "SGMA, San Joaquin Valley with agricultural reductions",
    definition:
      "SGMA implementation in the San Joaquin Valley that includes projected agricultural land use reductions to achieve groundwater sustainability. This scenario accounts for anticipated fallowing of farmland and shifts in crop patterns as groundwater agencies work to balance pumping with recharge.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "SGMA, Sacramento and San Joaquin valleys",
    definition:
      "Comprehensive SGMA implementation across both the Sacramento Valley and San Joaquin Valley groundwater basins. This scenario extends sustainable groundwater management requirements to the entire Central Valley, establishing coordinated groundwater sustainability across both regions by 2040.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "SGMA, Sacramento and San Joaquin valleys with agricultural reductions",
    definition:
      "The most comprehensive SGMA implementation scenario, covering both Sacramento and San Joaquin Valleys with projected agricultural land use reductions. This scenario models the full impact of sustainable groundwater management across the entire Central Valley, including anticipated changes in agricultural practices and land use patterns.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "USBR Alternative 3",
    definition:
      "A scenario developed by the U.S. Bureau of Reclamation as part of their long-term planning efforts for the Central Valley Project. This alternative explores specific operational changes and infrastructure modifications to improve water delivery reliability while addressing environmental concerns.",
    seeAlso: "U.S. Bureau of Reclamation",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Delta Conveyance Project",
    definition:
      "A proposed water infrastructure project designed to improve the reliability of water deliveries from the Sacramento-San Joaquin Delta. The project includes tunnel alternatives that would convey water under the Delta, reducing impacts on fish and improving water supply reliability. The Bethany Alternative refers to a specific tunnel route ending at Bethany Reservoir instead of Clifton Court Forebay.",
    seeAlso: "Conveyance",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Current operations",
    definition:
      "This operational strategy shows how California manages water today, including the laws, regulations, priorities, and decisions that affect how California's water supply is allocated. It relies on a CalSim model simulation developed by the Department of Water Resources in 2020 that represents current operations of the State Water Project and Central Valley Project. This operational strategy includes Temporary Urgency Change Petitions (TUCPs), which allow flexibility during droughts to release water in ways that protect fish and wildlife. This operational strategy also represents 2020 agricultural land use in the Central Valley. 'Current operations for California water' serves as a baseline to understand how water is allocated to different users in the state, and how allocations vary from year to year. This also allows us to understand how potential changes to operations and climate may affect water allocations in the future.",
    seeAlso:
      "California Department of Water Resources (DWR), U.S. Bureau of Reclamation, Water management decisions",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Current operations",
    definition:
      "The baseline modeling scenario used in COEQWAL analysis that represents today's water management practices in California's Central Valley. This scenario models the coordinated operations of the State Water Project (SWP) and Central Valley Project (CVP) under current institutional, regulatory, and infrastructure conditions. It includes existing reservoir operations, environmental flow requirements, and water allocation priorities as they currently exist. The current operations scenario provides the reference point for evaluating how alternative management strategies might change water outcomes for different users and regions. Learn more in the Current operations theme.",
    seeAlso: "CalSim, Water management decisions",
  },
  // Outcome-specific glossary entries with tiers
  {
    icon: React.createElement(LocationOnIcon),
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
    icon: React.createElement(LocationOnIcon),
    term: "Agricultural deliveries",
    definition:
      "The amount of water delivered to farms and agricultural operations for crop irrigation, livestock, and food processing. Agriculture uses the largest share of California's developed water supply.",
  },
  {
    icon: React.createElement(LocationOnIcon),
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
    icon: React.createElement(LocationOnIcon),
    term: "Environmental health",
    definition:
      "See Environmental flows for detailed information about river flow patterns and ecosystem support.",
    seeAlso: "Environmental flows",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Delta estuary status",
    definition:
      "Measures the degree to which outflows from the Delta vary from year to year, within acceptable ranges. In general, greater variation provides more suitable habitat for native species in the Delta.",
    tiers: [
      {
        tier: "Tier 1",
        color: "tier1",
        description: "Healthy variations in flow in at least 90% of years",
      },
      {
        tier: "Tier 2",
        color: "tier2",
        description: "Healthy variations in flow in at least 70% of years",
      },
      {
        tier: "Tier 3",
        color: "tier3",
        description: "Healthy variations in flow in at least 50% of years",
      },
      {
        tier: "Tier 4",
        color: "tier4",
        description: "Healthy variations in flow in fewer than 50% of years",
      },
    ],
  },
  {
    icon: React.createElement(LocationOnIcon),
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
    icon: React.createElement(LocationOnIcon),
    term: "Delta exports",
    definition:
      "Tier reflects how often salinity at the Delta pumping stations meets or exceeds water quality requirements for drinking water or irrigation.",
    tiers: [
      {
        tier: "Tier 1",
        color: "tier1",
        description:
          "Average salinity at both Banks & Jones pumping plants meets water quality standards for drinking and irrigation year round in 95% of years",
      },
      {
        tier: "Tier 2",
        color: "tier2",
        description:
          "Average salinity at Banks and Jones pumping plants remains suitable for drinking and irrigation (but with potential need for extra treatment) for at least 10 months per year in 95% of years",
      },
      {
        tier: "Tier 3",
        color: "tier3",
        description:
          "Average salinity at Banks and Jones pumping plants is unsuitable for drinking and irrigation for 2 months in any year, in more than 5% of years at either site",
      },
      {
        tier: "Tier 4",
        color: "tier4",
        description:
          "Average salinity at Banks and Jones pumping plants is unsuitable for irrigation or drinking water for more than two months in any year",
      },
    ],
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Freshwater for Delta exports",
    definition:
      "See Delta exports for detailed information about Delta pumping station water quality.",
    seeAlso: "Delta exports",
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Freshwater for in-Delta uses",
    definition:
      "Tiers reflect how often water in the western Delta is fresh enough for in-Delta uses.",
    tiers: [
      {
        tier: "Tier 1",
        color: "tier1",
        description:
          "Water is fresh enough for human use with no restrictions in at least 75% of all months, and unusable no more than in 5% of all months",
      },
      {
        tier: "Tier 2",
        color: "tier2",
        description:
          "Water is fresh enough for human use with no restrictions in at least 65% of all months, fresh enough for human use with some treatment or cropping adjustments in at least 75% of months, and unusable in no more than 12% of all months",
      },
      {
        tier: "Tier 3",
        color: "tier3",
        description:
          "Water is fresh enough for human use with no restrictions in at least 55% of all months, fresh enough for human use with some treatment or cropping adjustments in at least 65% of months, and unusable in no more than 20% of all months",
      },
      {
        tier: "Tier 4",
        color: "tier4",
        description:
          "Water is fresh enough for human use with no restrictions in less than 55% of all months and/or is unusable in more than 20% of all months",
      },
    ],
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Groundwater storage",
    definition:
      "Tier reflects how groundwater storage conditions (total water in the theoretically accessible aquifer system) compares to a reference condition. Groundwater responds slowly (at least compared to surface water systems) and can exhibit long-term upward or downward storage trends. Different scenarios may also exhibit shifts in the magnitude of storage but with a similar trend. The tiers attempt to assign tier designations at the Water Budget Area (WBA) level based on these trend and magnitude characteristics.",
    tiers: [
      {
        tier: "Tier 1",
        color: "tier1",
        description:
          "The groundwater trend in a WBA is stable or increasing from 1960-2021 and average total storage is greater than in the reference scenario",
      },
      {
        tier: "Tier 2",
        color: "tier2",
        description:
          "The groundwater trend in a WBA is stable or increasing but total storage is less than in the reference",
      },
      {
        tier: "Tier 3",
        color: "tier3",
        description:
          "The groundwater trend is declining (not stable or increasing as in Tiers 1 or 2) but at a moderate rate (fitted linear trend is less negative than -0.015 ft/yr)",
      },
      {
        tier: "Tier 4",
        color: "tier4",
        description:
          "Groundwater trends in a WBA are declining more severely, at a rate greater than 0.015 ft/year (slope <= -0.015 ft/yr)",
      },
    ],
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Reservoir storage",
    definition:
      "Tier reflects how full reservoirs are on April 30, which is an important benchmark for the amount of water available for delivery in the dry season (April – October).",
    tiers: [
      {
        tier: "Tier 1",
        color: "tier1",
        description:
          "Reservoir storage is frequently high. There is a 90% chance that end-of-April reservoir storage is greater than the median April value observed over the last 30 years (or length of the observational record, whichever is longer)",
      },
      {
        tier: "Tier 2",
        color: "tier2",
        description:
          "Reservoir storage is lower than in Tier 1 but similar to recent history. On average, for two years out of three the reservoir storage is greater than the 33rd percentile from the observational record over the last 30 years",
      },
      {
        tier: "Tier 3",
        color: "tier3",
        description:
          "Reservoir storage tends to be lower than in Tier 2 and is slightly lower than recent history. For 3 years out of 10, the reservoir storage is greater than the 33rd percentile from the observational record over the last 30 years",
      },
      {
        tier: "Tier 4",
        color: "tier4",
        description:
          "Reservoir storage is lower than in Tier 3 and is much lower than recent history. In Tier 4 reservoir storage exceeds the historical 33rd percentile less than 3 years in 10",
      },
    ],
  },
  {
    icon: React.createElement(LocationOnIcon),
    term: "Population size of Winter Run Chinook salmon on the Sacramento River",
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
  {
    icon: React.createElement(LocationOnIcon),
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
