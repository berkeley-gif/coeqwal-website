"use client"

import Image from "next/image"
import { Paragraph, SectionTitle, Visualization } from "@repo/ui"
import { Box, Slider, Stack, Typography, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import SnowpackLine from "./vis/SnowpackLine"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { useState } from "react"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import SierraNevadaImageScroller from "./vis/SierraNevadaImageScroller"
import snowmeltContent from "../../public/locales/english/snowmelt.json"

const increasingVariabilityFirstParagraph = [
  {
    text: "California has always been characterized by high year-to-year variability in rainfall.",
  },
  {
    text: "We experience wet years, dry years, and everything in between.",
  },
  {
    text: "But extreme wet and dry years are becoming more common.",
  },
]

const sierraNevadaSliderCaption =
  "Use the slider below to see the difference in snowpack between a recent record-breaking dry year (2015) with a record-breaking wet year (2023)."

const increasingVariabilityFutureParagraph = [
  {
    text: "In the future, we can expect more year-to-year shifts like these, requiring that we take advantage of wet years to replenish storage and restore ecosystems, and prepare for dry years when limited water supplies must be carefully allocated.",
  },
]

const losingReservoirBody = [
  {
    text: "Mountain snowpack has historically served as an important natural reservoir to supply water for California.",
  },
  {
    text: "Snow builds up in the winter and melts slowly in the late spring to feed rivers and top off reservoirs downstream before the long, dry season.",
  },
  {
    text: "But warming temperatures lead to more precipitation falling as rain instead of snow.",
  },
  {
    text: "The snowpack we do receive melts earlier. The trend is expected to continue into the future.",
  },
  {
    text: "Less snow means there will be less water available in rivers and reservoirs during the dry summer when we - humans and ecosystems - need it most. Actions to reduce demands, conserve water, and protect the environment will become more important than ever.",
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
  const sliderOpacity = usePlayAnimationOnce(
    progress,
    [0.72, 0.88],
    [0, 1],
  )
  const titleOpacity = useScrollValue(progress, [0.12, 0.3], [0, 1])
  const firstParagraphOpacity = useScrollValue(
    progress,
    [0.22, 0.42],
    [0, 1],
  )
  const secondParagraphOpacity = useScrollValue(
    progress,
    [0.34, 0.54],
    [0, 1],
  )
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
              <Paragraph blocks={increasingVariabilityFirstParagraph} />
            </Box>
          </motion.div>
        </Stack>

        <motion.div style={{ opacity: secondParagraphOpacity }}>
          <Stack
            id="month-slider"
            spacing={1}
            direction="column"
            className="paragraph"
            sx={{ mt: 3, mb: 3 }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "common.white",
                maxWidth: "58rem",
              }}
            >
              {sierraNevadaSliderCaption}
            </Typography>
            <Slider
              min={0}
              max={11}
              value={monthIdx}
              track={false}
              onChange={(_, newValue: number | number[]) =>
                setMonthIdx(
                  Array.isArray(newValue) ? (newValue[0] ?? 0) : newValue,
                )
              }
              valueLabelDisplay="auto"
              valueLabelFormat={(value: number) => MONTHS[value]}
              marks={MONTHS.filter((d) => selectedMonths.includes(d)).map(
                (each) => ({
                  value: MONTHS.indexOf(each),
                  label: (
                    <span
                      style={{
                        fontWeight:
                          MONTHS.indexOf(each) === monthIdx ? "bold" : "normal",
                      }}
                    >
                      {each}
                    </span>
                  ),
                }),
              )}
              step={1}
              sx={{
                "& .MuiSlider-thumb": {
                  backgroundColor: "common.white",
                },
                "& .MuiSlider-markLabel": {
                  color: "common.white",
                },
                "& .MuiSlider-mark": {
                  backgroundColor: "common.white",
                },
              }}
            />
            <Typography variant="caption" sx={{ color: "common.white" }}>
              {snowmeltContent.sierraNevada.monthSliderLabel}
            </Typography>
          </Stack>
        </motion.div>

        <motion.div style={{ opacity: secondParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph blocks={increasingVariabilityFutureParagraph} />
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
  const progress = useScrollProgress()
  const linePath = useScrollValue(progress, [0.7, 0.9], [0, 1])
  const textOpacity = useScrollValue(progress, [0.7, 0.8], [0, 1])
  const labelOpacity = usePlayAnimationOnce(
    progress,
    [0.5, 0.65],
    [0, 1],
  )
  const firstParagraphOpacity = useScrollValue(
    progress,
    [0.28, 0.46],
    [0, 1],
  )
  const chartHeadingOpacity = useScrollValue(
    progress,
    [0.48, 0.66],
    [0, 1],
  )

  return (
    <>
      <SVGLineContainer viewBox="0 0 2012 1133" zIndex={3}>
        <motion.path
          id="risingHeatPath"
          d="M0 2H309C309 2 421.151 143.424 723 268C1024.85 392.576 837.399 576.216 1051 652C1187.22 700.329 2010 843 2010 843V1133"
          className="svg-line glow-effect"
          pathLength={linePath}
          transform="translate(20, 10)" // can be adjusted
        />
        <motion.path
          id="risingHeatTextPath"
          d="M0 2H309C309 2 421.151 143.424 723 268C1024.85 392.576 837.399 576.216 1051 652C1187.22 700.329 2010 843 2010 843V1133"
          fill="none"
          stroke="none"
          transform="translate(20, -10)"
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
            <Paragraph blocks={losingReservoirBody} />
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
          <Box width="100%" height={{ xs: "42vh", md: "52vh" }}>
            <SnowpackLine scrollProgress={progress} />
          </Box>
        </Visualization>
      </Box>
    </>
  )
}
