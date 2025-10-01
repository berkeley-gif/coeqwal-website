"use client"

import { Box, Typography, useTheme, Divider, Stack } from "@mui/material"
import { ContentWrapper } from "./ContentWrapper"
import { glossaryTerms, type GlossaryTerm, type TierInfo } from "../../../lib/glossary"
import React from "react"

export interface GlossaryContentProps {
  /** Function called when the close button is clicked */
  onClose: () => void
  /** Selected section ID passed from the drawer store */
  selectedSection?: string
  /** Selected term to scroll to */
  selectedTerm?: string
}

/**
 * Content component for the Glossary tab in the MultiDrawer
 */
export function GlossaryContent({
  onClose,
  selectedTerm,
}: GlossaryContentProps) {
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

  // TODO: Redo: Function to render definition text with clickable term links
  const renderDefinitionWithLinks = (
    definition: string,
    currentTerm: string,
  ) => {
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
      "Learn more in the Current operations theme",
    )

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
      const learnMoreText = "Learn more in the Current operations theme"
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
              // TODO: Navigate to Current operations theme page
              console.log("Navigate to Current operations theme")
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
                        px: (theme) => theme.spacing(2),
                        py: (theme) => theme.spacing(2),
                        pl: 1,
                        mb: (theme) => theme.spacing(2),
                        borderRadius: (theme) => theme.borderRadius.standard,
                        border: "1px solid rgba(255, 172, 110, 0.3)",
                        transition: "background-color 0.3s ease",
                      }
                    : {
                        px: (theme) => theme.spacing(2),
                        py: (theme) => theme.spacing(2),
                        pl: 1,
                        mb: (theme) => theme.spacing(2),
                      }
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
                  <Box sx={{ ml: "2.2rem", mt: 0.5, mb: 2 }}>
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

export default GlossaryContent
