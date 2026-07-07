"use client"

import Image from "next/image"
import { Paragraph, SectionTitle, Visualization } from "@repo/ui"
import { Box, Slider, Stack, Typography, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import SnowpackLine from "./vis/SnowpackLine"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import SierraNevadaImageScroller from "./vis/SierraNevadaImageScroller"
import snowmeltContent from "../../public/locales/english/snowmelt.json"

const GOLD = "#F1B143"
const OFF_WHITE = "#FCFBFA"

const snowmeltLine = {
  guideValue: 10,
  exitValue: 0,
  viewBoxWidth: 2012,
  viewBoxHeight: 1133,
  translateX: 20,
  initialTranslateY: 10,
  textOffsetY: -20,
  path: "M0 2H309C309 2 421.151 143.424 723 268C1024.85 392.576 837.399 576.216 1051 652C1187.22 700.329 2010 843 2010 843V1133",
} as const

const increasingVariabilityFirstParagraph = [
  {
    text: "California has always been characterized by high year-to-year variability in rainfall.",
  },
  {
    text: "We experience wet years, dry years, and everything in between.",
  },
  {
    segments: [
      {
        text: "But ",
      },
      {
        text: "extreme wet and dry years are becoming more common",
        mark: "highlight",
      },
      { text: "." },
    ],
  },
]

const sierraNevadaSliderTitle = "Compare Snowpack Through the Water Year"

const increasingVariabilityFutureParagraph = [
  {
    segments: [
      {
        text: "In the future, we can expect more year-to-year shifts like these, requiring that we ",
      },
      { text: "take advantage of wet years", mark: "highlight" },
      {
        text: " to replenish storage and restore ecosystems, and ",
      },
      { text: "prepare for dry years", mark: "highlight" },
      {
        text: " when limited water supplies must be carefully allocated.",
      },
    ],
  },
]

const losingReservoirBody = [
  {
    segments: [
      {
        text: "Mountain snowpack has historically served as an important natural reservoir to supply water for California.\nSnow builds up in the winter and melts slowly in the late spring to feed rivers and top off reservoirs downstream before the long, dry season.\nBut ",
      },
      { text: "warming temperatures", mark: "highlight" },
      {
        text: " lead to more precipitation falling as rain instead of snow.\nThe snowpack we do receive melts earlier.",
      },
    ],
  },
  {
    segments: [
      {
        text: "The trend is expected to continue into the future, meaning there will be ",
      },
      { text: "less water available", mark: "highlight" },
      {
        text: " in rivers and reservoirs during summer when we - humans and ecosystems - ",
      },
      { text: "need it most", mark: "highlight" },
      { text: "." },
    ],
  },
  {
    segments: [
      { text: "Actions", mark: "strong" },
      {
        text: " to reduce demands, conserve water, and protect the environment will become more important than ever.",
      },
    ],
  },
]

export default function SierraNevada() {
  return (
    <StickyScrollSection
      id="sierranevada"
      ariaLabel="Increasing variability"
      height="220vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <SierraNevadaContent />
    </StickyScrollSection>
  )
}

function SierraNevadaContent() {
  const progress = useScrollProgress()
  const sliderOpacity = usePlayAnimationOnce(progress, [0.72, 0.88], [0, 1])
  const titleOpacity = useScrollValue(progress, [0.12, 0.3], [0, 1])
  const firstParagraphOpacity = useScrollValue(progress, [0.22, 0.42], [0, 1])
  const secondParagraphOpacity = useScrollValue(progress, [0.34, 0.54], [0, 1])
  const [monthIdx, setMonthIdx] = useState(0)

  const MONTHS = [
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
  ]

  const selectedMonths = ["October", "January", "April", "July", "September"]

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          left: "65%",
          width: "35%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "auto",
        }}
      >
        <SierraNevadaImageScroller
          opacity={sliderOpacity}
          selectedMonth={monthIdx}
        />
      </Box>

      <Box
        className="text-section"
        width="65%"
        height="100%"
        sx={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <Box className="paragraph">
          <motion.div style={{ opacity: titleOpacity }}>
            <SectionTitle text="Increasing Variability" />
          </motion.div>
        </Box>

        <Stack spacing={1} direction="column">
          <motion.div style={{ opacity: firstParagraphOpacity }}>
            <Box className="paragraph" component="article">
              <Paragraph
                blocks={increasingVariabilityFirstParagraph}
                markSx={{
                  highlight: {
                    color: GOLD,
                    fontWeight: "bold",
                  },
                }}
              />
            </Box>
          </motion.div>
        </Stack>

        <motion.div style={{ opacity: secondParagraphOpacity }}>
          <Stack
            id="month-slider"
            spacing={1}
            direction="column"
            sx={{
              mt: 4,
              mb: 4,
              width: "100%",
              maxWidth: "64rem",
              alignSelf: "flex-start",
              mx: 0,
              px: { xs: 2.25, md: 2.75, xl: 3.25 },
              pt: { xs: 2.25, md: 2.5 },
              pb: { xs: 2.75, md: 3 },
              border: "1px solid rgba(252, 251, 250, 0.14)",
              borderRadius: "8px",
              backgroundColor: "rgba(25, 61, 107, 0.68)",
              boxShadow: "0 18px 56px rgba(0, 0, 0, 0.16)",
              textAlign: "left",
              "@media (max-height: 850px) and (min-width: 900px)": {
                mt: 2,
                mb: 2,
                px: 2.25,
                pt: 1.75,
                pb: 2.25,
                maxWidth: "60rem",
              },
            }}
          >
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{
                width: "100%",
                color: OFF_WHITE,
                fontWeight: "bold",
                fontSize: { xs: "1rem", md: "1.05rem", xl: "1.15rem" },
                lineHeight: 1.25,
                letterSpacing: 0,
                textAlign: "left !important",
              }}
            >
              {sierraNevadaSliderTitle}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.82)",
                maxWidth: "56rem",
                lineHeight: 1.45,
                textAlign: "left !important",
              }}
            >
              Use the slider to compare month-by-month snowpack changes on the
              right between a recent{" "}
              <Box component="span" sx={{ color: GOLD, fontWeight: "bold" }}>
                record-breaking dry year (2015)
              </Box>{" "}
              and a{" "}
              <Box component="span" sx={{ color: GOLD, fontWeight: "bold" }}>
                record-breaking wet year (2023)
              </Box>
              .
            </Typography>
            <Typography
              variant="caption"
              sx={{
                mt: 1.5,
                color: OFF_WHITE,
                fontWeight: "bold",
                letterSpacing: 0,
                textAlign: "left",
                whiteSpace: "nowrap",
              }}
            >
              Viewing {MONTHS[monthIdx]}
            </Typography>
            <Slider
              aria-label="Month in water year"
              min={0}
              max={11}
              value={monthIdx}
              track="normal"
              onChange={(_, newValue: number | number[]) =>
                setMonthIdx(
                  Array.isArray(newValue) ? (newValue[0] ?? 0) : newValue,
                )
              }
              valueLabelDisplay="off"
              valueLabelFormat={(value: number) => MONTHS[value]}
              marks={selectedMonths.map((month) => ({
                value: MONTHS.indexOf(month),
              }))}
              step={1}
              sx={{
                mt: 0.75,
                mb: 0,
                color: GOLD,
                "& .MuiSlider-rail": {
                  height: 3,
                  backgroundColor: "rgba(255, 255, 255, 0.24)",
                  opacity: 1,
                },
                "& .MuiSlider-track": {
                  height: 3,
                  border: 0,
                  backgroundColor: GOLD,
                },
                "& .MuiSlider-thumb": {
                  backgroundColor: "common.white",
                  border: `3px solid ${GOLD}`,
                  boxShadow: "0 0 0 6px rgba(241, 177, 67, 0.16)",
                  width: 18,
                  height: 18,
                  "&:hover, &.Mui-focusVisible": {
                    boxShadow: "0 0 0 8px rgba(241, 177, 67, 0.22)",
                  },
                },
                "& .MuiSlider-markLabel": {
                  display: "none",
                },
                "& .MuiSlider-mark": {
                  backgroundColor: OFF_WHITE,
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                },
                "& .MuiSlider-markActive": {
                  backgroundColor: GOLD,
                },
              }}
            />
            <Box sx={{ position: "relative", height: "1.25rem", mt: 0.5 }}>
              {selectedMonths.map((month) => {
                const value = MONTHS.indexOf(month)
                const isActive = value === monthIdx
                const isFirst = value === 0
                const isLast = value === 11

                return (
                  <Typography
                    key={month}
                    variant="caption"
                    sx={{
                      position: "absolute",
                      left: `${(value / 11) * 100}%`,
                      transform: isFirst
                        ? "translateX(0)"
                        : isLast
                          ? "translateX(-100%)"
                          : "translateX(-50%)",
                      color: isActive ? GOLD : OFF_WHITE,
                      fontWeight: isActive ? "bold" : "normal",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {month}
                  </Typography>
                )
              })}
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: OFF_WHITE,
                textAlign: "left",
                mt: 0.75,
              }}
            >
              {snowmeltContent.sierraNevada.monthSliderLabel}
            </Typography>
          </Stack>
        </motion.div>

        <motion.div style={{ opacity: secondParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={increasingVariabilityFutureParagraph}
              markSx={{
                highlight: {
                  color: GOLD,
                  fontWeight: "bold",
                },
              }}
            />
          </Box>
        </motion.div>
      </Box>
    </>
  )
}

