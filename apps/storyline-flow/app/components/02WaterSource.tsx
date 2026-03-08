"use client"

import { Box, Slider, Stack, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useRef, useState } from "react"
import PrecipitationBar from "./vis/PrecipitationBar"
import { appActions, useStoryline, useStoryStore } from "../store"

import AnimatedCurve from "./vis/AnimatedCurve"
import { MONTHIDS, MONTHS, selectedMonths } from "./helpers/constants"
import { motion, useScroll, useTransform } from "@repo/motion"
import { springUpTextVariants } from "@repo/motion/variants"
import Legend from "./helpers/Legend"
import {
  FreshWaterColorScale,
  SnowWaterColorScale,
} from "./helpers/colorPalette"
import { usePlayAnimationOnce } from "@repo/motion/hooks"

const MotionSlider = motion.create(Slider)
const MotionTypography = motion.create(Typography)

export function Precipitation() {
  const storyline = useStoryline()
  const content = storyline?.precipitation
  const sectionRef = useRef(null)

  const colors = FreshWaterColorScale
  const labels = ["10", "20", "30", "40", "50 in."]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const titleOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1])
  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.7],
    [0, 1],
  )

  return (
    <Box ref={sectionRef} className="container">
      {/* Title */}
      <motion.div className="paragraph" style={{ opacity: titleOpacity }}>
        <Typography variant="h3" gutterBottom>
          {content?.title1}{" "}
          <Legend colors={colors} labels={labels}>
            {content?.title2}
          </Legend>{" "}
          {content?.title3}
        </Typography>
      </motion.div>
      {/* Paragraph */}
      <Stack spacing={6} direction="column">
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography variant="body1">{content?.p1}</Typography>
          <Typography variant="body1">{content?.p2}</Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography variant="body1">{content?.p3}</Typography>
          <Typography variant="body1">{content?.p4}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            GIS data source : 30-year (1991-2020) normals from{" "}
            <a
              href="https://prism.oregonstate.edu/normals/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              PRISM
            </a>
            .
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

export function Variability() {
  const storyline = useStoryline()
  const content = storyline?.variability
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const getSelectedYear = (year: string) => {
    appActions.setSelectYearVariability(year)
  }

  const firstParagraphOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.6],
    [0, 1],
  )
  const exampleParagraphOpacity = useTransform(
    scrollYProgress,
    [0.6, 0.8],
    [0, 1],
  )

  const titleOpacity = usePlayAnimationOnce(scrollYProgress, [0.4, 0.7], [0, 1])
  const captionOpacity = usePlayAnimationOnce(
    scrollYProgress,
    [0.4, 0.7],
    [0, 0.7],
  ) //TODO: make this 0.7 a constant for caption

  return (
    <Box ref={sectionRef} className="container">
      <Stack spacing={2} direction="column">
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography>{content?.p1}</Typography>
          <Typography gutterBottom>{content?.p2}</Typography>
        </motion.div>

        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography>{content?.p3}</Typography>
          <Typography>{content?.p4}</Typography>
        </motion.div>
      </Stack>

      <Stack spacing={1} direction="column" sx={{ width: "100%", mt: 6 }}>
        <MotionTypography variant="h5" style={{ opacity: titleOpacity }}>
          California Rainfall Deviation from Average
        </MotionTypography>
        <MotionTypography variant="caption" style={{ opacity: captionOpacity }}>
          Data source:{" "}
          <a
            href="https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/statewide/time-series"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            NOAA
          </a>
        </MotionTypography>
        <Box
          className="paragraph"
          style={{ height: "fit-content", width: "100%" }}
        >
          <PrecipitationBar
            yearLabels={["2014", "2017", "2021", "2023"].map((key) =>
              parseInt(key),
            )}
            scrollYProgress={scrollYProgress}
            getSelectedYear={getSelectedYear}
          />
        </Box>
        <motion.div
          className="paragraph"
          style={{ opacity: exampleParagraphOpacity }}
        >
          <Typography variant="h6">
            Click on <VisibilityIcon sx={{ verticalAlign: "middle" }} /> and
            circles to explore how California is affected by droughts and
            floods.
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

export function Snowpack() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.snowpack
  const sectionRef = useRef(null)
  const [monthIdx, setMonthIdx] = useState(0)
  const colors = SnowWaterColorScale
  const labels = ["1", "6.5", "13", "20 ft."]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.05, 0.35],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.15, 0.45],
    [0, 1],
  )
  const titleOpacity = useTransform(scrollYProgress, [0.25, 0.55], [0, 1])
  const captionOpacity = useTransform(scrollYProgress, [0.25, 0.55], [0, 0.7])

  return (
    <Box ref={sectionRef} className="container">
      <Box className="paragraph">
        <Typography variant="h3" gutterBottom>
          {content?.title1}
          <Legend colors={colors} labels={labels}>
            {content?.title2}
          </Legend>{" "}
          {content?.title3}
        </Typography>
      </Box>

      <Stack
        spacing={2}
        direction="column"
        component="section"
        role="region"
        sx={{ width: "100%" }}
      >
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography variant="body1">{content?.p1}</Typography>
          <Typography variant="body1">{content?.p2}</Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography variant="body1"> {content?.p3}</Typography>
          <Typography variant="body1">
            Slide to see the snowpack change over time!
          </Typography>
        </motion.div>
      </Stack>

      <Stack spacing={1} direction="column" sx={{ width: "100%", mt: 6 }}>
        <Box
          className="paragraph"
          style={{ height: "fit-content", width: "100%" }}
        >
          <MotionTypography variant="h5" style={{ opacity: titleOpacity }}>
            {"From Snow to Snowmelt \u2014 an Illustration"}
          </MotionTypography>
          <MotionTypography
            variant="caption"
            style={{ opacity: captionOpacity }}
          >
            GIS data source: Snowpack spatial accumulation from{" "}
            <a
              href="https://www.nohrsc.noaa.gov/snowfall/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              NOAA
            </a>
            .
          </MotionTypography>
          <AnimatedCurve
            selectedMonth={monthIdx}
            scrollYProgress={scrollYProgress}
          />
        </Box>
        <div id="month-slider">
          <MotionSlider
            variants={springUpTextVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.1, once: true }}
            custom={0}
            min={0}
            max={11}
            value={monthIdx}
            track={false}
            onChange={(e, newValue) => {
              setMonthIdx(newValue as number)
              appActions.setSelectedMonthSnowpack(
                MONTHIDS[newValue as number] as string,
              )
            }}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => MONTHS[value]}
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
          <MotionTypography
            variant="caption"
            gutterBottom
            variants={springUpTextVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.1, once: true }}
            custom={0}
          >
            Months in a Water Year
          </MotionTypography>
        </div>
        <MotionTypography
          variant="h6"
          gutterBottom
          variants={springUpTextVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.1, once: true }}
          custom={0}
        >
          Slide through the months to see how snow accumulates and melts
          throughout the year.
        </MotionTypography>
      </Stack>
    </Box>
  )
}

export default Precipitation
