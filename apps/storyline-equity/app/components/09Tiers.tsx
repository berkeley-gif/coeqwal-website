"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const tiersText = {
  en: {
    title: { text: "A common yardstick for distributional equity: Tiers" },
    sections: [
      [
        [
          {
            text: "Within this broader approach to equity, COEQWAL uses a tier-based interpretive framework to understand distributional equity, how benefits and impacts are shared across people, places, and ecosystems.",
          },
        ],
        [
          {
            text: "Each COEQWAL scenario evaluates key outcomes that people and ecosystems experience directly, including community water system deliveries, agricultural revenues, river ecology, Bay-Delta estuary conditions, winter-run salmon abundance, freshwater availability for in-Delta uses and exports, reservoir storage, and groundwater storage.",
          },
        ],
      ],
      [
        [
          {
            text: "These outcomes are measured in different ways, flows, agricultural productivity, salinity, and species populations, each with their own units, scales, and thresholds.",
          },
          {
            text: "Because of this, it is difficult to compare outcomes across sectors, understand overall system performance, or see who benefits, who is at risk, and how impacts are distributed across communities and ecosystems.",
          },
        ],
      ],
      [
        [
          {
            text: "To address this, COEQWAL translates these diverse outcomes into a shared interpretive scale, creating a common yardstick that allows users to compare conditions across sectors, locations, and communities.",
          },
        ],
        [
          {
            text: "You can think of tiers as a way of reading conditions along the system, showing where communities and ecosystems are thriving, functioning, at risk, or in critical condition.",
          },
        ],
      ],
      [
        [
          {
            text: "This framework is designed specifically to support distributional equity.",
          },
          {
            text: "It does not replace other forms of equity; it complements them by making patterns of distribution visible.",
          },
          {
            text: "The same scenario can produce very different conditions depending on where you are and what you depend on.",
          },
        ],
        [
          {
            text: "Each tier reflects how often conditions meet defined thresholds over time, rather than a single snapshot.",
          },
          {
            text: "This captures reliability, persistence, and exposure to risk, key dimensions of both resilience and equity.",
          },
        ],
      ],
      [
        [
          {
            text: "By comparing tier outcomes across sectors and locations, users can see who benefits from a given scenario, who faces increased risks, and how those patterns shift under different decisions.",
          },
        ],
      ],
    ],
  },
} as const

export default function Tiers() {
  return (
    <StickyScrollSection
      id="frame-8"
      ariaLabel="A common yardstick for distributional equity tiers"
      height="850vh"
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
        {tiersText.en.sections.map((groups, index) => {
          const start = index / tiersText.en.sections.length
          const end = (index + 1) / tiersText.en.sections.length
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
                  <SectionTitle text={tiersText.en.title} />
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
