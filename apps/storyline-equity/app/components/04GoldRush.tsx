"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import { InfrastructureColor } from "./helpers/colorPalette"

const goldRushMarkSx = {
  infrastructure: {
    color: InfrastructureColor,
    fontWeight: 700,
  },
} as const

const goldRushText = {
  title: { text: "How inequity took root" },
  opening: [
    [
      {
        text: "Today’s water rights reflect laws and priorities established during California’s Gold Rush.",
      },
    ],
    [
      {
        text: "As prospectors rushed to California’s Yuba River, the state’s first governor called for a “war of extermination” against Indigenous people.",
      },
      {
        text: "The 1850 Act for the Government and Protection of Indians legalized the forced removal of Indigenous people from their homeland and sacred waters.",
      },
    ],
  ],
  transformation: [
    [
      {
        segments: [
          {
            text: "With freedom to profit off the land, prospectors found that blasting hillsides with ",
          },
          {
            text: "jets of high-pressure water",
            mark: "infrastructure",
            legend: {
              color: InfrastructureColor,
              shape: "circle",
              position: "after",
            },
          },
          { text: " yielded more gold." },
        ],
      },
      {
        text: "Their need for water far from the river inspired a new type of “appropriative” water right.",
      },
      {
        text: "Whoever first diverted the water got priority rights to the water, as long as they were white and male.",
      },
    ],
    [
      {
        segments: [
          { text: "Miners built miles of " },
          {
            text: "ditches",
            mark: "infrastructure",
            legend: {
              color: InfrastructureColor,
              shape: "line",
              position: "after",
            },
          },
          {
            text: " to divert streams to hydraulic mines, then dumped mountains of debris into the rivers.",
          },
        ],
      },
      {
        text: "As mining declined, irrigation districts and hydropower companies acquired many of these senior water rights.",
      },
    ],
  ],
  legacy: [
    {
      text: "The violent dispossession of Native communities was codified through exclusive land and water rights that continue to shape California’s water.",
    },
    {
      text: "With senior rights, water can be diverted with little regard for downstream communities, ecosystems, or ways of life.",
    },
  ],
} as const

export default function GoldRush() {
  return (
    <StickyScrollSection
      id="frame-3"
      ariaLabel="Gold Rush water rights and inequity"
      height="450vh"
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
          hold={[0.04, 0.22]}
          exit={[0.22, 0.26]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={goldRushText.title} />
          </Box>
          <Stack component="section" spacing={3.5}>
            {goldRushText.opening.map((sentences, index) => (
              <Box key={index} component="article">
                <Paragraph blocks={sentences} />
              </Box>
            ))}
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.26, 0.3]}
          hold={[0.3, 0.66]}
          exit={[0.66, 0.7]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph
                blocks={goldRushText.transformation[0]}
                markSx={goldRushMarkSx}
              />
            </Box>
            <ScrollElement
              enter={[0.48, 0.52]}
              hold={[0.52, 0.66]}
              animation="slideUp"
            >
              <Box component="article">
                <Paragraph
                  blocks={goldRushText.transformation[1]}
                  markSx={goldRushMarkSx}
                />
              </Box>
            </ScrollElement>
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.7, 0.74]}
          hold={[0.74, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            {goldRushText.legacy.map((paragraph) => (
              <Box key={paragraph.text} component="article">
                <Paragraph blocks={[paragraph]} />
              </Box>
            ))}
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
