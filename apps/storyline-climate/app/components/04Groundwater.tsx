"use client"

import { Paragraph, SectionTitle, Visualization } from "@repo/ui"
import { Box, Stack, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import GroundwaterLine from "./vis/GroundwaterLine"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"

const groundwaterLine = {
  guideValue: 108,
  viewBoxY: 20,
  viewBoxWidth: 1728,
  viewBoxHeight: 1115,
  translateX: 0,
  initialTranslateY: -14,
  textOffsetY: -24,
  path: "M-16 -52C-16 -52 -14 12 270 42C554 72 588 128 805 297C1022 466 1481.44 712.033 1755 844V1115",
} as const

const droughtIntro = [
  { text: "Droughts are not new to California." },
  {
    segments: [
      { text: "But " },
      {
        text: "in a changing climate, droughts are expected to occur more often",
        mark: "highlight",
      },
      { text: "." },
    ],
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
  const alignment = useGroundwaterLineAlignment()
  const progress = useScrollProgress()

  const linePath = useScrollValue(progress, [0.7, 0.9], [0, 1])
  const textOpacity = useScrollValue(progress, [0.7, 0.8], [0, 1])
  const titleOpacity = useScrollValue(progress, [0.2, 0.35], [0, 1])
  const paragraphOneOpacity = useScrollValue(progress, [0.28, 0.44], [0, 1])
  const paragraphTwoOpacity = useScrollValue(progress, [0.36, 0.52], [0, 1])
  const paragraphThreeOpacity = useScrollValue(progress, [0.44, 0.6], [0, 1])
  const paragraphFourOpacity = useScrollValue(progress, [0.52, 0.68], [0, 1])
  const chartHeadingOpacity = useScrollValue(progress, [0.6, 0.75], [0, 1])

  return (
    <Box
      ref={alignment.sectionRef}
      sx={{ position: "relative", height: "100%" }}
    >
      <SVGLineContainer viewBox="0 20 1728 1115" zIndex={3}>
        <motion.path
          ref={alignment.pathRef}
          id="groundwaterPumpingPath"
          d={groundwaterLine.path}
          className="svg-line glow-effect"
          pathLength={linePath}
          transform={`translate(${groundwaterLine.translateX}, ${alignment.lineTranslateY})`}
        />
        <motion.path
          id="groundwaterPumpingTextPath"
          d={groundwaterLine.path}
          fill="none"
          stroke="none"
          transform={`translate(${groundwaterLine.translateX}, ${alignment.textTranslateY + 55})`}
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
            startOffset="40%"
            textAnchor="middle"
          >
            Droughts drive groundwater pumping
          </textPath>
        </motion.text>
      </SVGLineContainer>

      <Box
        className="text-section"
        width={{ xs: "47%", md: "45%", lg: "50%" }}
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
        <Box className="paragraph" component="article">
          <motion.div style={{ opacity: titleOpacity }}>
            <SectionTitle text="More Managing Groundwater During Droughts" />
          </motion.div>
          <Stack direction="column" spacing={2}>
            {[
              { blocks: droughtIntro, opacity: paragraphOneOpacity },
              { blocks: groundwaterUse, opacity: paragraphTwoOpacity },
              { blocks: groundwaterRecharge, opacity: paragraphThreeOpacity },
              { blocks: groundwaterManagement, opacity: paragraphFourOpacity },
            ].map(({ blocks, opacity }, index) => (
              <motion.div key={index} style={{ opacity }}>
                <Paragraph
                  blocks={blocks}
                  markSx={{
                    highlight: {
                      color: "#F1B143",
                      fontWeight: "normal",
                    },
                    strong: {
                      fontWeight: "bold",
                    },
                  }}
                />
              </motion.div>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box
        width={{ xs: "53%", md: "55%", lg: "50%" }}
        height="100%"
        sx={{
          position: "absolute",
          inset: 0,
          left: { xs: "47%", md: "45%", lg: "50%" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: { xs: "1.5rem", md: "2.5rem", lg: "5rem" },
          minWidth: 0,
          "@media (min-width: 750px) and (max-width: 1199.95px) and (max-height: 800px)":
            { paddingTop: "3.5rem", boxSizing: "border-box" },
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
            height: { xs: "70vh", md: "72vh", lg: "70vh" },
            "@media (min-width: 750px) and (max-width: 1199.95px) and (max-height: 800px)":
              { height: "82vh" },
            pointerEvents: "auto",
          }}
        >
          <Box
            ref={alignment.chartRef}
            width="100%"
            height={{ xs: "48vh", md: "54vh", lg: "52vh" }}
            sx={{
              "@media (min-width: 750px) and (max-width: 1199.95px) and (max-height: 800px)":
                { height: "59vh" },
            }}
          >
            <GroundwaterLine
              scrollProgress={progress}
              groundwaterGuideValue={groundwaterLine.guideValue}
              onGroundwaterGuidePointChange={alignment.setChartGuidePoint}
            />
          </Box>
        </Visualization>
      </Box>
    </Box>
  )
}

export default Groundwater

function useGroundwaterLineAlignment() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const [chartGuidePoint, setChartGuidePoint] = useState<{
    x: number
    y: number
  } | null>(null)
  const [lineTranslateY, setLineTranslateY] = useState<number>(
    groundwaterLine.initialTranslateY,
  )

  const measure = useCallback(() => {
    const section = sectionRef.current
    const chart = chartRef.current
    const path = pathRef.current
    if (!section || !chart || !path || chartGuidePoint === null) return

    const sectionRect = section.getBoundingClientRect()
    const chartRect = chart.getBoundingClientRect()
    if (sectionRect.width <= 0 || sectionRect.height <= 0) return

    const guideXInSection =
      chartRect.left - sectionRect.left + chartGuidePoint.x
    const guideYInSection = chartRect.top - sectionRect.top + chartGuidePoint.y
    const guideXInViewBox =
      (guideXInSection / sectionRect.width) * groundwaterLine.viewBoxWidth
    const guideYInViewBox =
      groundwaterLine.viewBoxY +
      (guideYInSection / sectionRect.height) * groundwaterLine.viewBoxHeight

    setLineTranslateY(
      guideYInViewBox -
        getPathYAtX(path, guideXInViewBox - groundwaterLine.translateX),
    )
  }, [chartGuidePoint])

  useEffect(() => {
    measure()

    const observer = new ResizeObserver(() => requestAnimationFrame(measure))
    const section = sectionRef.current
    const chart = chartRef.current

    if (section) observer.observe(section)
    if (chart) observer.observe(chart)
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  return {
    sectionRef,
    chartRef,
    pathRef,
    lineTranslateY,
    textTranslateY: lineTranslateY + groundwaterLine.textOffsetY,
    setChartGuidePoint,
  }
}

function getPathYAtX(path: SVGPathElement, x: number) {
  const length = path.getTotalLength()
  let start = 0
  let end = length

  for (let i = 0; i < 32; i += 1) {
    const midpoint = (start + end) / 2
    const point = path.getPointAtLength(midpoint)

    if (point.x < x) start = midpoint
    else end = midpoint
  }

  return path.getPointAtLength((start + end) / 2).y
}
