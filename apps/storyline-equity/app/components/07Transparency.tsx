"use client"

import { Box, Stack } from "@repo/ui/mui"
import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"

const transparencyText = {
  en: {
    title: { text: "Why transparency matters" },
    sections: [
      [
        [
          {
            text: "Today, water managers rely on complex technical models, such as CalSim, to guide allocation decisions.",
          },
          {
            text: "These tools are powerful, but they are also highly technical and difficult for non-experts to interpret.",
          },
        ],
      ],
      [
        [
          {
            text: "As a result, many communities cannot easily see how decisions are made, what assumptions shape outcomes, or whose priorities are embedded in the models.",
          },
          {
            text: "For example, a rule that allows more water to be diverted during dry periods may increase supplies for farms and cities, while reducing river flows needed for fish and ecosystems.",
          },
        ],
      ],
      [
        [
          {
            text: "It also becomes difficult to understand how conditions differ across the system, from upstream sources to downstream communities and ecosystems.",
          },
        ],
        [
          {
            text: "Without transparency, communities are marginalized from planning and negotiation.",
          },
          {
            text: "Their needs, values, and vulnerabilities remain invisible, even as decisions directly affect their water security.",
          },
        ],
      ],
      [
        [
          {
            text: "Understanding California's water system, both historically and technically, is essential for building a future that is resilient, fair, and shared.",
          },
        ],
      ],
    ],
  },
} as const

export default function Transparency() {
  return (
    <StickyScrollSection
      id="frame-6"
      ariaLabel="Why transparency matters"
      height="680vh"
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
        {transparencyText.en.sections.map((groups, index) => {
          const start = index / transparencyText.en.sections.length
          const end = (index + 1) / transparencyText.en.sections.length
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
                  <SectionTitle text={transparencyText.en.title} />
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
