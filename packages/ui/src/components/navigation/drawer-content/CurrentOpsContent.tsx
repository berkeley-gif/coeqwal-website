"use client"

import { Box, Typography, useTheme, Divider, Stack } from "@mui/material"
import { ContentWrapper } from "./ContentWrapper"

export interface CurrentOpsContentProps {
  /** Function called when the close button is clicked */
  onClose: () => void
  /** Selected section ID passed from the drawer store */
  selectedSection?: string
}

// Glossary term type definition
interface GlossaryTerm {
  emoji: string
  term: string
  definition: string
  seeAlso?: string
}

// Array of glossary terms
const glossaryTerms: GlossaryTerm[] = [
  {
    emoji: "🧾",
    term: "COEQWAL",
    definition:
      "A collaborative project focused on expanding access to water data, exploring alternative water management decisions, and supporting more equitable and inclusive stewardship of California's water system.",
  },
  {
    emoji: "💧",
    term: "California water system",
    definition:
      "A vast, interconnected network of rivers, reservoirs, aqueducts, dams, canals, and pumps that moves water across the state—from mountains and rivers to cities, farms, and ecosystems. It is one of the most complex water systems in the world.",
  },
  {
    emoji: "🏛️",
    term: "California Department of Water Resources (DWR)",
    definition:
      "A state agency that manages California's water resources. DWR operates much of the State Water Project and plays a central role in planning, modeling, and regulating water use in California.",
  },
  {
    emoji: "🏞️",
    term: "U.S. Bureau of Reclamation",
    definition:
      "A federal agency that manages water in the western U.S., including operation of the Central Valley Project in California. It works alongside state agencies and plays a key role in delivering water to farms, cities, and wildlife refuges.",
  },
  {
    emoji: "🔄",
    term: "Water management decisions",
    definition:
      "Choices made by agencies and water operators about how water is stored, moved, and delivered across the system. These decisions affect how much water reaches farms, cities, rivers, and wetlands—and when.",
  },
  {
    emoji: "🌐",
    term: "Water scenarios",
    definition:
      "Alternative sets of water management decisions modeled to explore different possible futures. Scenarios can help answer questions like: What if we prioritized fish flows in spring? What if we changed reservoir release timing? These are tools to explore tradeoffs and impacts.",
    seeAlso: "water management decisions",
  },
  {
    emoji: "🧭",
    term: "Scenario themes",
    definition:
      'Broad categories or ideas that organize related water scenarios—such as "climate adaptation," "ecosystem restoration," or "urban supply resilience." Themes help users find scenario groups based on shared goals or values.',
  },
  {
    emoji: "📊",
    term: "Scenario data",
    definition:
      "The detailed outputs of each modeled water scenario, including things like river flows, reservoir levels, salinity, or water deliveries. This data shows the effects of specific water management decisions over time.",
  },
  {
    emoji: "🚰",
    term: "Conveyance",
    definition:
      "The infrastructure used to move water from one place to another, such as canals, aqueducts, pipes, and pumps. Conveyance is central to California's water system, which transports water hundreds of miles between regions.",
  },
  {
    emoji: "💻",
    term: "Computer models / CalSim",
    definition:
      "Mathematical tools used to simulate how water moves through California's system. CalSim is one such model used by state and federal agencies to test water management decisions and understand their potential impacts before they happen in real life.",
  },
  {
    emoji: "🧠",
    term: "Actionable insights",
    definition:
      "Information or data that is understandable and specific enough to support decision-making, advocacy, or planning. COEQWAL helps turn complex scenario data into actionable insights for communities, agencies, and advocates alike.",
  },
]

/**
 * Content component for the Glossary tab in the MultiDrawer
 */
export function CurrentOpsContent({ onClose }: CurrentOpsContentProps) {
  const theme = useTheme()

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
            <Box key={index}>
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                <Typography variant="h6" sx={{ mr: 1, fontSize: "1.5rem" }}>
                  {term.emoji}
                </Typography>
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
                {term.definition}
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
                  See also: <i>{term.seeAlso}</i>
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
