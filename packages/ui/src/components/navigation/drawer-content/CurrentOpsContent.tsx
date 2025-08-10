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

export interface CurrentOpsContentProps {
  /** Function called when the close button is clicked */
  onClose: () => void
  /** Selected section ID passed from the drawer store */
  selectedSection?: string
  /** Selected term to scroll to */
  selectedTerm?: string
}

// Glossary term type definition
interface GlossaryTerm {
  icon: React.ReactNode
  term: string
  definition: string
  seeAlso?: string
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
    icon: <WaterIcon />,
    term: "California water system",
    definition:
      "A vast, interconnected network of rivers, reservoirs, aqueducts, dams, canals, and pumps that moves water across the state—from mountains and rivers to communities, farms, and ecosystems. It is one of the most complex water systems in the world.",
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
      "Computational model used to simulate how water moves through California's Central Valley water system. CalSim is used by the state's Department of Water Resources and the federal U.S. Bureau of Reclamation to model the storage, conveyance, and delivery of water in the Central Valley. COEQWAL is using this same open-source model to explore how a broad range of water management decisions could impact the Central Valley.",
  },
  {
    icon: <ThermostatIcon />,
    term: "Changing climate",
    definition:
      "The ongoing shifts in California's climate patterns, including rising temperatures, changing precipitation patterns, reduced snowpack, more extreme weather events, and sea level rise. These changes affect water availability, timing, and quality.",
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
    term: "SGMA - San Joaquin Valley Only",
    definition:
      "SGMA implementation focused exclusively on the San Joaquin Valley groundwater basins. This scenario applies sustainable groundwater management requirements only to the southern Central Valley, maintaining current land use patterns and agricultural practices while establishing groundwater sustainability by 2040.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: <WaterIcon />,
    term: "SGMA - San Joaquin Valley with Agricultural Reductions",
    definition:
      "SGMA implementation in the San Joaquin Valley that includes projected agricultural land use reductions to achieve groundwater sustainability. This scenario accounts for anticipated fallowing of farmland and shifts in crop patterns as groundwater agencies work to balance pumping with recharge.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: <WaterIcon />,
    term: "SGMA - Sacramento and San Joaquin Valleys",
    definition:
      "Comprehensive SGMA implementation across both the Sacramento Valley and San Joaquin Valley groundwater basins. This scenario extends sustainable groundwater management requirements to the entire Central Valley, establishing coordinated groundwater sustainability across both regions by 2040.",
    seeAlso: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    icon: <WaterIcon />,
    term: "SGMA - Sacramento and San Joaquin Valleys with Agricultural Reductions",
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
    // Check for "Groundwater", "surface water", "allocation", and "Central Valley" in the definition
    const hasGroundwater =
      definition.includes("Groundwater") && currentTerm !== "Groundwater"
    const hasSurfaceWater =
      definition.includes("surface water") && currentTerm !== "Surface water"
    const hasAllocation =
      definition.includes("allocation") && currentTerm !== "Allocation"
    const hasCentralValley =
      definition.includes("Central Valley") && currentTerm !== "Central Valley"

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
      !hasCentralValley
    ) {
      return createLinksForSingleTerm(definition, "Groundwater", "Groundwater")
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
        <Stack spacing={3}>
          {glossaryTerms.map((term, index) => (
            <Box
              key={index}
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
                      borderRadius: 2,
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
                  fontSize: "0.95rem",
                }}
              >
                {renderDefinitionWithLinks(term.definition, term.term)}
              </Typography>

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

              {index < glossaryTerms.length - 1 && (
                <Divider sx={{ mt: 3, mx: "1rem" }} />
              )}
            </Box>
          ))}
        </Stack>
      </Box>
    </ContentWrapper>
  )
}

export default CurrentOpsContent
