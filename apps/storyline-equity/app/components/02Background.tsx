"use client"

import { motion } from "@repo/motion"
import {
  ScrollElement,
  ScrollSection,
  StickyElement,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

export default function Background() {
  return (
    <Box
      component="section"
      id="frame-1"
      aria-label="California water system introduction"
    >
      <ScrollSection height="250vh" offset={["start start", "end center"]}>
        <StickyElement top="15vh" style={{ height: "35vh" }}>
          <BackgroundSystemPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="155vh">
        <StickyElement top="15vh">
          <BackgroundInequityPanel />
        </StickyElement>
      </ScrollSection>
    </Box>
  )
}

function BackgroundSystemPanel() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0.04, 0.12], [0, 1])
  const firstParagraphOpacity = useScrollValue(progress, [0.08, 0.18], [0, 1])
  const secondParagraphOpacity = useScrollValue(progress, [0.42, 0.5], [0, 1])

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
      <motion.div style={{ opacity: titleOpacity }}>
        <Box className="paragraph" component="header" role="banner">
          <SectionTitle text={"How California's water system flows"} />
        </Box>
      </motion.div>

      <Stack spacing={2} direction="column">
        <motion.div style={{ opacity: firstParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "California's water begins in the mountain headwaters, flows through rivers and tributaries, and moves downstream toward the ocean.",
                "Along the way, dams, reservoirs, canals, and pumps store, redirect, and deliver water across the state.",
              ]}
            />
          </Box>
        </motion.div>

        <motion.div style={{ opacity: secondParagraphOpacity }}>
          <Stack spacing={2} direction="column">
            <Box className="paragraph" component="article">
              <Paragraph
                blocks={[
                  "Everyone depends on this system.",
                  "Agriculture relies on water for crops.",
                  "Cities depend on it for drinking and commercial uses.",
                  "Rivers, wetlands, and fish need sufficient flows to function and thrive.",
                  "People also depend on the health of our rivers for cultural practices, subsistence fishing, recreation, and access to clean water.",
                ]}
              />
            </Box>
            <Box className="paragraph" component="article">
              <Paragraph
                blocks={[
                  "Laws and regulations determine how water is shared, how much is diverted to farms and cities, how much remains in rivers, who receives water first, and who bears the greatest impacts during shortages.",
                ]}
              />
            </Box>
          </Stack>
        </motion.div>
      </Stack>
    </Box>
  )
}

function BackgroundInequityPanel() {
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
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.86]}
        exit={[0.86, 0.98]}
        animation="slideUp"
      >
        <Stack spacing={2} direction="column">
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "Yet the benefits of this system are not shared equally.",
                "Some water users have reliable access year after year, while others face chronic shortages or degraded water quality.",
              ]}
            />
          </Box>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "To understand water equity in California today, it's important to recognize that these inequities are deeply rooted in the state's history.",
              ]}
            />
          </Box>
        </Stack>
      </ScrollElement>
    </Box>
  )
}
