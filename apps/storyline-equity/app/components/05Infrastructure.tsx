"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import { InfrastructureColor } from "./helpers/colorPalette"

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
            text: "Large-scale projects such as the Central Valley Project and the State Water Project transformed rivers into highly engineered systems for storing and delivering water.",
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
                text: "reservoirs",
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
                text: " expanded water supplies for agricultural water districts and growing cities, fueling economic growth and population expansion. But their benefits and costs were not shared equally.",
              },
            ],
          },
        ],
      ],
      [
        [
          {
            text: "Nowhere is this more visible than in the Delta. Once a vast landscape of tidal wetlands, floodplains, and meandering waterways, much of the Delta was diked and drained to support agriculture and urbanization. Levees and canals cemented the separation between land and water.",
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
        {infrastructureText.en.sections.map((groups, index) => {
          const start = index / infrastructureText.en.sections.length
          const end = (index + 1) / infrastructureText.en.sections.length
          return (
            <ScrollElement
              key={index}
              enter={[start, start + 0.04]}
              hold={[start + 0.04, end - 0.04]}
              exit={[end - 0.04, end]}
              animation="slideUp"
              style={{ gridArea: "1 / 1" }}
            >
              {index === 0 ? (
                <Box component="header">
                  <SectionTitle text={infrastructureText.en.title} />
                </Box>
              ) : null}
              <Stack component="section" spacing={3.5}>
                {groups.map((sentences, paragraphIndex) => (
                  <Box key={paragraphIndex} component="article">
                    <Paragraph
                      blocks={sentences}
                      markSx={{
                        infrastructure: {
                          color: InfrastructureColor,
                          fontWeight: 700,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </ScrollElement>
          )
        })}
      </Box>
    </StickyScrollSection>
  )
}
