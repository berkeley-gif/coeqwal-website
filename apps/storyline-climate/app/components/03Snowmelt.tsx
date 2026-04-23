"use client"

import Image from "next/image"
import { Box, Slider, Stack, Typography, useTheme } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import SnowpackLine from "./vis/SnowpackLine"
import StickyContainer from "./helpers/StickyContainer"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { useRef, useState } from "react"
import SWECurve from "./vis/SWECurve"
import SierraNevadaImageScroller from "./vis/SierraNevadaImageScroller"

export default function SierraNevada() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const { scrollYProgress: bottomEntryProgress } = useScroll({
    target: sectionRef,
    offset: ["end end", "end start"],
  })
  const sliderOpacity = usePlayAnimationOnce(
    bottomEntryProgress,
    [0, 0.2],
    [0, 1],
  )
  const titleOpacity = useTransform(scrollYProgress, [0.12, 0.3], [0, 1])
  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.22, 0.42],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.34, 0.54],
    [0, 1],
  )
  const chartHeadingOpacity = useTransform(
    scrollYProgress,
    [0.46, 0.64],
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
    <StickyContainer
      sectionID="sierranevada"
      stickyRollHeight="120vh"
      sectionRef={sectionRef}
    >
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
            <Typography variant="h3">
              {"Losing the Natural Reservoir"}
            </Typography>
          </motion.div>
        </Box>

        <Stack spacing={1} direction="column">
          <motion.div style={{ opacity: firstParagraphOpacity }}>
            <Box className="paragraph" component="article">
              <Typography variant="body1">
                {
                  "The mountain snowpack has historically served as an important "
                }
                <span style={{ fontWeight: "bold" }}>natural reservoir</span>
                {" to supply water for California."}
              </Typography>
              <Typography variant="body1">
                {
                  "Snow builds up in the winter and melts in the late spring to feed rivers and top off reservoirs downstream before the long dry season."
                }
              </Typography>
              <Typography variant="body1">
                {"But "}
                <span className="highlight-text">{"warmer temperatures"}</span>
                {" mean more precipitation falls as rain instead of snow."}
              </Typography>
              <Typography variant="body1">
                {"And "}
                <span className="highlight-text">
                  {"the snowpack we do receive melts earlier"}
                </span>
                {" in the year."}
              </Typography>
            </Box>
          </motion.div>
          <motion.div style={{ opacity: secondParagraphOpacity }}>
            <Box className="paragraph" component="article">
              <Typography variant="body1">
                {"However, this natural reservoir is highly variable."}
              </Typography>
              <Typography variant="body1">
                {
                  "Use the slider below to compare a record-breaking wet year (2023) with a severe dry year (2015) to see what snowpack may look like in a warmer future."
                }
              </Typography>
            </Box>
          </motion.div>
        </Stack>

        <Stack spacing={1} direction="column" sx={{ mt: 2, pt: 2 }}>
          <Box
            className="paragraph"
            style={{
              height: "fit-content",
              width: "100%",
              pointerEvents: "none",
            }}
          >
            <motion.div style={{ opacity: chartHeadingOpacity }}>
              <Typography variant="h5">
                {"California's Changing Snowpack"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ opacity: 0.7, textAlign: "left" }}
              >
                Satellite image source:{" "}
                <a
                  href="https://worldview.earthdata.nasa.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  NASA Worldview
                </a>
              </Typography>
            </motion.div>
            <SWECurve
              selectedMonth={monthIdx}
              scrollYProgress={scrollYProgress}
            />
          </Box>
          <div id="month-slider">
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
            <Typography variant="caption" gutterBottom>
              Months in a Water Year
            </Typography>
          </div>
        </Stack>
      </Box>
    </StickyContainer>
  )
}

//TODO: check the z-index
export function Snowmelt() {
  const sectionRef = useRef(null)
  const theme = useTheme()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const linePath = useTransform(scrollYProgress, [0.7, 0.9], [0, 1])
  const textOpacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1])
  const labelOpacity = usePlayAnimationOnce(
    scrollYProgress,
    [0.5, 0.65],
    [0, 1],
  )
  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.28, 0.46],
    [0, 1],
  )
  const chartHeadingOpacity = useTransform(
    scrollYProgress,
    [0.48, 0.66],
    [0, 1],
  )

  return (
    <StickyContainer
      sectionID="snowmelt"
      stickyRollHeight="200vh"
      sectionRef={sectionRef}
    >
      <SVGLineContainer viewBox="0 0 2012 1133" zIndex={2}>
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
            Rising heat melts the snow
          </textPath>
        </motion.text>
      </SVGLineContainer>

      <Box
        className="text-section"
        width="50%"
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
        <motion.div style={{ opacity: firstParagraphOpacity }}>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "Predictions of climate change effects indicate that snowpack will continue to decline over the long-term."
              }
            </Typography>
            <Typography variant="body1">
              {"Less snowpack means there will be "}
              <span style={{ fontWeight: "bold" }}>
                {"less water available"}
              </span>
              {
                " in rivers and reservoirs during the dry summer when we \u2014 humans and ecosystems \u2014 "
              }
              <span style={{ fontWeight: "bold" }}>{"need it most"}</span>
              {"."}
            </Typography>
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
        }}
      >
        <Box
          className="paragraph"
          component="article"
          sx={{ pointerEvents: "auto" }}
        >
          <motion.div style={{ opacity: chartHeadingOpacity }}>
            <Typography variant="h5" align="left">
              {"Projected Change in Snowpack by 2050"}
            </Typography>
            <Typography variant="caption" align={"left"} sx={{ opacity: 0.7 }}>
              {"Source: "}
              <a
                href="https://v2.cal-adapt.org/tools/snowpack/#climatevar=swe&scenario=rcp85&lat=38.90625&lng=-120.03125&boundary=locagrid&units=inch"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline" }}
              >
                Cal-Adapt
              </a>
              {
                ", Fourth Assessment Climate Region modeled by CanESM2 in high emission scenario"
              }
            </Typography>
          </motion.div>
        </Box>
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
            {"April Snow Water Equivalent"}
          </Typography>
        </motion.div>
        <Box width="100%" height="50%">
          <SnowpackLine scrollProgress={scrollYProgress} />
        </Box>
      </Box>
    </StickyContainer>
  )
}
