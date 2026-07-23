"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const climateResilienceText = {
  en: {
    title: { text: "How inequity persists under climate change" },
    sections: [
      [
        [
          {
            text: "Over time, the worldviews, rights, and values of the people of California have changed.",
          },
          {
            text: "Environmental protections such as the Endangered Species Act and Clean Water Act, recognition of the human right to water, and implementation of the Sustainable Groundwater Management Act all represent meaningful progress toward a more equitable water management system.",
          },
        ],
      ],
      [
        [
          {
            text: "Yet inequities remain embedded in our institutions, infrastructure, and water-allocation decisions.",
          },
          {
            text: "Water rights, contracts, and operational rules lock us into historical values that do not reflect those of present-day society.",
          },
        ],
      ],
      [
        [
          {
            text: "As climate change disrupts our water system, bringing more intense droughts and floods, the most vulnerable are likely to bear the burden.",
          },
        ],
        [
          {
            text: "As conditions in headwaters, tributaries, and rivers become more variable, these stresses ripple through the system, often intensifying inequities downstream.",
          },
          {
            text: "Some communities and sectors are buffered by infrastructure, contracts, or senior rights.",
          },
          {
            text: "Others, often Tribes, rural communities, and ecosystems, face repeated crises.",
          },
          { text: "Water is rarely sufficient to meet every need at once." },
          {
            text: "The central question is not whether trade-offs exist, but why the same groups so often bear the costs.",
          },
        ],
      ],
    ],
  },
} as const

export default function ClimateResilience() {
  return (
    <StickyScrollSection
      id="frame-5"
      ariaLabel="Climate change and resilience"
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
        {climateResilienceText.en.sections.map((groups, index) => {
          const start = index / climateResilienceText.en.sections.length
          const end = (index + 1) / climateResilienceText.en.sections.length
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
                  <SectionTitle text={climateResilienceText.en.title} />
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
