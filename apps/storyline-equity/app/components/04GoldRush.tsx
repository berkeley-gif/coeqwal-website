"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const goldRushText = {
  title: { text: "How inequity started and persists" },
  priorities: {
    introduction: [
      {
        text: "Today’s water rights reflect the values and priorities of colonial settlers during California’s Gold Rush:",
      },
    ],
    points: [
      {
        text: "Taking water and other resources with little regard for downstream impacts.",
      },
      {
        text: "Expansion of settlements and agriculture to produce crops for export.",
      },
      {
        text: "Diverting as much water as possible rather than leaving it in rivers.",
      },
    ],
  },
  exclusion: [
    {
      text: "New legal and political systems redefined who could access land and water.",
    },
    {
      text: "The 1850 Act for the Government and Protection of Indians legalized forced removal of Indigenous people from their homeland and sacred waters.",
    },
    {
      text: "Water rights doctrines instituted new patterns of water allocation.",
    },
    {
      text: "Riparian rights tied water access to owning land along a river.",
    },
    {
      text: "Appropriative rights gave priority to those who diverted water first, allowing early white settlers, miners, and farmers to establish priority access to water.",
    },
    {
      text: "New laws excluded Indigenous communities. In practice, only white men could claim and hold water rights. Those who secured these rights could deplete rivers without regard for downstream communities, ecosystems, or ways of life.",
    },
  ],
  legacy: [
    {
      text: "These systems of exclusion established a lasting hierarchy of water users. Settlers, supported by state and federal governments, dispossessed Indigenous Peoples of their lands and waters.",
    },
    {
      text: "This legacy continues to shape inequities in access to the water that sustains cultures, health and well-being.",
    },
  ],
} as const

export default function GoldRush() {
  return (
    <StickyScrollSection
      id="frame-3"
      ariaLabel="Gold Rush water rights and inequity"
      height="520vh"
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
        <ScrollElement
          enter={[0, 0.04]}
          hold={[0.04, 0.3]}
          exit={[0.3, 0.34]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={goldRushText.title} />
          </Box>
          <Stack component="section" spacing={2}>
            <Box component="article">
              <Paragraph blocks={goldRushText.priorities.introduction} />
            </Box>
            <Box component="ul" sx={{ margin: 0, paddingLeft: 4 }}>
              {goldRushText.priorities.points.map((point) => (
                <Box key={point.text} component="li" sx={{ paddingLeft: 1 }}>
                  <Paragraph blocks={[point]} />
                </Box>
              ))}
            </Box>
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.34, 0.38]}
          hold={[0.38, 0.66]}
          exit={[0.66, 0.7]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph blocks={[goldRushText.exclusion[0]]} />
            </Box>
            <Box component="article">
              <Paragraph blocks={goldRushText.exclusion.slice(1)} />
            </Box>
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.7, 0.74]}
          hold={[0.74, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={6}>
            {goldRushText.legacy.map((sentence) => (
              <Box key={sentence.text} component="article">
                <Paragraph blocks={[sentence]} />
              </Box>
            ))}
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
