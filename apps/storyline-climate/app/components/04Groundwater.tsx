"use client"

import { Paragraph, SectionTitle, Visualization } from "@repo/ui"
import { Box, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import GroundwaterLine from "./vis/GroundwaterLine"
import SVGLineContainer from "./helpers/SVGLineContainer"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"

const droughtIntro = [
  { text: "Droughts are not new to California." },
  {
    text: "But in a changing climate, droughts are expected to occur more often.",
  },
]

const groundwaterUse = [
  {
    segments: [
      {
        text: "Historically, when rivers and reservoirs ran low, communities and farmers in California increased the use of ",
      },
      { text: "groundwater", mark: "strong" },
      { text: " to meet their needs." },
    ],
  },
]

const groundwaterRecharge = [
  {
    text: "Groundwater is naturally replenished in wet years and serves as another natural reservoir below the land surface. But when pumping exceeds recharge rates, groundwater tables fall.",
  },
]

const groundwaterManagement = [
  {
    segments: [
      { text: "In 2014, the state enacted " },
      { text: "Sustainable Groundwater Management Act (SGMA)", mark: "strong" },
      {
        text: ". This law is intended to protect groundwater for the future. It aims to reduce overpumping so groundwater supplies will still be available to help us withstand extreme droughts.",
      },
    ],
  },
]

function Groundwater() {
  return (
    <StickyScrollSection
      id="groundwater"
      ariaLabel="Managing groundwater during droughts"
      height="220vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <GroundwaterContent />
    </StickyScrollSection>
  )
}

function GroundwaterContent() {
  const theme = useTheme()
  const progress = useScrollProgress()

  const linePath = useScrollValue(progress, [0.7, 0.9], [0, 1])
  const textOpacity = useScrollValue(progress, [0.7, 0.8], [0, 1])
  const titleOpacity = useScrollValue(progress, [0.2, 0.35], [0, 1])
  const paragraphOneOpacity = useScrollValue(
    progress,
    [0.28, 0.44],
    [0, 1],
  )
  const paragraphTwoOpacity = useScrollValue(
    progress,
    [0.36, 0.52],
    [0, 1],
  )
  const paragraphThreeOpacity = useScrollValue(
    progress,
    [0.44, 0.6],
    [0, 1],
  )
  const paragraphFourOpacity = useScrollValue(
    progress,
    [0.52, 0.68],
    [0, 1],
  )
  const chartHeadingOpacity = useScrollValue(progress, [0.6, 0.75], [0, 1])

  return (
    <>
      <SVGLineContainer viewBox="0 20 1728 1115" zIndex={3}>
        <motion.path
          id="groundwaterPumpingPath"
          d="M-16 -52C-16 -52 -14 12 270 42C554 72 588 128 805 297C1022 466 1481.44 712.033 1755 844V1115"
          className="svg-line glow-effect"
          pathLength={linePath}
          transform={"translate(0, -14)"}
        />
        <motion.path
          id="groundwaterPumpingTextPath"
          d="M-16 -52C-16 -52 -14 12 270 42C554 72 588 128 805 297C1022 466 1481.44 712.033 1755 844V1115"
          fill="none"
          stroke="none"
          transform="translate(0, -38)"
        />
        <motion.text
          fill="#F1B143"
          fontWeight="bold"
          style={{
            fontSize: theme.typography.caption.fontSize,
            opacity: textOpacity,
          }}
        >
          <textPath
            href="#groundwaterPumpingTextPath"
            startOffset="35%"
            textAnchor="middle"
          >
            Droughts drive groundwater pumping
          </textPath>
        </motion.text>
      </SVGLineContainer>

      <Box
        className="text-section"
        width="50%"
        height="100%"
        sx={{
          position: "relative",
          zIndex: 4,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <motion.div style={{ opacity: titleOpacity }}>
          <Box className="paragraph" component="article">
            <SectionTitle text="Managing Groundwater During Droughts" />
          </Box>
        </motion.div>
        <motion.div style={{ opacity: paragraphOneOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph blocks={droughtIntro} />
          </Box>
        </motion.div>
        <motion.div style={{ opacity: paragraphTwoOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph blocks={groundwaterUse} />
          </Box>
        </motion.div>
        <motion.div style={{ opacity: paragraphThreeOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph blocks={groundwaterRecharge} />
          </Box>
        </motion.div>
        <motion.div style={{ opacity: paragraphFourOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph blocks={groundwaterManagement} />
          </Box>
        </motion.div>
      </Box>

      <Box
        width="50%"
        height="100%"
        sx={{
          position: "absolute",
          inset: 0,
          left: "50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: "5rem",
          pointerEvents: "auto",
          zIndex: 1,
        }}
      >
        <Visualization
          title="Cumulative Groundwater Loss in Central Valley"
          source={{
            prefix:
              "Groundwater losses estimated with Central Valley Hydrological Model, simplified for presentation. Source: ",
            label: "Liu et al., 2022",
            url: "https://doi.org/10.1038/s41467-022-35582-x",
          }}
          className="paragraph"
          headerWrapper={(header) => (
            <motion.div style={{ opacity: chartHeadingOpacity }}>
              {header}
            </motion.div>
          )}
          sx={{
            width: "100%",
            height: { xs: "62vh", md: "70vh" },
            pointerEvents: "auto",
          }}
        >
          <Box width="100%" height={{ xs: "42vh", md: "52vh" }}>
            <GroundwaterLine scrollProgress={progress} />
          </Box>
        </Visualization>
      </Box>
    </>
  )
}

export default Groundwater
