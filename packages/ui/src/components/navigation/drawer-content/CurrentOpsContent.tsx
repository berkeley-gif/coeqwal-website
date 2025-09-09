"use client"

import { Box, Typography, useTheme, Divider, Stack } from "@mui/material"
import { ContentWrapper } from "./ContentWrapper"
import {
  WaterIcon,
  SettingsIcon,
  EngineeringIcon,
  BarChartIcon,
  LocationOnIcon,
  OpacityIcon,
} from "@repo/ui/mui"
// Import additional icons directly from @mui/icons-material
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"
import CompareIcon from "@mui/icons-material/Compare"
import Psychology from "@mui/icons-material/Psychology"
import Diversity3Icon from "@mui/icons-material/Diversity3"
import React from "react"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import ThermostatIcon from "@mui/icons-material/Thermostat"
import CloudIcon from "@mui/icons-material/Cloud"

export interface CurrentOpsContentProps {
  /** Function called when the close button is clicked */
  onClose: () => void
  /** Selected section ID passed from the drawer store */
  selectedSection?: string
  /** Selected term to scroll to */
  selectedTerm?: string
}

// Glossary term type definition
interface TierInfo {
  tier: string
  color: string
  description: string
}

interface GlossaryTerm {
  icon: React.ReactNode
  term: string
  definition: string
  seeAlso?: string
  tiers?: TierInfo[]
}

