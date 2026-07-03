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

export default function GoldRush() {
  return (
    <Box
      component="section"
      id="frame-3"
      aria-label="Gold Rush water rights and inequity"
    >
      <ScrollSection height="250vh" offset={["start start", "end center"]}>
        <StickyElement top="15vh" style={{ height: "35vh" }}>
          <GoldRushOriginsPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="205vh">
        <StickyElement top="15vh">
          <GoldRushLegacyPanel />
        </StickyElement>
      </ScrollSection>
    </Box>
  )
}

function GoldRushOriginsPanel() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0.04, 0.12], [0, 1])
  const firstParagraphOpacity = useScrollValue(progress, [0.08, 0.18], [0, 1])
  const secondParagraphOpacity = useScrollValue(progress, [0.42, 0.5], [0, 1])
  const thirdParagraphOpacity = useScrollValue(progress, [0.68, 0.76], [0, 1])

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
          <SectionTitle text={"How inequity started"} />
        </Box>
      </motion.div>

      <Stack spacing={2} direction="column">
        <motion.div style={{ opacity: firstParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "The mid-19th century marked a turning point in California's water history.",
                "During the Gold Rush, European settlers introduced new legal and political systems that fundamentally redefined who could access land and water.",
              ]}
            />
          </Box>
        </motion.div>

        <motion.div style={{ opacity: secondParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "The 1850 Act for the Government and Protection of Indians instituted forced removal, cultural suppression, and the large-scale dispossession of Indigenous lands and waters.",
                "At the same time, settlers established their own system of water rights.",
              ]}
            />
          </Box>
        </motion.div>

        <motion.div style={{ opacity: thirdParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "Indigenous water needs and practices were not recognized under these laws.",
                "Only white men could claim and hold water rights.",
              ]}
            />
          </Box>
        </motion.div>
      </Stack>
    </Box>
  )
}

function GoldRushLegacyPanel() {
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
        hold={[0.28, 0.88]}
        exit={[0.88, 0.98]}
        animation="slideUp"
      >
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "This period established a lasting hierarchy of 'legitimate' water users.",
              "Today's water rights reflect values and priorities of the Gold Rush: rapid resource extraction, expansion of agriculture, and maximizing out-of-stream water use to support settlement and economic growth, primarily for white landowners.",
              "Systems of exclusion and racism continue to deny Indigenous communities and others equal rights, recognition, and access to water.",
              "While these priorities drove development, they locked in patterns of water allocation that have been difficult to change, even as societal values and understandings of equity have evolved.",
            ]}
          />
        </Box>
      </ScrollElement>
    </Box>
  )
}
