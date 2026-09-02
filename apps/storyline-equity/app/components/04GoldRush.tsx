"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const goldRushText = {
  title: { text: "How inequity took root" },
  opening: [
    {
      text: "Today’s water rights reflect laws and priorities established during California’s Gold Rush.",
    },
    {
      text: "As prospectors rushed to California’s Yuba River, the state’s first governor called for a “war of extermination” against Indigenous people. The 1850 Act for the Government and Protection of Indians legalized the forced removal of Indigenous people from their homeland and sacred waters.",
    },
  ],
  transformation: [
    {
      text: "The dispossession of the Nisenan people sparked a legal and physical transformation of the Yuba River that bled into all of California’s waters.",
    },
    {
      text: "With freedom to profit off the land, prospectors found that blasting high-pressure jets of water onto hillsides accelerated gold extraction. Their need for water far from the river justified a new type of “appropriative” water right: whoever first diverted the water got priority rights to the water, as long as they were white and male.",
    },
    {
      text: "Miners built miles of ditches to divert streams to hydraulic mines, then dumped mountains of debris into the rivers, burying habitat and flooding downstream farms.",
    },
  ],
  legacy: [
    {
      text: "As mining declined, irrigation districts and hydropower companies acquired many of these senior water rights.",
    },
    {
      text: "This created a lasting hierarchy of water access. Water could be diverted with little regard for downstream communities, ecosystems, or ways of life, and that legacy continued to shape California’s water system today.",
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
          width: "min(75ch, calc(100vw - 6rem), calc(55dvw - 5rem))",
          maxWidth: "calc(55dvw - 5rem)",
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
          <Stack component="section" spacing={3.5}>
            {goldRushText.opening.map((paragraph) => (
              <Box key={paragraph.text} component="article">
                <Paragraph blocks={[paragraph]} />
              </Box>
            ))}
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
            {goldRushText.transformation.map((paragraph) => (
              <Box key={paragraph.text} component="article">
                <Paragraph blocks={[paragraph]} />
              </Box>
            ))}
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
