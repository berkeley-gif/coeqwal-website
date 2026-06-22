"use client"

import type { ReactNode } from "react"
import { Box, Stack, Typography } from "@repo/ui/mui"
import { ScrollElement, ScrollSection, StickyElement } from "@repo/scrollytelling"

type ProgressRange = [number, number]

type NarrativeParagraph = {
  sentences: ReactNode[]
  indent?: boolean
}

type NarrativeGroup = {
  enter: ProgressRange
  hold?: ProgressRange
  exit?: ProgressRange
  paragraphs: NarrativeParagraph[]
}

interface NarrativeFrameSectionProps {
  id: string
  ariaLabel: string
  height: string
  title: ReactNode
  subtitle?: ReactNode
  titleEnter?: ProgressRange
  titleHold?: ProgressRange
  titleExit?: ProgressRange
  maxWidth?: string
  groups: NarrativeGroup[]
}

function renderParagraph(
  paragraph: NarrativeParagraph,
  groupIndex: number,
  paragraphIndex: number,
) {
  return (
    <Box
      key={`${groupIndex}-${paragraphIndex}`}
      className="paragraph"
      component="article"
      sx={paragraph.indent ? { paddingLeft: "2rem" } : undefined}
    >
      {paragraph.sentences.map((sentence, sentenceIndex) => (
        <Typography
          key={`${groupIndex}-${paragraphIndex}-${sentenceIndex}`}
          variant="body1"
        >
          {sentence}
        </Typography>
      ))}
    </Box>
  )
}

export default function NarrativeFrameSection({
  id,
  ariaLabel,
  height,
  title,
  subtitle,
  titleEnter = [0.05, 0.18],
  titleHold = [0.18, 0.3],
  titleExit,
  maxWidth = "60%",
  groups,
}: NarrativeFrameSectionProps) {
  return (
    <ScrollSection id={id} ariaLabel={ariaLabel} height={height}>
      <StickyElement top="15vh">
        <Box className="container" sx={{ maxWidth }}>
          <ScrollElement enter={titleEnter} hold={titleHold} exit={titleExit}>
            <Box className="paragraph" component="header" role="banner">
              <Typography variant="h3" gutterBottom>
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
          </ScrollElement>

          <Stack spacing={3} direction="column" component="section" role="region">
            {groups.map((group, groupIndex) => (
              <ScrollElement
                key={`${id}-group-${groupIndex}`}
                enter={group.enter}
                hold={group.hold}
                exit={group.exit}
              >
                <Stack spacing={2} direction="column">
                  {group.paragraphs.map((paragraph, paragraphIndex) =>
                    renderParagraph(paragraph, groupIndex, paragraphIndex),
                  )}
                </Stack>
              </ScrollElement>
            ))}
          </Stack>
        </Box>
      </StickyElement>
    </ScrollSection>
  )
}