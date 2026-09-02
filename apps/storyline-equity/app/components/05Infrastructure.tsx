"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import { InfrastructureColor, FreshWaterColor } from "./helpers/colorPalette"

const infrastructureText = {
  en: {
    title: { text: "How infrastructure shaped inequity" },
    sections: [
      [
        [
          {
            text: "In the 20th century, California's massive investments in water infrastructure reinforced existing inequities.",
          },
        ],
        [
          {
            segments: [
              {
                text: "Large-scale projects such as the Central Valley Project and the State Water Project transformed ",
              },
              { text: "rivers", mark: "river" },
              {
                text: " into highly engineered systems for storing and delivering water.",
              },
            ],
          },
        ],
        [
          {
            segments: [
              {
                text: "Dams",
                mark: "infrastructure",
                legend: {
                  color: InfrastructureColor,
                  shape: "triangle",
                  position: "after",
                },
              },
              { text: ", " },
              {
                text: "pumps",
                mark: "infrastructure",
                legend: {
                  color: InfrastructureColor,
                  shape: "circle",
                  position: "after",
                },
              },
              { text: ", and " },
              {
                text: "canals",
                mark: "infrastructure",
                legend: {
                  color: InfrastructureColor,
                  shape: "line",
                  position: "after",
                },
              },
              {
                text: " expanded water supplies for agricultural water districts and growing cities, fueling economic growth and population expansion.",
              },
            ],
          },
          {
            segments: [
              {
                text: "But their benefits and costs were not shared equally.",
                mark: "strong",
              },
            ],
          },
        ],
      ],
      [
        [
          {
            segments: [
              {
                text: "Nowhere is this more visible than in the Delta. Once a vast landscape of ",
              },
              { text: "tidal wetlands", mark: "freshwater" },
              { text: ", " },
              { text: "floodplains", mark: "freshwater" },
              { text: ", and meandering " },
              { text: "waterways", mark: "freshwater" },
              {
                text: ", much of the Delta was diked and drained to support agriculture and urbanization. ",
              },
              { text: "Levees and canals", mark: "infrastructure" },
              {
                text: " cemented the separation between land and water.",
              },
            ],
          },
        ],
        [
          {
            text: "Wetlands and their inhabitants were erased. Water was pumped to distant cities.",
          },
        ],
        [
          {
            text: "The result is the Delta we know today: a living but at-risk ecosystem and a critical, contested hub in California’s engineered water system.",
          },
        ],
      ],
    ],
  },
} as const

export default function Infrastructure() {
  return (
    <StickyScrollSection
      id="frame-4"
      ariaLabel="Institutions and infrastructure shaped inequity"
      height="510vh"
      stickyTop="15vh"
      stickyHeight="70vh"
      offset={["start start", "end center"]}
    >
      <Box
        className="container text-section"
        sx={{
          width: "min(75ch, calc(100vw - 6rem), calc(55dvw - 5rem))",
          maxWidth: "calc(55dvw - 5rem)",
          minHeight: "70vh",
          display: "grid",
          alignItems: "center",
        }}
      >
        <ScrollElement
          enter={[0, 0.04]}
          hold={[0.04, 0.4]}
          exit={[0.4, 0.44]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={infrastructureText.en.title} />
          </Box>
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph blocks={infrastructureText.en.sections[0][0]} />
            </Box>
            <Box component="article">
              <Paragraph
                blocks={infrastructureText.en.sections[0][1]}
                markSx={{
                  river: { color: FreshWaterColor, fontWeight: 700 },
                }}
              />
            </Box>
            <Box component="article">
              <Paragraph
                blocks={infrastructureText.en.sections[0][2]}
                markSx={{
                  infrastructure: {
                    color: InfrastructureColor,
                    fontWeight: 700,
                  },
                }}
              />
            </Box>
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.44, 0.46]}
          hold={[0.46, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph
                blocks={infrastructureText.en.sections[1][0]}
                markSx={{
                  freshwater: {
                    color: FreshWaterColor,
                    fontWeight: 700,
                  },
                  infrastructure: {
                    color: InfrastructureColor,
                    fontWeight: 700,
                  },
                }}
              />
            </Box>
            <Box component="article">
              <Paragraph blocks={infrastructureText.en.sections[1][1]} />
            </Box>
            <Box component="article">
              <Paragraph blocks={infrastructureText.en.sections[1][2]} />
            </Box>
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
