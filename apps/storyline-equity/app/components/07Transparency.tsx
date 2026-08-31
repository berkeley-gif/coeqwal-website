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
            text: "Today, California relies on complex models such as CalSim3 to evaluate water-management strategies and inform decisions about water storage, flows, and deliveries.",
          },
          {
            text: "These models are powerful, but their simplified structure can hide the assumptions and priorities that shape how water is allocated, and reproduce existing inequities.",
          },
        ],
        [
          {
            text: "Because few people can run and interpret these models, communities often cannot see how decisions are represented, whose needs are prioritized, or how alternative management strategies could produce different outcomes.",
          },
        ],
      ],
      [
        [
          {
            text: "This lack of transparency limits meaningful participation in decisions that directly affect communities and ecosystems.",
          },
        ],
        [
          {
            text: "If knowledge is power, everyone needs insight into water management decisions.",
          },
          {
            text: "COEQWAL makes these decisions, assumptions, and consequences more visible and accessible.",
            mark: "strong",
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
              <Stack component="section" spacing={3.5}>
                {groups.map((sentences, paragraphIndex) => {
                  let revealRange: [number, number] | null = null
                  if (index === 0 && paragraphIndex === 1) {
                    revealRange = [0.18, 0.22]
                  } else if (index === 1 && paragraphIndex === 1) {
                    revealRange = [0.72, 0.76]
                  }

                  const paragraph = (
                    <Box key={paragraphIndex} component="article">
                      <Paragraph blocks={sentences} />
                    </Box>
                  )

                  return revealRange ? (
                    <ScrollElement
                      key={paragraphIndex}
                      enter={revealRange}
                      hold={[revealRange[1], 1]}
                    >
                      {paragraph}
                    </ScrollElement>
                  ) : (
                    paragraph
                  )
                })}
              </Stack>
            </ScrollElement>
          )
        })}
      </Box>
    </StickyScrollSection>
  )
}
