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

export default function Infrastructure() {
  return (
    <Box
      component="section"
      id="frame-4"
      aria-label="Institutions and infrastructure shaped inequity"
    >
      <ScrollSection height="250vh" offset={["start start", "end center"]}>
        <StickyElement top="15vh" style={{ height: "35vh" }}>
          <InfrastructureOriginsPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="150vh">
        <StickyElement top="15vh">
          <InfrastructureAccessPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="190vh">
        <StickyElement top="15vh">
          <InfrastructureEcologyPanel />
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

function InfrastructureOriginsPanel() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0.04, 0.12], [0, 1])
  const firstParagraphOpacity = useScrollValue(progress, [0.08, 0.18], [0, 1])
  const secondParagraphOpacity = useScrollValue(progress, [0.42, 0.5], [0, 1])

  return (
    <PanelContainer>
      <motion.div style={{ opacity: titleOpacity }}>
        <Box className="paragraph" component="header" role="banner">
          <SectionTitle text={"How infrastructure shaped inequity"} />
        </Box>
      </motion.div>

      <Stack spacing={2} direction="column">
        <motion.div style={{ opacity: firstParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "In the 20th century, California's massive investments in water infrastructure reinforced inequities.",
                "Large-scale projects such as the Central Valley Project and the State Water Project transformed rivers into highly engineered systems designed to store and deliver water.",
              ]}
            />
          </Box>
        </motion.div>

        <motion.div style={{ opacity: secondParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "These dams, reservoirs, and canals expanded water supplies for agricultural water districts and growing cities, fueling economic growth and population expansion.",
                "Over time, these systems reshaped how water flows through the landscape, redirecting rivers, interrupting natural pathways, and prioritizing some uses over others.",
              ]}
            />
          </Box>
        </motion.div>
      </Stack>
    </PanelContainer>
  )
}

function InfrastructureAccessPanel() {
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
              "But these systems further preserved and intensified inequities in water access.",
              "Senior water-rights holders, largely large farms and landowners, were guaranteed supplies.",
              "Meanwhile, many Tribes, small rural communities, and disadvantaged areas were left behind.",
            ]}
          />
        </Box>
      </ScrollElement>
    </PanelContainer>
  )
}

function InfrastructureEcologyPanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.88]}
        exit={[0.88, 0.98]}
        animation="slideUp"
      >
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "The environmental costs were also largely overlooked.",
              "Dams blocked more than 95% of the historical habitat used by salmon.",
              "Rivers were dewatered and fragmented.",
              "California's freshwater ecosystems have suffered from degradation of water quality, loss of wetlands, fish population declines, and the extinction of species.",
            ]}
          />
        </Box>
      </ScrollElement>
    </PanelContainer>
  )
}