//TODO: check the z-index
export function Snowmelt() {
  return (
    <StickyScrollSection
      id="snowmelt"
      ariaLabel="Losing the natural reservoir"
      height="300vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <SnowmeltContent />
    </StickyScrollSection>
  )
}

function SnowmeltContent() {
  const theme = useTheme()
  const alignment = useSnowmeltLineAlignment()
  const progress = useScrollProgress()
  const linePath = useScrollValue(progress, [0.7, 0.9], [0, 1])
  const textOpacity = useScrollValue(progress, [0.7, 0.8], [0, 1])
  const labelOpacity = usePlayAnimationOnce(progress, [0.5, 0.65], [0, 1])
  const firstParagraphOpacity = useScrollValue(progress, [0.28, 0.46], [0, 1])
  const chartHeadingOpacity = useScrollValue(progress, [0.48, 0.66], [0, 1])

  return (
    <Box
      ref={alignment.sectionRef}
      sx={{ position: "relative", height: "100%" }}
    >
      <SVGLineContainer viewBox="0 0 2012 1133" zIndex={3}>
        <motion.path
          ref={alignment.pathRef}
          id="risingHeatPath"
          d={snowmeltLine.path}
          className="svg-line glow-effect"
          vectorEffect="non-scaling-stroke"
          pathLength={linePath}
          transform={`translate(${snowmeltLine.translateX}, ${alignment.lineTranslateY}) scale(1, ${alignment.lineScaleY})`}
        />
        <motion.path
          id="risingHeatTextPath"
          d={snowmeltLine.path}
          fill="none"
          stroke="none"
          transform={`translate(${snowmeltLine.translateX}, ${alignment.textTranslateY}) scale(1, ${alignment.lineScaleY})`}
        />
        {/*snowmeltTrendPath && (
          <motion.path
            d={snowmeltTrendPath}
            fill="none"
            stroke="#8EC5FF"
            strokeWidth={3}
            strokeDasharray="8 6"
            pathLength={snowmeltTrendPathLength}
            transform="translate(0, -200)"
            style={{ opacity: snowmeltTrendOpacity }}
          />
        )*/}
        <motion.text
          fill="#F1B143"
          fontWeight="bold"
          style={{
            fontSize: theme.typography.caption.fontSize,
            opacity: textOpacity,
          }}
        >
          <textPath
            href="#risingHeatTextPath"
            startOffset="35%"
            textAnchor="middle"
          >
            {snowmeltContent.snowmelt.risingHeatLabel}
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
        <motion.div style={{ opacity: firstParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <SectionTitle text="Losing the Natural Reservoir" />
            <Stack direction="column" spacing={2}>
              {losingReservoirBody.map((block, index) => (
                <Paragraph
                  key={index}
                  blocks={[block]}
                  sx={{ whiteSpace: "pre-line" }}
                  markSx={{
                    highlight: {
                      color: GOLD,
                      fontWeight: "bold",
                    },
                    strong: {
                      color: OFF_WHITE,
                      fontWeight: "bold",
                    },
                  }}
                />
              ))}
            </Stack>
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
          title={snowmeltContent.snowmelt.chart.title}
          source={snowmeltContent.snowmelt.chart.source}
          className="paragraph"
          headerWrapper={(header) => (
            <motion.div style={{ opacity: chartHeadingOpacity }}>
              {header}
            </motion.div>
          )}
          sx={{
            width: "100%",
            height: { xs: "64vh", md: "70vh" },
            pointerEvents: "auto",
          }}
        >
          <motion.div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              opacity: labelOpacity,
            }}
          >
            <Image
              src="/icons/snowflake_icon.svg"
              alt="Snowflake icon"
              width={48}
              height={48}
              style={{
                display: "block",
                marginRight: 8,
                filter: "invert(1) brightness(100%)",
              }}
            />
            <Typography variant="caption">
              {snowmeltContent.snowmelt.snowWaterEquivalentLabel}
            </Typography>
          </motion.div>
          <Box
            ref={alignment.chartRef}
            width="100%"
            height={{ xs: "42vh", md: "52vh" }}
          >
            <SnowpackLine
              scrollProgress={progress}
              snowpackGuideValue={snowmeltLine.guideValue}
              onSnowpackGuidePointChange={alignment.setChartGuidePoint}
              snowpackExitValue={snowmeltLine.exitValue}
              onSnowpackExitPointChange={alignment.setChartExitPoint}
            />
          </Box>
        </Visualization>
      </Box>
    </Box>
  )
}

