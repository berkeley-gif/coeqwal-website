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
      "A vast, interconnected network of rivers, reservoirs, aqueducts, dams, canals, and pumps that moves water across the state—from mountains and rivers to cities, farms, and ecosystems. It is one of the most complex water systems in the world.",
  },
  {
    icon: <AccountBalanceIcon />,
    term: "California Department of Water Resources (DWR)",
    definition:
      "A state agency that manages California's water resources. DWR operates much of the State Water Project and plays a central role in planning, modeling, and regulating water use in California.",
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
      "Choices made by agencies and water operators about how water is stored, moved, and delivered across the system. These decisions affect how much water reaches farms, cities, rivers, and wetlands.",
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
    definition:
      "Categories that organize related water scenarios. Themes help users find scenarios.",
  },
  {
    icon: <BarChartIcon />,
    term: "Scenario data",
    definition:
      "The detailed outputs of each modeled water scenario, including things like river flows, reservoir levels, salinity, or water deliveries. This data shows the anticipatedeffects of specific water management decisions.",
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
      "Computational model used to simulate how water moves through California's system.",
  },
  {
    icon: <Psychology />,
    term: "Actionable insights",
    definition:
      "Information and data that can be used to support decision-making, advocacy, or planning. COEQWAL helps turn complex scenario data into actionable insights for communities, agencies, and advocates.",
  },
]

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

    // Handle Central Valley links
    if (
      hasCentralValley &&
      !hasGroundwater &&
      !hasSurfaceWater &&
      !hasAllocation
    ) {
      const parts = definition.split("Central Valley")
      return (
        <>
          {parts[0]}
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
            onClick={() => handleTermClick("Central Valley")}
          >
            Central Valley
          </Box>
          {parts[1]}
        </>
      )
    }

    // Handle allocation links
    if (
      hasAllocation &&
      !hasGroundwater &&
      !hasSurfaceWater &&
      !hasCentralValley
    ) {
      const parts = definition.split("allocation")
      return (
        <>
          {parts[0]}
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
            onClick={() => handleTermClick("Allocation")}
          >
            allocation
          </Box>
          {parts[1]}
        </>
      )
    }

    // Handle surface water links
    if (
      hasSurfaceWater &&
      !hasGroundwater &&
      !hasAllocation &&
      !hasCentralValley
    ) {
      const parts = definition.split("surface water")
      return (
        <>
          {parts[0]}
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
          {parts[1]}
        </>
      )
    }

    // Handle groundwater links
    if (
      hasGroundwater &&
      !hasSurfaceWater &&
      !hasAllocation &&
      !hasCentralValley
    ) {
      const parts = definition.split("Groundwater")
      return (
        <>
          {parts[0]}
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
          {parts[1]}
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
        <Typography
          variant="subtitle2"
          sx={{
            ...theme.mixins.drawerContent.headingText,
            fontSize: "1.1rem",
            marginBottom: 2,
          }}
        >
          Water Terms Glossary
        </Typography>

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
                    color: "black",
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
