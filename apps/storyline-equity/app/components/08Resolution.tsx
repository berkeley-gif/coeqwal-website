"use client"

import { motion } from "@repo/motion"
import type { ReactNode } from "react"
import {
  ScrollElement,
  ScrollSection,
  StickyElement,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

export default function Resolution() {
  return (
    <Box
      component="section"
      id="frame-7"
      aria-label="How COEQWAL addresses equity"
    >
      <ScrollSection height="250vh" offset={["start start", "end center"]}>
        <StickyElement top="15vh" style={{ height: "35vh" }}>
          <ResolutionPurposePanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="155vh">
        <StickyElement top="15vh">
          <ResolutionComparisonPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="195vh">
        <StickyElement top="15vh">
          <ResolutionTradeoffsPanel />
        </StickyElement>
      </ScrollSection>
    </Box>
  )
}

function PanelContainer({ children }: { children: ReactNode }) {
  return (
    <Box
      className="container"
      sx={{
        maxWidth: "60%",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {children}
    </Box>
  )
}

function ResolutionPurposePanel() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0.04, 0.12], [0, 1])
  const paragraphOpacity = useScrollValue(progress, [0.08, 0.18], [0, 1])

  return (
    <PanelContainer>
      <motion.div style={{ opacity: titleOpacity }}>
        <Box className="paragraph" component="header" role="banner">
          <SectionTitle text={"How COEQWAL addresses equity"} />
        </Box>
      </motion.div>

      <motion.div style={{ opacity: paragraphOpacity }}>
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "So far, we've looked at how inequity in California water has developed over time.",
              "While COEQWAL cannot undo historical inequities, it can make them visible, clarify their impacts, and support more informed and equitable decisions moving forward.",
            ]}
          />
        </Box>
      </motion.div>
    </PanelContainer>
  )
}

function ResolutionComparisonPanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.78]}
        exit={[0.78, 0.92]}
        animation="slideUp"
      >
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "Another challenge is that researchers often evaluate impacts on different communities in different ways, using measures like flows, agricultural productivity, salinity, and species populations.",
              "Because these are so different, it can be difficult to compare them, understand trade-offs, or see how impacts are distributed across people and ecosystems.",
            ]}
          />
        </Box>
      </ScrollElement>
    </PanelContainer>
  )
}

function ResolutionTradeoffsPanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.88]}
        exit={[0.88, 0.98]}
        animation="slideUp"
      >
        <Stack spacing={2} direction="column">
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "COEQWAL was created to respond to these challenges.",
                "It is a platform and process designed to make California's water trade-offs visible, comparable, and accessible.",
              ]}
            />
          </Box>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "Trade-offs are unavoidable in water management, and balancing the needs of all is not easy, but impacts do not have to fall hardest on the same groups.",
                "COEQWAL helps make those trade-offs visible as decisions are considered.",
              ]}
            />
          </Box>
        </Stack>
      </ScrollElement>
    </PanelContainer>
  )
}
