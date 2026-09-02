"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import { FreshWaterColor } from "./helpers/colorPalette"

const historicalMarkSx = {
  freshwater: {
    color: FreshWaterColor,
    fontWeight: 700,
  },
}

const historicalContextText = {
  title: { text: "How Indigenous communities relate to water" },
  opening: [
    {
      text: "Across California, Indigenous communities have practiced place-based stewardship of their local land, rivers, and wildlife for millennia.",
    },
  ],
  tribalRelations: [
    {
      text: "To many California Tribes, salmon are relatives and rivers are sacred places.",
    },
    {
      segments: [
        {
          text: "Indigenous names for ",
        },
        { text: "rivers", mark: "freshwater" },
        {
          text: " and wetlands reflect these enduring relationships, carrying histories, knowledge, and responsibilities often obscured by today’s commonly used names.",
        },
      ],
    },
  ],
  mcCloud: [
    [
      {
        segments: [
          {
            text: 'For the Winnemem Wintu of the McCloud, or "Middle Water" River, ',
          },
          {
            text: "cold-water springs",
            mark: "freshwater",
            legend: {
              color: FreshWaterColor,
              shape: "circle",
              position: "after",
              outlineColor: "#fcfbfa",
              outlineWidth: 2,
            },
          },
          { text: " of Mount Shasta gave birth to humans and the Nur." },
        ],
      },
      {
        segments: [
          { text: "In the creation story, " },
          { text: "the Nur ", mark: "strong" },
          { text: " \u2014 " },
          { text: "Winter\u2013Run Chinook Salmon", mark: "strong" },
          { text: " \u2014 gave their voice to humans." },
        ],
      },
      {
        text: "In return, the Winnemem People speak for the salmon.",
      },
    ],
    [
      {
        text: "Through fishing practices, traditions, and ceremonies, the Winnemem Wintu honor the Nur as relatives.",
      },
      {
        text: "By protecting their springs and rivers, they protect salmon and their Tribe’s traditional way of life.",
      },
    ],
    [
      {
        segments: [
          {
            text: "European settlers fundamentally changed who could own land, claim water, and make decisions about both.",
            mark: "strong",
          },
        ],
      },
    ],
  ],
} as const

export default function HistoricalContext() {
  return (
    <StickyScrollSection
      id="frame-2"
      ariaLabel="Historical context for water equity"
      height="400vh"
      stickyTop="15vh"
      stickyHeight="70vh"
      offset={["start start", "end center"]}
    >
      <Box
        className="container text-section"
        sx={{
          width: "min(75ch, calc(55dvw - 5rem))",
          minHeight: "70vh",
          display: "grid",
          alignItems: "center",
        }}
      >
        <ScrollElement
          enter={[0, 0.01]}
          hold={[0.01, 0.52]}
          exit={[0.52, 0.54]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={historicalContextText.title} />
          </Box>
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph blocks={historicalContextText.opening} />
            </Box>
            <ScrollElement
              enter={[0.18, 0.22]}
              hold={[0.22, 0.52]}
              exit={[0.52, 0.54]}
              animation="slideUp"
            >
              <Stack component="section" spacing={3.5}>
                {historicalContextText.tribalRelations.map(
                  (paragraph, index) => (
                    <Box key={index} component="article">
                      <Paragraph
                        blocks={[paragraph]}
                        markSx={historicalMarkSx}
                      />
                    </Box>
                  ),
                )}
              </Stack>
            </ScrollElement>
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.54, 0.58]}
          hold={[0.58, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            {historicalContextText.mcCloud.map((sentences, index) => (
              <Box key={index} component="article">
                <Paragraph blocks={sentences} markSx={historicalMarkSx} />
              </Box>
            ))}
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
