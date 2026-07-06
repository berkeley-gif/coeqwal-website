"use client"

import {
  CoordinateBox,
  CoordinateStage,
  CoordinateSvg,
  Paragraph,
  SectionTitle,
  Visualization,
} from "@repo/ui"
import { Box, useMediaQuery, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import TemperatureLineChart from "./vis/TemperatureLineChart"
import SVGLineContainer from "./helpers/SVGLineContainer"
import temperatureContent from "../../public/locales/english/temperature.json"

const STICKY_SECTION_PROPS = {
  height: "250vh",
  stickyHeight: "100vh",
  stickyTop: 0,
} as const

const trendLine = {
  guideValue: 57.9,
  viewBoxWidth: 1728,
  viewBoxHeight: 952,
  initialTranslateY: 187,
  textOffsetY: -32,
} as const

const trendLinePaths = {
  default:
    "M-112 262.094C-112 262.094 1255 121.095 1546 21.0942C1837 -78.9061 1824 234.095 1678 490.095",
  mdPortrait:
    "M-112 262.094C-112 262.094 1255 121.095 1546 21.0942C1837 -78.9061 1824 234.095 1678 490.095",
  lg: "M-112 262.094C-112 262.094 1255 121.095 1546 21.0942C1837 -78.9061 1824 234.095 1678 490.095",
  xl: "M-112 262.094C-112 262.094 1255 121.095 1546 21.0942C1837 -78.9061 1824 234.095 1678 490.095",
} as const

const contentMaxWidth = {
  xs: "100%",
  md: "64rem",
  lg: "78rem",
  xl: "112rem",
} as const

const builderTextMaxWidth = {
  xs: "30rem",
  sm: "34rem",
  md: "48rem",
  lg: "56rem",
  xl: "62rem",
} as const

const waterSystemIntro = [
  {
    text: "California's water system is carefully managed to meet multiple demands —\nproviding clean drinking water for people,\nsustaining the farms that feed us,\nand protecting the fish and wildlife that we all care about.",
  },
]

const climateRulesIntro = [
  {
    segments: [
      {
        text: "But with warming temperatures, less predictable rain and snow, and rising sea levels, ",
      },
      {
        text: "climate change is shifting the rules of the game",
        mark: "highlightStrong",
      },
      { text: "." },
    ],
  },
  {
    text: "To ensure that we continue to meet the needs of people and our living environment, planning for the future has never been more important.",
  },
]

const warmingTitle = [
  { text: "A " },
  { text: "Warming", mark: "highlight" },
  { text: " Planet" },
]

const warmingBody = [
  {
    text: "Year after year, rising global temperatures reveal that our climate is changing.",
  },
  {
    segments: [
      {
        text: "Since 1960, California's average temperature has ",
      },
      { text: "increased", mark: "strong" },
      { text: " by 2°F (1.1°C)." },
    ],
  },
  {
    segments: [
      {
        text: "Climate models predict that average temperatures may ",
      },
      { text: "increase", mark: "strong" },
      {
        text: " by an additional 6-9°F (3.3-5°C) by the end of the century.",
      },
    ],
  },
]

export function TemperatureBuilder() {
  return (
    <StickyScrollSection
      id="opener-builder"
      ariaLabel="Temperature introduction"
      {...STICKY_SECTION_PROPS}
    >
      <TemperatureBuilderContent />
    </StickyScrollSection>
  )
}

function TemperatureBuilderContent() {
  const progress = useScrollProgress()
  const linePath = useScrollValue(progress, [0.3, 0.7], [0, 1])
  const firstParagraphOpacity = useScrollValue(progress, [0.2, 0.45], [0, 1])
  const secondParagraphOpacity = useScrollValue(progress, [0.4, 0.65], [0, 1])

  return (
    <Box sx={{ position: "relative", height: "100%" }}>
      <CoordinateStage viewBoxWidth={1728} viewBoxHeight={1095} fit="stretch">
        <CoordinateSvg>
          <motion.path
            d="M1723 -29C1723 -29 2356 503 1440 211C524 -80.9998 -199 473 463 543C1125 613 1549 567 1187 811C825 1055 -181 1093 -181 1093"
            className="svg-line"
            pathLength={linePath}
          />
        </CoordinateSvg>

        <CoordinateBox
          x="23%"
          y="27.5%"
          width={980}
          className="text-section"
          sx={{
            maxWidth: builderTextMaxWidth,
          }}
        >
          <motion.div style={{ opacity: firstParagraphOpacity }}>
            <Paragraph
              className="paragraph"
              blocks={waterSystemIntro}
              sx={{ whiteSpace: "pre-line" }}
            />
          </motion.div>
        </CoordinateBox>

        <CoordinateBox
          x="23%"
          y="55.75%"
          width={900}
          className="text-section"
          sx={{
            maxWidth: builderTextMaxWidth,
          }}
        >
          <motion.div style={{ opacity: secondParagraphOpacity }}>
            <Paragraph
              className="paragraph"
              blocks={climateRulesIntro}
              markSx={{
                highlightStrong: {
                  color: "#F1B143",
                  fontWeight: "bold",
                },
              }}
            />
          </motion.div>
        </CoordinateBox>
      </CoordinateStage>
    </Box>
  )
}

export function Temperature() {
  return (
    <StickyScrollSection
      id="temperature"
      ariaLabel="Temperature"
      {...STICKY_SECTION_PROPS}
    >
      <TemperatureContent />
    </StickyScrollSection>
  )
}

function TemperatureContent() {
  const theme = useTheme()
  const alignment = useTemperatureSectionAlignment()
  const isMdPortrait = useMediaQuery(
    "(min-width: 900px) and (max-width: 1199.95px) and (orientation: portrait)",
  )
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.up("xl"))
  const trendPath = isMdPortrait
    ? trendLinePaths.mdPortrait
    : isXl
      ? trendLinePaths.xl
      : isLg
        ? trendLinePaths.lg
        : trendLinePaths.default
  const progress = useScrollProgress()
  const warmingTrendLabel = temperatureContent.warmingTrendLabel

  const linePath = useScrollValue(progress, [0.6, 0.8], [0, 1])
  const textOpacity = useScrollValue(progress, [0.65, 0.75], [0, 1])
  const chartHeadingOpacity = useScrollValue(progress, [0, 0.4], [0, 1])
  const bottomTitleOpacity = useScrollValue(progress, [0.5, 0.72], [0, 1])
  const bottomParagraphOpacity = useScrollValue(progress, [0.7, 0.8], [0, 1])

  return (
    <Box
      ref={alignment.sectionRef}
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: { xs: "1rem", md: "1.25rem", lg: "1.5rem", xl: "1.75rem" },
        py: { xs: "3rem", md: "3.5rem", lg: "4rem" },
        "@media (min-width: 900px) and (max-width: 1199.95px) and (orientation: portrait)":
          {
            justifyContent: "flex-start",
            pt: "16rem",
            pb: "3.5rem",
          },
      }}
    >
      <SVGLineContainer viewBox="0 0 1728 952">
        <motion.path
          ref={alignment.pathRef}
          id="warmingTrendPath"
          d={trendPath}
          className="svg-line glow-effect"
          transform={`translate(50, ${alignment.lineTranslateY})`}
          pathLength={linePath}
        />
        <motion.path
          id="warmingTrendTextPath"
          d={trendPath}
          fill="none"
          stroke="none"
          transform={`translate(50, ${alignment.textTranslateY})`}
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
            href="#warmingTrendTextPath"
            startOffset="38.5%"
            textAnchor="middle"
          >
            {warmingTrendLabel}
          </textPath>
        </motion.text>
      </SVGLineContainer>

      <Box
        className="text-section"
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          width: "100%",
          pointerEvents: "auto",
        }}
      >
        <Visualization
          title={temperatureContent.chart.title}
          source={temperatureContent.chart.source}
          headerWrapper={(header) => (
            <motion.div style={{ opacity: chartHeadingOpacity }}>
              {header}
            </motion.div>
          )}
          sx={{
            width: "100%",
            maxWidth: contentMaxWidth,
            mx: "auto",
          }}
        >
          <Box ref={alignment.chartRef} sx={{ width: "100%" }}>
            <TemperatureLineChart
              scrollProgress={progress}
              temperatureGuideValue={trendLine.guideValue}
              onTemperatureGuidePointChange={alignment.setChartGuidePoint}
            />
          </Box>
        </Visualization>
      </Box>

      <Box
        className="text-section"
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: contentMaxWidth,
          mx: "auto",
          pointerEvents: "auto",
        }}
      >
        <motion.div style={{ opacity: bottomTitleOpacity }}>
          <SectionTitle className="paragraph" text={warmingTitle} />
        </motion.div>
        <motion.div style={{ opacity: bottomParagraphOpacity }}>
          <Paragraph
            className="paragraph"
            blocks={warmingBody}
            markSx={{
              strong: {
                fontWeight: "bold",
              },
            }}
          />
        </motion.div>
      </Box>
    </Box>
  )
}

export default Temperature

function useTemperatureSectionAlignment() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const [chartGuidePoint, setChartGuidePoint] = useState<{
    x: number
    y: number
  } | null>(null)
  const [lineTranslateY, setLineTranslateY] = useState<number>(
    trendLine.initialTranslateY,
  )

  const measure = useCallback(() => {
    const section = sectionRef.current
    const chart = chartRef.current
    const path = pathRef.current
    if (!section || !chart || !path || chartGuidePoint === null) return

    const sectionRect = section.getBoundingClientRect()
    const chartRect = chart.getBoundingClientRect()
    if (sectionRect.width <= 0 || sectionRect.height <= 0) return

    const guideXInSection = chartRect.left - sectionRect.left + chartGuidePoint.x
    const guideYInSection = chartRect.top - sectionRect.top + chartGuidePoint.y
    const guideXInViewBox =
      (guideXInSection / sectionRect.width) * trendLine.viewBoxWidth
    const guideYInViewBox =
      (guideYInSection / sectionRect.height) * trendLine.viewBoxHeight

    setLineTranslateY(
      guideYInViewBox - getPathYAtX(path, guideXInViewBox - 50),
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
    textTranslateY: lineTranslateY + trendLine.textOffsetY,
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
