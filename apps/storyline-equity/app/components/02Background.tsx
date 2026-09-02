"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const backgroundText = {
  title: { text: "How California's water flows" },
  paragraphs: [
    [
      { text: "California's water begins in mountain headwaters." },
      { text: "Water flows downstream through rivers toward the ocean." },
      {
        text: "Along the way, California's dams, reservoirs, canals and pumps reshape how and where water flows.",
      },
      {
        text: "Together, they form a vast, complex network that distributes water to:",
      },
    ],
    [
      {
        segments: [
          { text: "Agriculture", mark: "strong" },
          { text: " for crops." },
        ],
      },
    ],
    [
      {
        segments: [
          { text: "Cities", mark: "strong" },
          { text: " and " },
          { text: "communities", mark: "strong" },
          { text: " for drinking and commercial use." },
        ],
      },
    ],
    [
      {
        segments: [
          { text: "Rivers", mark: "strong" },
          { text: ", " },
          { text: "wetlands", mark: "strong" },
          { text: ", " },
          { text: "fish", mark: "strong" },
          {
            text: ", and people who depend on healthy rivers for cultural practices, subsistence fishing, recreation, and clean water.",
          },
        ],
      },
    ],
    [
      {
        text: "Yet the benefits and burdens of California's water system are not shared equally. ",
      },
      {
        segments: [
          { text: "To understand why, we need to look at " },
          {
            text: " how today's water system came to be",
            mark: "strong",
          },
          { text: "." },
        ],
      },
    ],
  ],
} as const

export default function Background() {
  return <BackgroundNarrative />
}

function BackgroundNarrative() {
  const revealStarts = [0.1, 0.27, 0.44, 0.6] as const

  return (
    <StickyScrollSection
      id="frame-1"
      ariaLabel="California water system introduction"
      height="350vh"
      stickyTop="15vh"
      stickyHeight="70vh"
      offset={["start start", "end center"]}
    >
      <Box
        className="container text-section"
        sx={{
          maxWidth: "min(75ch, calc(55dvw - 5rem))",
          minHeight: "70vh",
          display: "grid",
          alignItems: "center",
        }}
      >
        <ScrollElement
          enter={[0, 0.01]}
          hold={[0.01, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={backgroundText.title} />
          </Box>
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph blocks={backgroundText.paragraphs[0]} />
            </Box>
            <Stack spacing={3.5}>
              {backgroundText.paragraphs.slice(1).map((paragraph, index) => {
                const start = revealStarts[index]!

                return (
                  <ScrollElement
                    key={index}
                    enter={[start, start + 0.035]}
                    hold={[start + 0.035, 1]}
                  >
                    <Paragraph blocks={paragraph} />
                  </ScrollElement>
                )
              })}
            </Stack>
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
