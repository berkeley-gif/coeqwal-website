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

export default function ClimateResilience() {
  return (
    <Box
      component="section"
      id="frame-5"
      aria-label="Climate change and resilience"
    >
      <ScrollSection height="250vh" offset={["start start", "end center"]}>
        <StickyElement top="15vh" style={{ height: "35vh" }}>
          <ClimateProgressPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="150vh">
        <StickyElement top="15vh">
          <ClimateInstitutionPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="225vh">
        <StickyElement top="15vh">
          <ClimateRiskPanel />
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

function ClimateProgressPanel() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0.04, 0.12], [0, 1])
  const paragraphOpacity = useScrollValue(progress, [0.08, 0.18], [0, 1])

  return (
    <PanelContainer>
      <motion.div style={{ opacity: titleOpacity }}>
        <Box className="paragraph" component="header" role="banner">
          <SectionTitle text={"How inequity persists under climate change"} />
        </Box>
      </motion.div>

      <motion.div style={{ opacity: paragraphOpacity }}>
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "Over time, the worldviews, rights, and values of the people of California have changed.",
              "Environmental protections such as the Endangered Species Act and Clean Water Act, recognition of the human right to water, and implementation of the Sustainable Groundwater Management Act all represent meaningful progress toward a more equitable water management system.",
            ]}
          />
        </Box>
      </motion.div>
    </PanelContainer>
  )
}

function ClimateInstitutionPanel() {
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
              "Yet inequities remain embedded in our institutions, infrastructure, and water-allocation decisions.",
              "Water rights, contracts, and operational rules lock us into historical values that do not reflect those of present-day society.",
            ]}
          />
        </Box>
      </ScrollElement>
    </PanelContainer>
  )
}

function ClimateRiskPanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.9]}
        exit={[0.9, 0.985]}
        animation="slideUp"
      >
        <Stack spacing={2} direction="column">
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "As climate change disrupts our water system, bringing more intense droughts and floods, the most vulnerable are likely to bear the burden.",
              ]}
            />
          </Box>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "As conditions in headwaters, tributaries, and rivers become more variable, these stresses ripple through the system, often intensifying inequities downstream.",
                "Some communities and sectors are buffered by infrastructure, contracts, or senior rights.",
                "Others, often Tribes, rural communities, and ecosystems, face repeated crises.",
                "Water is rarely sufficient to meet every need at once.",
                "The central question is not whether trade-offs exist, but why the same groups so often bear the costs.",
              ]}
            />
          </Box>
        </Stack>
      </ScrollElement>
    </PanelContainer>
  )
}
