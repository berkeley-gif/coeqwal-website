"use client"

import { Paragraph, StorylineOpener, Text } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import { FloatingBubbles } from "./helpers/FloatingBubbles"
import ScrollIndicator from "./helpers/ScrollIndicator"

const openerText = {
  en: {
    title: {
      text: "How can California move to a more equitable water future?",
    },
    subtitle: {
      text: "Exploring equitable and resilient water futures with COEQWAL",
    },
    paragraphs: [
      [
        {
          text: "Understanding equity in California water begins with a few fundamental questions:",
        },
      ],
      [
        { text: "Whose needs are being met … and who is left behind?" },
        {
          text: "Who bears the cost when water is scarce … and who benefits?",
        },
        {
          text: "How have history, infrastructure, and water management decision-making shaped who has access to water, and when?",
        },
      ],
      [
        {
          text: "By exploring water equity across different what-if scenarios, COEQWAL helps us explore a bigger question:",
        },
        {
          text: "How can California better meet the needs of communities and ecosystems, fairly and resiliently, for generations to come?",
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
      sx={{
        width: "100%",
        maxWidth: "none",
        px: "0 !important",
        "& > .MuiTypography-h1, & > .MuiTypography-h3": {
          maxWidth: { xs: "100%", lg: "calc(55dvw - 5rem)" },
        },
      }}
      scrollIndicator={<ScrollIndicator animationComplete />}
    >
      <Box
        className="text-section"
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: { xs: "75ch", lg: "calc(55dvw - 5rem)" },
        }}
      >
        <Stack component="section" spacing={2}>
          {copy.paragraphs.map((sentences, index) => (
            <Box key={index} component="article">
              <Paragraph blocks={sentences} />
            </Box>
          ))}
        </Stack>
      </Box>
    </StorylineOpener>
  )
}

// Rendered at the page root (outside the Scrollama/StickyScrollSection tree)
// so its `position: fixed` resolves against the real viewport instead of a
// transformed scroll-container ancestor, matching how DynamicMap is hoisted.
export function OpenerVisual({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null

  return (
    <Box
      aria-hidden="true"
      sx={{
        display: { xs: "none", lg: "grid" },
        position: "fixed",
        top: 0,
        right: 0,
        width: "45dvw",
        height: "100dvh",
        gridTemplateRows: "15dvh 85dvh",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <Box component="header" sx={{ minHeight: 0 }} />
      <Box
        sx={{
          position: "relative",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FloatingBubbles showPhotos align="center" />
      </Box>
    </Box>
  )
}
