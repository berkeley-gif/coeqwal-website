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
        text: "Along the way, California's dams and reservoirs, canals and pumps change how and where water flows.",
      },
      { text: "They form a vast, complex network that distributes water to:" },
    ],
    [{ text: "Agriculture for crops." }],
    [{ text: "Cities and communities for drinking and commercial use." }],
    [
      {
        text: "Rivers, wetlands, and fish, as well as the people who depend on healthy rivers for cultural practices, subsistence fishing, recreation, and clean water.",
      },
    ],
    [
      {
        text: "Yet the benefits and burdens of California's water system are not shared equally. To understand why, we need to look at how today's water system came to be.",
      },
    ],
  ],
} as const

export default function Background() {
  return <BackgroundNarrative />
}

function BackgroundNarrative() {
  const revealStarts = [0.18, 0.32, 0.46, 0.6] as const

  return (
    <StickyScrollSection
      id="frame-1"
      ariaLabel="California water system introduction"
      height="500vh"
      stickyTop="15vh"
      stickyHeight="70vh"
      offset={["start start", "end center"]}
    >
      <Box
        className="container text-section"
        sx={{
          maxWidth: "75ch",
          minHeight: "70vh",
          display: "grid",
          alignItems: "center",
        }}
      >
        <ScrollElement
          enter={[0, 0.04]}
          hold={[0.04, 1]}
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
