"use client"

import { motion } from "@repo/motion"
import {
  ScrollSection,
  StickyElement,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

export default function HistoricalContext() {
  return (
    <Box
      component="section"
      id="frame-2"
      aria-label="Historical context for water equity"
    >
      <ScrollSection height="250vh" offset={["start start", "end center"]}>
        <StickyElement top="15vh" style={{ height: "35vh" }}>
          <HistoricalContextPanel />
        </StickyElement>
      </ScrollSection>
    </Box>
  )
}

function HistoricalContextPanel() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0, 0.78, 0.86], [1, 1, 0])
  const firstParagraphOpacity = useScrollValue(
    progress,
    [0, 0.78, 0.86],
    [1, 1, 0],
  )
  const secondParagraphOpacity = useScrollValue(
    progress,
    [0.38, 0.46, 0.78, 0.86],
    [0, 1, 1, 0],
  )
  const thirdParagraphOpacity = useScrollValue(
    progress,
    [0.78, 0.86, 0.985, 1],
    [0, 1, 1, 0],
  )

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
      <Box sx={{ display: "grid", alignItems: "center" }}>
        <Box sx={{ gridArea: "1 / 1" }}>
          <motion.div style={{ opacity: titleOpacity }}>
            <Box className="paragraph" component="header" role="banner">
              <SectionTitle text={"How Indigenous communities managed water"} />
            </Box>
          </motion.div>

          <Stack spacing={2} direction="column">
            <motion.div style={{ opacity: firstParagraphOpacity }}>
              <Box className="paragraph" component="article">
                <Paragraph
                  blocks={[
                    "For thousands of years, Indigenous communities across California lived in relationship with water's natural cycles.",
                    "Tribes adapted to seasonal variability, moving across their territories to follow abundant plants, fish, and wildlife, and developing sophisticated practices for sustainably harvesting salmon and farming in arid regions.",
                  ]}
                />
              </Box>
            </motion.div>

            <motion.div style={{ opacity: secondParagraphOpacity }}>
              <Stack spacing={2} direction="column">
                <Box className="paragraph" component="article">
                  <Paragraph
                    blocks={[
                      "Water was managed collectively and locally, guided by ecological knowledge, cultural values, and long-term stewardship.",
                    ]}
                  />
                </Box>
                <Box className="paragraph" component="article">
                  <Paragraph
                    blocks={[
                      "Together, these approaches reflected a way of living in which people, water, plants, and animals are deeply connected and cared for in a relationship.",
                      "They emphasized shared access, balance, and sustainability, rather than ownership or exclusive control.",
                    ]}
                  />
                </Box>
              </Stack>
            </motion.div>
          </Stack>
        </Box>

        <motion.div
          style={{ gridArea: "1 / 1", opacity: thirdParagraphOpacity }}
        >
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "This relationship with water was dramatically disrupted with the arrival of European settlers.",
                "Their systems, laws, and values reshaped California's landscapes and set inequities in motion.",
              ]}
            />
          </Box>
        </motion.div>
      </Box>
    </Box>
  )
}
