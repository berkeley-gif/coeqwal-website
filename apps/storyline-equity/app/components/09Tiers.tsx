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

export default function Tiers() {
  return (
    <Box
      component="section"
      id="frame-8"
      aria-label="A common yardstick for distributional equity tiers"
    >
      <ScrollSection height="250vh" offset={["start start", "end center"]}>
        <StickyElement top="15vh" style={{ height: "35vh" }}>
          <TiersIntroductionPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="155vh">
        <StickyElement top="15vh">
          <TiersComparisonProblemPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="165vh">
        <StickyElement top="15vh">
          <TiersSharedScalePanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="175vh">
        <StickyElement top="15vh">
          <TiersDistributionPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="170vh">
        <StickyElement top="15vh">
          <TiersOutcomePanel />
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

function TiersIntroductionPanel() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0.04, 0.12], [0, 1])
  const firstParagraphOpacity = useScrollValue(progress, [0.08, 0.18], [0, 1])
  const secondParagraphOpacity = useScrollValue(progress, [0.42, 0.5], [0, 1])

  return (
    <PanelContainer>
      <motion.div style={{ opacity: titleOpacity }}>
        <Box className="paragraph" component="header" role="banner">
          <SectionTitle
            text={"A common yardstick for distributional equity: Tiers"}
          />
        </Box>
      </motion.div>

      <Stack spacing={2} direction="column">
        <motion.div style={{ opacity: firstParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "Within this broader approach to equity, COEQWAL uses a tier-based interpretive framework to understand distributional equity, how benefits and impacts are shared across people, places, and ecosystems.",
              ]}
            />
          </Box>
        </motion.div>

        <motion.div style={{ opacity: secondParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "Each COEQWAL scenario evaluates key outcomes that people and ecosystems experience directly, including community water system deliveries, agricultural revenues, river ecology, Bay-Delta estuary conditions, winter-run salmon abundance, freshwater availability for in-Delta uses and exports, reservoir storage, and groundwater storage.",
              ]}
            />
          </Box>
        </motion.div>
      </Stack>
    </PanelContainer>
  )
}

function TiersComparisonProblemPanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.86]}
        exit={[0.86, 0.98]}
        animation="slideUp"
      >
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "These outcomes are measured in different ways, flows, agricultural productivity, salinity, and species populations, each with their own units, scales, and thresholds.",
              "Because of this, it is difficult to compare outcomes across sectors, understand overall system performance, or see who benefits, who is at risk, and how impacts are distributed across communities and ecosystems.",
            ]}
          />
        </Box>
      </ScrollElement>
    </PanelContainer>
  )
}

function TiersSharedScalePanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.8]}
        exit={[0.8, 0.94]}
        animation="slideUp"
      >
        <Stack spacing={2} direction="column">
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "To address this, COEQWAL translates these diverse outcomes into a shared interpretive scale, creating a common yardstick that allows users to compare conditions across sectors, locations, and communities.",
              ]}
            />
          </Box>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "You can think of tiers as a way of reading conditions along the system, showing where communities and ecosystems are thriving, functioning, at risk, or in critical condition.",
              ]}
            />
          </Box>
        </Stack>
      </ScrollElement>
    </PanelContainer>
  )
}

function TiersDistributionPanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.82]}
        exit={[0.82, 0.94]}
        animation="slideUp"
      >
        <Stack spacing={2} direction="column">
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "This framework is designed specifically to support distributional equity.",
                "It does not replace other forms of equity; it complements them by making patterns of distribution visible.",
                "The same scenario can produce very different conditions depending on where you are and what you depend on.",
              ]}
            />
          </Box>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "Each tier reflects how often conditions meet defined thresholds over time, rather than a single snapshot.",
                "This captures reliability, persistence, and exposure to risk, key dimensions of both resilience and equity.",
              ]}
            />
          </Box>
        </Stack>
      </ScrollElement>
    </PanelContainer>
  )
}

function TiersOutcomePanel() {
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
              "By comparing tier outcomes across sectors and locations, users can see who benefits from a given scenario, who faces increased risks, and how those patterns shift under different decisions.",
            ]}
          />
        </Box>
      </ScrollElement>
    </PanelContainer>
  )
}