function useSnowmeltLineAlignment() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const [chartGuidePoint, setChartGuidePoint] = useState<{
    x: number
    y: number
  } | null>(null)
  const [chartExitPoint, setChartExitPoint] = useState<{
    x: number
    y: number
  } | null>(null)
  const [lineTranslateY, setLineTranslateY] = useState<number>(
    snowmeltLine.initialTranslateY,
  )
  const [lineScaleY, setLineScaleY] = useState(1)

  const measure = useCallback(() => {
    const section = sectionRef.current
    const chart = chartRef.current
    const path = pathRef.current
    if (
      !section ||
      !chart ||
      !path ||
      chartGuidePoint === null ||
      chartExitPoint === null
    ) {
      return
    }

    const sectionRect = section.getBoundingClientRect()
    const chartRect = chart.getBoundingClientRect()
    if (sectionRect.width <= 0 || sectionRect.height <= 0) return

    const guideXInSection =
      chartRect.left - sectionRect.left + chartGuidePoint.x
    const guideYInSection = chartRect.top - sectionRect.top + chartGuidePoint.y
    const exitXInSection = chartRect.left - sectionRect.left + chartExitPoint.x
    const exitYInSection = chartRect.top - sectionRect.top + chartExitPoint.y
    const guideXInViewBox =
      (guideXInSection / sectionRect.width) * snowmeltLine.viewBoxWidth
    const guideYInViewBox =
      (guideYInSection / sectionRect.height) * snowmeltLine.viewBoxHeight
    const exitXInViewBox =
      (exitXInSection / sectionRect.width) * snowmeltLine.viewBoxWidth
    const exitYInViewBox =
      (exitYInSection / sectionRect.height) * snowmeltLine.viewBoxHeight
    const pathGuideY = getPathYAtX(
      path,
      guideXInViewBox - snowmeltLine.translateX,
    )
    const pathExitY = getPathYAtX(
      path,
      exitXInViewBox - snowmeltLine.translateX,
    )
    const pathDelta = pathExitY - pathGuideY
    const guideDelta = exitYInViewBox - guideYInViewBox
    const nextScaleY =
      pathDelta === 0 ? 1 : Math.max(0.2, Math.min(2.5, guideDelta / pathDelta))

    setLineScaleY(nextScaleY)
    setLineTranslateY(guideYInViewBox - pathGuideY * nextScaleY)
  }, [chartExitPoint, chartGuidePoint])

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
    lineScaleY,
    textTranslateY: lineTranslateY + snowmeltLine.textOffsetY,
    setChartGuidePoint,
    setChartExitPoint,
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
