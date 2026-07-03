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
import { Box } from "@repo/ui/mui"

export default function Conclusion() {
  return (
    <Box
      component="section"
      id="frame-9"
      aria-label="Putting equity into practice"
    >
      <ScrollSection height="250vh" offset={["start start", "end center"]}>
        <StickyElement top="15vh" style={{ height: "35vh" }}>
          <ConclusionPracticePanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="225vh">
        <StickyElement top="15vh">
          <ConclusionActionPanel />
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

function ConclusionPracticePanel() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0.04, 0.12], [0, 1])
  const paragraphOpacity = useScrollValue(progress, [0.08, 0.18], [0, 1])

  return (
    <PanelContainer>
      <motion.div style={{ opacity: titleOpacity }}>
        <Box className="paragraph" component="header" role="banner">
          <SectionTitle text={"Putting equity into practice"} />
        </Box>
      </motion.div>

      <motion.div style={{ opacity: paragraphOpacity }}>
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "COEQWAL is a platform that brings a distributional equity lens to real-world water decisions.",
              "Making trade-offs visible through a shared framework, it gives communities, Tribes, and decision-makers a clearer understanding of who benefits, who is strained, and what alternatives exist.",
              "COEQWAL creates a transparent, shared space where choices can be weighed using the same evidence.",
            ]}
          />
        </Box>
      </motion.div>
    </PanelContainer>
  )
}

function ConclusionActionPanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.9]}
        exit={[0.9, 0.985]}
        animation="slideUp"
      >
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "By translating complex model outputs into clear, comparable tiers, COEQWAL provides a shared language for understanding impacts, evaluating trade-offs, and advocating for more equitable water futures.",
              "When the impacts on Tribes, rural communities, and ecosystems become visible, their needs can move from the margins to the center of decision-making.",
              "With COEQWAL, users can carry clear, credible insights into hearings, planning meetings, and negotiations, advocating for water futures that are not only resilient but also fairer and more just.",
            ]}
          />
        </Box>
      </ScrollElement>
    </PanelContainer>
  )
}
