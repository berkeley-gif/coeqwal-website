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
            text: "Today, California relies on complex models such as CalSim3 to inform decisions about water storage, flows, and deliveries.",
          },
        ],
        [
          {
            text: "These models simplify an extraordinarily complex water system.",
          },
          {
            text: "But that simplification can hide the assumptions, priorities, and operating rules that shape how water is allocated, and can reproduce existing inequities.",
          },
        ],
        [
          {
            text: "Because few people can run and interpret these models, communities often cannot see how water-management choices are represented, whose needs are prioritized, or how different choices can produce different outcomes.",
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
            text: "The water system we model today is not simply a physical system.",
          },
          {
            text: "It reflects generations of choices embedded in water rights, infrastructure, contracts, and operating rules.",
          },
        ],
        [
          {
            text: "COEQWAL makes these assumptions, choices, and consequences visible, comparable, and accessible.",
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
      height="300vh"
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
          hold={[0.04, 0.31]}
          exit={[0.31, 0.35]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={transparencyText.en.title} />
          </Box>
          <Stack component="section" spacing={3.5}>
            {transparencyText.en.sections[0].map(
              (sentences, paragraphIndex) => (
                <Box key={paragraphIndex} component="article">
                  <Paragraph blocks={sentences} />
                </Box>
              ),
            )}
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.35, 0.39]}
          hold={[0.39, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            {transparencyText.en.sections[1].map(
              (sentences, paragraphIndex) => (
                <Box key={paragraphIndex} component="article">
                  <Paragraph blocks={sentences} />
                </Box>
              ),
            )}
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
