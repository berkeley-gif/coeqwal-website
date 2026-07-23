"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const resolutionText = {
  en: {
    title: { text: "How COEQWAL addresses equity" },
    sections: [
      [
        [
          {
            text: "So far, we've looked at how inequity in California water has developed over time.",
          },
          {
            text: "While COEQWAL cannot undo historical inequities, it can make them visible, clarify their impacts, and support more informed and equitable decisions moving forward.",
          },
        ],
      ],
      [
        [
          {
            text: "Another challenge is that researchers often evaluate impacts on different communities in different ways, using measures like flows, agricultural productivity, salinity, and species populations.",
          },
          {
            text: "Because these are so different, it can be difficult to compare them, understand trade-offs, or see how impacts are distributed across people and ecosystems.",
          },
        ],
      ],
      [
        [
          { text: "COEQWAL was created to respond to these challenges." },
          {
            text: "It is a platform and process designed to make California's water trade-offs visible, comparable, and accessible.",
          },
        ],
        [
          {
            text: "Trade-offs are unavoidable in water management, and balancing the needs of all is not easy, but impacts do not have to fall hardest on the same groups.",
          },
          {
            text: "COEQWAL helps make those trade-offs visible as decisions are considered.",
          },
        ],
      ],
    ],
  },
} as const

export default function Resolution() {
  return (
    <StickyScrollSection
      id="frame-7"
      ariaLabel="How COEQWAL addresses equity"
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
        {resolutionText.en.sections.map((groups, index) => {
          const start = index / resolutionText.en.sections.length
          const end = (index + 1) / resolutionText.en.sections.length
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
                  <SectionTitle text={resolutionText.en.title} />
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
