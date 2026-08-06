"use client"

import { Paragraph, StorylineOpener, Text } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import ScrollIndicator from "./helpers/ScrollIndicator"

const openerText = {
  en: {
    title: {
      text: "How to Reach a More Equitable Water Future for California?",
    },
    subtitle: {
      text: "Exploring Equitable and Resilient Water Futures with COEQWAL",
    },
    paragraphs: [
      [
        {
          text: "Understanding equity in California water begins with a few fundamental questions:",
        },
      ],
      [
        { text: "Whose needs are being met... and who is left behind?" },
        {
          text: "Who bears the cost when water is scarce... and who benefits?",
        },
        {
          text: "How does our history, infrastructure, and decision-making influence who has access to water, and when?",
        },
      ],
      [
        {
          text: "By exploring water equity across future what-if scenarios, COEQWAL begins to answer a bigger question:",
        },
        {
          text: "How can all Californians get the water they need to survive and thrive for generations to come?",
        },
      ],
    ],
  },
} as const

export default function Opener() {
  const copy = openerText.en

  return (
    <StorylineOpener
      title={<Text value={copy.title} />}
      subtitle={<Text value={copy.subtitle} />}
      alignment="left"
      sx={{ maxWidth: "75ch", px: "0 !important" }}
      scrollIndicator={<ScrollIndicator animationComplete />}
    >
      <Box className="text-section">
        <Stack component="section" direction="column" spacing={2}>
          {copy.paragraphs.map((sentences, index) => (
            <Box
              key={index}
              component="article"
              sx={index === 1 ? { paddingLeft: "2rem" } : undefined}
            >
              <Paragraph blocks={sentences} />
            </Box>
          ))}
        </Stack>
      </Box>
    </StorylineOpener>
  )
}
