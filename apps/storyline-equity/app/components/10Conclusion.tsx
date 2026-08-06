"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const conclusionText = {
  en: {
    title: { text: "Putting equity into practice" },
    sections: [
      [
        [
          {
            text: "COEQWAL is a platform that brings a distributional equity lens to real-world water decisions.",
          },
          {
            text: "Making trade-offs visible through a shared framework, it gives communities, Tribes, and decision-makers a clearer understanding of who benefits, who is strained, and what alternatives exist.",
          },
          {
            text: "COEQWAL creates a transparent, shared space where choices can be weighed using the same evidence.",
          },
        ],
      ],
      [
        [
          {
            text: "By translating complex model outputs into clear, comparable tiers, COEQWAL provides a shared language for understanding impacts, evaluating trade-offs, and advocating for more equitable water futures.",
          },
          {
            text: "When the impacts on Tribes, rural communities, and ecosystems become visible, their needs can move from the margins to the center of decision-making.",
          },
          {
            text: "With COEQWAL, users can carry clear, credible insights into hearings, planning meetings, and negotiations, advocating for water futures that are not only resilient but also fairer and more just.",
          },
        ],
      ],
    ],
  },
} as const

export default function Conclusion() {
  return (
    <StickyScrollSection
      id="frame-9"
      ariaLabel="Putting equity into practice"
      height="340vh"
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
        {conclusionText.en.sections.map((groups, index) => {
          const start = index / conclusionText.en.sections.length
          const end = (index + 1) / conclusionText.en.sections.length
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
                  <SectionTitle text={conclusionText.en.title} />
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
