"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

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
            text: "These dams, reservoirs, and canals expanded water supplies for agricultural water districts and growing cities, fueling economic growth and population expansion.",
          },
          {
            text: "Over time, these systems reshaped how water flows through the landscape, redirecting rivers, interrupting natural pathways, and prioritizing some uses over others.",
          },
        ],
      ],
      [
        [
          {
            text: "But these systems further preserved and intensified inequities in water access.",
          },
          {
            text: "Senior water-rights holders, largely large farms and landowners, were guaranteed supplies.",
          },
          {
            text: "Meanwhile, many Tribes, small rural communities, and disadvantaged areas were left behind.",
          },
        ],
      ],
      [
        [
          { text: "The environmental costs were also largely overlooked." },
          {
            text: "Dams blocked more than 95% of the historical habitat used by salmon.",
          },
          { text: "Rivers were dewatered and fragmented." },
          {
            text: "California's freshwater ecosystems have suffered from degradation of water quality, loss of wetlands, fish population declines, and the extinction of species.",
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
              <Stack component="section" spacing={2}>
                {groups.map((sentences, paragraphIndex) => (
                  <Box key={paragraphIndex} component="article">
                    <Paragraph blocks={sentences} />
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