// Array of glossary terms with Material Icons
const glossaryTerms: GlossaryTerm[] = [
  {
    icon: <Diversity3Icon />,
    term: "COEQWAL",
    definition:
      "A collaborative project focused on exploring alternative water management decisions and supporting more equitable and inclusive stewardship of California's water system.",
  },
  {
    icon: <EngineeringIcon />,
    term: "Operational strategies",
    definition:
      "Different approaches to managing California's water system, including changes to reservoir operations, water allocation priorities, infrastructure usage, and environmental flow requirements. The COEQWAL project has developed 30 operational strategies that represent alternative ways California could manage its water resources to better meet diverse needs and adapt to changing conditions.",
  },
  {
    icon: <CloudIcon />,
    term: "Hydroclimates",
    definition:
      "Patterns of water availability that reflect different climate conditions, including precipitation, temperature, and snowpack patterns. COEQWAL evaluates water management strategies under multiple hydroclimates - the climate experienced in the recent past plus five additional patterns representing possible future climates affected by climate change.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "California's major water projects",
    definition:
      "Large-scale water infrastructure systems including the State Water Project (SWP) operated by the California Department of Water Resources and the Central Valley Project (CVP) operated by the U.S. Bureau of Reclamation. These projects include major reservoirs like Shasta and Oroville, the California Aqueduct, Delta pumping facilities, and hundreds of miles of canals that move water throughout the Central Valley and to Southern California.",
    seeAlso: "Central Valley, CalSim",
  },
  {
    icon: <CompareIcon />,
    term: "Scenarios",
    definition:
      "Unique combinations of operational strategies and climate conditions that show how water might be allocated under different circumstances. COEQWAL uses CalSim to model scenarios that explore alternative ways of managing California's water system, helping to understand trade-offs between different goals and outcomes.",
    seeAlso: "Operational strategies, Hydroclimates, CalSim",
  },
  {
    icon: <LocalShippingIcon />,
    term: "Water allocations",
    definition:
      "The distribution of available water among different users including communities, agriculture, and environmental needs. Water allocations are determined by water rights, regulations, and operational decisions, and can vary significantly based on water availability, climate conditions, and management strategies.",
    seeAlso: "Water management decisions, COEQWAL",
  },
  {
    icon: <WaterIcon />,
    term: "California water system",
    definition:
      "A vast, interconnected network of rivers, reservoirs, aqueducts, dams, canals, and pumps that moves water across the state from mountains and rivers to communities, farms, and ecosystems. It is one of the most complex water systems in the world.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "California Department of Water Resources (DWR)",
    definition:
      "A state agency that manages California's water resources. DWR operates the State Water Project and plays a central role in planning, modeling, and regulating water use in California.",
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
    icon: <CompareIcon />,
    term: "Scenarios",
    definition:
      "Alternative sets of water management decisions modeled to explore different possibilities. Scenarios can help answer questions like: What if we limited groundwater pumping? What if we prioritized drinking water? These are tools to explore tradeoffs and impacts.",
    seeAlso: "water management decisions",
  },
  {
    icon: <LocationOnIcon />,
    term: "Scenario themes",
    definition: "Groups of related scenarios.",
  },
  {
    icon: <BarChartIcon />,
    term: "Scenario data",
    definition:
      "The detailed outputs of each modeled water scenario, including things like river flows, reservoir levels, salinity, and water deliveries. This data shows the anticipated effects of specific water management decisions.",
  },
  {
    icon: <OpacityIcon />,
    term: "Surface water",
    definition:
      "Surface water is water that flows over or is stored on the Earth's surface in natural or engineered systems such as rivers, channels, wetlands, and reservoirs. It plays a key role in ecosystems, agriculture, community supply, and flood control. Groundwater is the other type of water that is regulated in California.",
    seeAlso: "Groundwater",
  },
  {
    icon: <OpacityIcon />,
    term: "Groundwater",
    definition:
      "Water that is stored underground in aquifers—layers of rock, sand, and soil that can hold water. Groundwater is accessed through wells and provides a significant portion of California's water supply, especially during droughts. It is recharged naturally by rainfall and snowmelt, and artificially through managed aquifer recharge programs. Unlike surface water, groundwater moves slowly through underground formations and can take years or decades to replenish.",
    seeAlso: "Surface water",
  },
  {
    icon: <OpacityIcon />,
    term: "Conveyance",
    definition:
      "The movement of water through infrastructure such as canals, aqueducts, pipes, and pumps. Conveyance is central to California's water system, which transports water hundreds of miles between regions.",
  },
  {
    icon: <WaterIcon />,
    term: "Storage",
    definition:
      "The holding of water in reservoirs, tanks, and other facilities for later use. Water storage allows California to capture water during wet periods and release it during dry periods, helping to balance supply and demand across seasons and years.",
  },
  {
    icon: <LocalShippingIcon />,
    term: "Deliveries",
    definition:
      "The distribution of water from storage and conveyance systems to end users, including farms, communities, and environmental uses. Water deliveries are managed according to water rights, contracts, and regulatory requirements.",
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
      "The large, flat valley running roughly 450 miles north to south throughout the center of California. The Central Valley forms the heart of California's agricultural region. It includes the Sacramento Valley in the north and the San Joaquin Valley in the south, and is home to some of the most productive farmland in the world. Much of California's complex water infrastructure is designed to move water through the Central Valley, but also to neighboring water districts like East Bay MUD and the Los Angeles Metropolitan Water District.",
  },
  {
    icon: <EngineeringIcon />,
    term: "CalSim",
    definition:
      "Computational model used to simulate how water moves through California's Central Valley water system. CalSim is used by the state's Department of Water Resources and the federal U.S. Bureau of Reclamation to model the storage, conveyance, and delivery of water in the Central Valley. COEQWAL is using this same open-source model to explore how a broad range of water management decisions could impact the Central Valley. Scenarios are the result of a computational model that estimates how much water is available for each purpose in each region. This scenario has the following summary outcomes. Because specific allocations vary locally across the state as well as during wet and dry years, we use four measurements per outcome to show how much or how often the water allocated reaches certain goals.",
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
      "Information and data that can be used to support decision-making, advocacy, or planning. COEQWAL helps turn complex scenario data into actionable insights for communities, agencies, and advocates.",
  },
  {
    icon: <WaterIcon />,
    term: "Sustainable Groundwater Management Act (SGMA)",
    definition:
      "A California law enacted in 2014 that requires local agencies to manage groundwater sustainably. SGMA establishes a framework for local groundwater management, requiring agencies to balance water use and recharge to avoid long-term depletion. The law aims to achieve groundwater sustainability by 2040 for high and medium priority basins.",
    seeAlso: "Groundwater",
  },
  {
    icon: <WaterIcon />,
    term: "SGMA, San Joaquin Valley only",
    definition:
      "SGMA implementation focused exclusively on the San Joaquin Valley groundwater basins. This scenario applies sustainable groundwater management requirements only to the southern Central Valley, maintaining current land use patterns and agricultural practices while establishing groundwater sustainability by 2040.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: <WaterIcon />,
    term: "SGMA, San Joaquin Valley with agricultural reductions",
    definition:
      "SGMA implementation in the San Joaquin Valley that includes projected agricultural land use reductions to achieve groundwater sustainability. This scenario accounts for anticipated fallowing of farmland and shifts in crop patterns as groundwater agencies work to balance pumping with recharge.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: <WaterIcon />,
    term: "SGMA, Sacramento and San Joaquin valleys",
    definition:
      "Comprehensive SGMA implementation across both the Sacramento Valley and San Joaquin Valley groundwater basins. This scenario extends sustainable groundwater management requirements to the entire Central Valley, establishing coordinated groundwater sustainability across both regions by 2040.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: <WaterIcon />,
    term: "SGMA, Sacramento and San Joaquin valleys with agricultural reductions",
    definition:
      "The most comprehensive SGMA implementation scenario, covering both Sacramento and San Joaquin Valleys with projected agricultural land use reductions. This scenario models the full impact of sustainable groundwater management across the entire Central Valley, including anticipated changes in agricultural practices and land use patterns.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "USBR Alternative 3",
    definition:
      "A scenario developed by the U.S. Bureau of Reclamation as part of their long-term planning efforts for the Central Valley Project. This alternative explores specific operational changes and infrastructure modifications to improve water delivery reliability while addressing environmental concerns.",
    seeAlso: "U.S. Bureau of Reclamation",
  },
  {
    icon: <SettingsIcon />,
    term: "Delta Conveyance Project",
    definition:
      "A proposed water infrastructure project designed to improve the reliability of water deliveries from the Sacramento-San Joaquin Delta. The project includes tunnel alternatives that would convey water under the Delta, reducing impacts on fish and improving water supply reliability. The Bethany Alternative refers to a specific tunnel route ending at Bethany Reservoir instead of Clifton Court Forebay.",
    seeAlso: "Conveyance",
  },
  {
    icon: <SettingsIcon />,
    term: "Current operations",
    definition:
      "The baseline water management scenario that represents how California's Central Valley water system operates today. This includes current operations of the State Water Project (SWP) managed by the California Department of Water Resources and the Central Valley Project (CVP) operated by the U.S. Bureau of Reclamation. Current operations involve coordinated management of reservoirs, pumping stations, and water deliveries to balance competing demands from urban areas, agriculture, and environmental needs. The system moves water from northern California rivers and reservoirs through the Sacramento-San Joaquin Delta to southern California and the Central Valley. This baseline scenario serves as the foundation for comparing alternative water management approaches and understanding potential trade-offs in water allocation decisions.",
    seeAlso:
      "California Department of Water Resources (DWR), U.S. Bureau of Reclamation, Water management decisions",
  },
  {
    icon: <SettingsIcon />,
    term: "Current operations scenario",
    definition:
      "The baseline modeling scenario used in COEQWAL analysis that represents today's water management practices in California's Central Valley. This scenario models the coordinated operations of the State Water Project (SWP) and Central Valley Project (CVP) under current institutional, regulatory, and infrastructure conditions. It includes existing reservoir operations, environmental flow requirements, and water allocation priorities as they currently exist. The current operations scenario provides the reference point for evaluating how alternative management strategies might change water outcomes for different users and regions. Learn more in the Current operations scenario theme.",
    seeAlso: "CalSim, Water management decisions",
  },
  // Outcome-specific glossary entries
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
    term: "Environmental health",
    definition:
      "See Environmental flows for detailed information about river flow patterns and ecosystem support.",
    seeAlso: "Environmental flows",
  },
  {
    icon: <LocationOnIcon />,
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
    icon: <LocationOnIcon />,
    term: "Freshwater for Delta exports",
    definition:
      "See Delta exports for detailed information about Delta pumping station water quality.",
    seeAlso: "Delta exports",
  },
  {
    icon: <LocationOnIcon />,
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
    icon: <LocationOnIcon />,
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
    icon: <LocationOnIcon />,
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
    icon: <LocationOnIcon />,
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

/**
 * Content component for the Glossary tab in the MultiDrawer
 */
export function CurrentOpsContent({
  onClose,
  selectedTerm,
}: CurrentOpsContentProps) {
  const theme = useTheme()
  const termRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

  // Internal state to track the currently highlighted term
  // This allows us to update highlighting when clicking internal links
  const [internalSelectedTerm, setInternalSelectedTerm] = React.useState<
    string | undefined
  >(selectedTerm)

  // Update internal state when external selectedTerm changes
  React.useEffect(() => {
    setInternalSelectedTerm(selectedTerm)
  }, [selectedTerm])

  // Function to handle clicking on a term link within the glossary
  const handleTermClick = (termName: string) => {
    // Update the internal selected term state for highlighting
    setInternalSelectedTerm(termName)

    if (termRefs.current[termName]) {
      termRefs.current[termName]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  // Function to render definition text with clickable term links
  const renderDefinitionWithLinks = (
    definition: string,
    currentTerm: string,
  ) => {
    console.log("Processing term:", currentTerm)
    console.log("Definition:", definition.substring(0, 100) + "...")

    // Check for "Groundwater", "surface water", "allocation", "Central Valley", and "Learn more" in the definition
    const hasGroundwater =
      definition.includes("Groundwater") && currentTerm !== "Groundwater"
    const hasSurfaceWater =
      definition.includes("surface water") && currentTerm !== "Surface water"
    const hasAllocation =
      definition.includes("allocation") && currentTerm !== "Allocation"
    const hasCentralValley =
      definition.includes("Central Valley") && currentTerm !== "Central Valley"
    const hasLearnMore = definition.includes(
      "Learn more in the Current operations scenario theme",
    )

    console.log("hasLearnMore:", hasLearnMore)

    // Helper function to create clickable links for a single term (first occurrence only)
    const createLinksForSingleTerm = (
      text: string,
      termToLink: string,
      displayTerm: string,
    ): React.ReactNode => {
      const firstIndex = text.indexOf(termToLink)
      if (firstIndex === -1) return text // No term found

      const beforeTerm = text.substring(0, firstIndex)
      const afterTerm = text.substring(firstIndex + termToLink.length)

      return (
        <>
          {beforeTerm}
          <Box
            component="span"
            sx={{
              color: "#FFAC6E",
              cursor: "pointer",
              textDecoration: "underline",
              "&:hover": {
                color: "#FF8A4A",
              },
            }}
            onClick={() => handleTermClick(displayTerm)}
          >
            {termToLink}
          </Box>
          {afterTerm}
        </>
      )
    }

    // Handle Central Valley links
    if (
      hasCentralValley &&
      !hasGroundwater &&
      !hasSurfaceWater &&
      !hasAllocation
    ) {
      return createLinksForSingleTerm(
        definition,
        "Central Valley",
        "Central Valley",
      )
    }

    // Handle allocation links
    if (
      hasAllocation &&
      !hasGroundwater &&
      !hasSurfaceWater &&
      !hasCentralValley
    ) {
      return createLinksForSingleTerm(definition, "allocation", "Allocation")
    }

    // Handle surface water links
    if (
      hasSurfaceWater &&
      !hasGroundwater &&
      !hasAllocation &&
      !hasCentralValley
    ) {
      return createLinksForSingleTerm(
        definition,
        "surface water",
        "Surface water",
      )
    }

    // Handle groundwater links
    if (
      hasGroundwater &&
      !hasSurfaceWater &&
      !hasAllocation &&
      !hasCentralValley &&
      !hasLearnMore
    ) {
      return createLinksForSingleTerm(definition, "Groundwater", "Groundwater")
    }

    // Handle Learn more link
    if (hasLearnMore) {
      console.log("Has Learn More link detected for:", currentTerm)
      const learnMoreText =
        "Learn more in the Current operations scenario theme"
      const learnMoreIndex = definition.indexOf(learnMoreText)
      const beforeLearnMore = definition.substring(0, learnMoreIndex)
      const afterLearnMore = definition.substring(
        learnMoreIndex + learnMoreText.length,
      )

      return (
        <>
          {beforeLearnMore}
          <Box
            component="span"
            sx={{
              color: "#449cd9", // theme.palette.blue.bright
              cursor: "pointer",
              textDecoration: "underline",
              "&:hover": {
                color: "#77a2d9", // theme.palette.blue.light
              },
            }}
            onClick={() => {
              // TODO: Navigate to Current operations scenario theme page
              console.log("Navigate to Current operations scenario theme")
            }}
          >
            {learnMoreText}
          </Box>
          {afterLearnMore}
        </>
      )
    }

    // For complex cases with multiple terms, handle them in order of appearance
    if (hasGroundwater && hasSurfaceWater) {
      const groundwaterIndex = definition.indexOf("Groundwater")
      const surfaceWaterIndex = definition.indexOf("surface water")

      if (groundwaterIndex < surfaceWaterIndex) {
        // Groundwater comes first
        const beforeGroundwater = definition.substring(0, groundwaterIndex)
        const afterGroundwater = definition.substring(groundwaterIndex + 11) // 11 is length of "Groundwater"

        const surfaceWaterIndexInRemainder =
          afterGroundwater.indexOf("surface water")
        const beforeSurfaceWater = afterGroundwater.substring(
          0,
          surfaceWaterIndexInRemainder,
        )
        const afterSurfaceWater = afterGroundwater.substring(
          surfaceWaterIndexInRemainder + 12,
        ) // 12 is length of "surface water"

        return (
          <>
            {beforeGroundwater}
            <Box
              component="span"
              sx={{
                color: "#FFAC6E",
                cursor: "pointer",
                textDecoration: "underline",
                "&:hover": {
                  color: "#FF8A4A",
                },
              }}
              onClick={() => handleTermClick("Groundwater")}
            >
              Groundwater
            </Box>
            {beforeSurfaceWater}
            <Box
              component="span"
              sx={{
                color: "#FFAC6E",
                cursor: "pointer",
                textDecoration: "underline",
                "&:hover": {
                  color: "#FF8A4A",
                },
              }}
              onClick={() => handleTermClick("Surface water")}
            >
              surface water
            </Box>
            {afterSurfaceWater}
          </>
        )
      } else {
        // Surface water comes first
        const beforeSurfaceWater = definition.substring(0, surfaceWaterIndex)
        const afterSurfaceWater = definition.substring(surfaceWaterIndex + 12) // 12 is length of "surface water"

        const groundwaterIndexInRemainder =
          afterSurfaceWater.indexOf("Groundwater")
        const beforeGroundwater = afterSurfaceWater.substring(
          0,
          groundwaterIndexInRemainder,
        )
        const afterGroundwaterFinal = afterSurfaceWater.substring(
          groundwaterIndexInRemainder + 11,
        ) // 11 is length of "Groundwater"

        return (
          <>
            {beforeSurfaceWater}
            <Box
              component="span"
              sx={{
                color: "#FFAC6E",
                cursor: "pointer",
                textDecoration: "underline",
                "&:hover": {
                  color: "#FF8A4A",
                },
              }}
              onClick={() => handleTermClick("Surface water")}
            >
              surface water
            </Box>
            {beforeGroundwater}
            <Box
              component="span"
              sx={{
                color: "#FFAC6E",
                cursor: "pointer",
                textDecoration: "underline",
                "&:hover": {
                  color: "#FF8A4A",
                },
              }}
              onClick={() => handleTermClick("Groundwater")}
            >
              Groundwater
            </Box>
            {afterGroundwaterFinal}
          </>
        )
      }
    }

    return definition
  }

  // Scroll to selected term when the component mounts or selectedTerm changes
  React.useEffect(() => {
    if (internalSelectedTerm && termRefs.current[internalSelectedTerm]) {
      termRefs.current[internalSelectedTerm]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [internalSelectedTerm])

  return (
    <ContentWrapper title="Glossary" onClose={onClose}>
      <Box
        sx={{
          ...theme.mixins.drawerContent.infoBox,
          maxHeight: "100%",
          overflowY: "auto",
          paddingBottom: 4,
        }}
      >
        <Stack spacing={1}>
          {glossaryTerms.map((term, index) => (
            <React.Fragment key={index}>
              <Box
                ref={(el) => {
                  // Store reference to the term's DOM element
                  termRefs.current[term.term] = el as HTMLDivElement | null
                }}
                sx={
                  internalSelectedTerm === term.term
                    ? {
                        scrollMarginTop: "20px",
                        backgroundColor: "rgba(255, 172, 110, 0.1)",
                        p: 2,
                        borderRadius: (theme) => theme.borderRadius.standard,
                        border: "1px solid rgba(255, 172, 110, 0.3)",
                        transition: "background-color 0.3s ease",
                      }
                    : {}
                }
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                  <Box
                    sx={{
                      mr: 1.5,
                      color: "#FFAC6E",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    {term.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: (theme) => theme.palette.blue.darkest,
                      fontSize: "1.1rem",
                    }}
                  >
                    {term.term}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    ...theme.mixins.drawerContent.bodyText,
                    ml: "2.2rem",
                    mb: 1,
                  }}
                >
                  {renderDefinitionWithLinks(term.definition, term.term)}
                </Typography>

                {/* Tier legend for outcome terms */}
                {term.tiers && (
                  <Box sx={{ ml: "2.2rem", mt: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Outcome Tiers:
                    </Typography>
                    <Stack spacing={2}>
                      {term.tiers.map((tier, tierIndex) => (
                        <Box
                          key={tierIndex}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: "11px",
                              height: "30px",
                              backgroundColor: (theme) =>
                                theme.palette.tiers[
                                  tier.color as keyof typeof theme.palette.tiers
                                ],
                              borderRadius: "3px",
                              flexShrink: 0,
                              mt: 0.5,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              lineHeight: 1.2,
                            }}
                          >
                            <Box component="span" sx={{ fontWeight: 500 }}>
                              {tier.tier}:
                            </Box>{" "}
                            {tier.description}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {term.seeAlso && (
                  <Typography
                    variant="body2"
                    sx={{
                      ml: "2.2rem",
                      mt: 1,
                      fontStyle: "italic",
                      fontSize: "0.85rem",
                    }}
                  >
                    See also:{" "}
                    <Box
                      component="span"
                      sx={{
                        color: "#FFAC6E",
                        cursor: "pointer",
                        textDecoration: "underline",
                        "&:hover": {
                          color: "#FF8A4A",
                        },
                      }}
                      onClick={() => handleTermClick(term.seeAlso!)}
                    >
                      {term.seeAlso}
                    </Box>
                  </Typography>
                )}
              </Box>
              {index < glossaryTerms.length - 1 && (
                <Divider sx={{ mt: 3, mx: "1rem" }} />
              )}
            </React.Fragment>
          ))}
        </Stack>
      </Box>
    </ContentWrapper>
  )
}

export default CurrentOpsContent
