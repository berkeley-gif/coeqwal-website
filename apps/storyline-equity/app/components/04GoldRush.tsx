"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const goldRushText = {
  title: { text: "How inequity started and persists" },
  priorities: {
    introduction: [
      {
        text: "Today’s water rights reflect the values and priorities of California’s Gold Rush:",
      },
    ],
    points: [
      {
        text: "Rapid resource extraction with no regard for downstream impacts.",
      },
      {
        text: "Expansion of settlement and export-driven agriculture.",
      },
      {
        text: 'Maximized water diversions to avoid "waste" of water.',
      },
    ],
  },
  exclusion: [
    {
      text: "New legal and political systems redefined who could access land and water.",
    },
    {
      text: "Indigenous water practices were communal, seasonal and protective of water flows.",
    },
    { text: "New laws excluded them." },
    { text: "In practice, only white men could claim and hold water rights." },
    {
      text: "In effect, rivers could go dry without regard for downstream communities, ecosystems, or ways of life.",
    },
  ],
  legacy: [
    {
      text: "Legalized systems of exclusion began with European settlement and cemented a lasting hierarchy of “legitimate” water users.",
    },
    {
      text: "Much of California’s available water was claimed under these early rights, locking in inequities that dominate today’s water allocations.",
    },
    {
      text: "The state’s systematic dispossession of California's Indigenous peoples from their land, water and ways of life did not happen in isolation.",
    },
    {
      text: "It was one dimension of state-sponsored policies and acts of violence, genocide and cultural erasure.",
    },
    {
      text: "This racist legacy persists by denying the rights to water that sustain cultures, health and well-being.",
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
            <Paragraph blocks={goldRushText.priorities.introduction} />
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
          <Stack component="section" spacing={1.25}>
            <Paragraph blocks={[goldRushText.exclusion[0]]} />
            <Paragraph blocks={goldRushText.exclusion.slice(1)} />
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.7, 0.74]}
          hold={[0.74, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack spacing={6}>
            <Stack component="section" spacing={1.25}>
              <Paragraph blocks={goldRushText.legacy.slice(0, 2)} />
            </Stack>
            <Stack spacing={1.25}>
              <Paragraph blocks={goldRushText.legacy.slice(2)} />
            </Stack>
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
