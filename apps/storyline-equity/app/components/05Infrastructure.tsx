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
            text: "In the 20th century, California's massive investments in water infrastructure reinforced inequities.",
          },
          {
            text: "Large-scale projects such as the Central Valley Project and the State Water Project transformed rivers into highly engineered systems designed to store and deliver water.",
          },
        ],
        [
          {
            segments: [
              { text: "These " },
              {
                text: "dams",
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
            text: "But the benefits of this infrastructure were not shared equally. Over time, these systems reshaped how water flows through the landscape, redirecting rivers and interrupting natural pathways.",
          },
        ],
      ],
      [
        [
          {
            text: "The environmental costs of this transformation were also substantial.",
          },
        ],
        [
          {
            text: "Nowhere is this change more visible than in the Delta. The Delta was once a vast landscape of tidal wetlands, floodplains, and branching waterways. Much of it was diked and drained, while levees and canals reshaped how water moves through the landscape.",
          },
        ],
        [
          {
            text: "Today, the Delta is both a living ecosystem and a critical hub in California’s engineered water system.",
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
          width: "min(75ch, calc(100vw - 6rem))",
          maxWidth: "75ch",
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
