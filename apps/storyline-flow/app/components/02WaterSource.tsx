"use client"

import { Box, Slider, Stack, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useState } from "react"
import { useMap } from "@repo/map/client"
import { useFetchData } from "../hooks/useFetchData"
import PrecipitationBar from "./vis/PrecipitationBar"
import useActiveSection from "../hooks/useActiveSection"
import { MarkerType } from "./helpers/mapMarkers"
import useStoryStore from "../store"

import AnimatedCurve from "./vis/AnimatedCurve"
import { MONTHIDS, MONTHS, selectedMonths } from "./helpers/constants"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"
import { springUpTextVariants } from "@repo/motion/variants"
import Legend from "./helpers/Legend"
import {
  FreshWaterColorScale,
  SnowWaterColorScale,
} from "./helpers/colorPalette"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { SierraNevadaMountains } from "./helpers/mapAnnotations"
import { useSectionLifecycle } from "../hooks/useSectionLifeCycle"

const MotionSlider = motion.create(Slider)
const MotionTypography = motion.create(Typography)

function SectionWaterSource() {
  const [markers, setMarkers] = useState<Record<string, MarkerType[]>>({}) // Initialize markers as an empty array

  useFetchData<Record<string, MarkerType[]>>(
    "/data/variability_marker.json",
    (data) => {
      setMarkers(data)
    },
  )

  return (
    <>
      <Precipitation />
      <Variability markers={markers} />
      <Snowpack />
    </>
  )
}

function Precipitation() {
  const { setPaintProperty } = useMap()
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.precipitation
  const { sectionRef } = useActiveSection("precipitation", {
    amount: 0.2,
  })

  const colors = FreshWaterColorScale
  const labels = ["10", "20", "30", "40", "50 in."]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.1 && latest < 0.9) {
      setPaintProperty("precipitation-vector-layer", "fill-opacity", 1)
      return
    }
    setPaintProperty("precipitation-vector-layer", "fill-opacity", 0)
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
    <Box
      ref={sectionRef}
      id="precipitation"
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1} // Ensure focusable for screen readers
      role="region"
    >
      <motion.div className="paragraph" style={{ opacity: titleOpacity }}>
        <Typography variant="h3" gutterBottom>
          {content?.title1}{" "}
          <Legend colors={colors} labels={labels}>
            {content?.title2}
          </Legend>{" "}
          {content?.title3}
        </Typography>
      </motion.div>
      <Stack spacing={12} direction="column" component="section" role="region">
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

function Variability({ markers }: { markers: Record<string, MarkerType[]> }) {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.variability
  const { sectionRef, isSectionActive } = useActiveSection("variability", {
    amount: 0.5,
  })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const [currentPoints, setCurrentPoints] = useState<MarkerType[]>([])

  const getSelectedYear = (year: string) => {
    const points = markers[year] || []
    setMarkers(points, "rough-circle")
    setCurrentPoints(points)
  }

  useSectionLifecycle(
    isSectionActive,
    () => {},
    () => {
      setMarkers(currentPoints, "rough-circle")
    },
    () => {
      setMarkers([], "rough-circle")
    },
  )

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
    <Box
      ref={sectionRef}
      className="container"
      height="110vh"
      sx={{ justifyContent: "space-around" }}
      tabIndex={-1}
      role="region"
    >
      <Stack spacing={3} direction="column" component="section" role="region">
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
      <Stack
        spacing={1}
        direction="column"
        component="section"
        role="region"
        sx={{ width: "100%" }}
      >
        <Box
          className="paragraph"
          style={{ height: "fit-content", width: "100%" }}
        >
          <MotionTypography variant="h4" style={{ opacity: titleOpacity }}>
            California Rainfall Deviation from Average
          </MotionTypography>
          <MotionTypography
            variant="caption"
            style={{ opacity: captionOpacity }}
          >
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
          <PrecipitationBar
            yearLabels={Object.keys(markers).map((key) => parseInt(key))}
            scrollYProgress={scrollYProgress}
            getSelectedYear={getSelectedYear}
          />
        </Box>
        <motion.div
          className="paragraph"
          style={{ opacity: exampleParagraphOpacity }}
        >
          <Typography variant="body1">
            Click on{" "}
            <VisibilityIcon
              sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
            />{" "}
            and circles to explore how California is affected by droughts and
            floods.
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

function Snowpack() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.snowpack
  const { sectionRef, isSectionActive } = useActiveSection("snowpack", {
    amount: 0.5,
  })
  const [monthIdx, setMonthIdx] = useState(0)
  const { setPaintProperty, setFilter } = useMap()
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const colors = SnowWaterColorScale
  const labels = ["1", "6.5", "13", "20 ft."]
  const setSelectedMonthSnowpack = useStoryStore(
    (state) => state.setSelectedMonthSnowpack,
  )

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.5 && latest < 0.9) {
      setPaintProperty("snowpack-layer", "fill-opacity", 1)
      return
    }
    setPaintProperty("snowpack-layer", "fill-opacity", 0)
  })

  //NOTE: It seems I have to implement text markers using load and unload
  useSectionLifecycle(
    isSectionActive,
    () => {},
    () => {
      setMarkers([SierraNevadaMountains], "text")
    },
    () => {
      setMarkers([], "text")
    },
  )

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

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="120vh"
      sx={{ justifyContent: "space-around" }}
      tabIndex={-1}
      role="region"
    >
      <Stack
        spacing={6}
        direction="column"
        component="section"
        role="region"
        sx={{ width: "100%" }}
      >
        <Box className="paragraph">
          <Typography variant="h3" gutterBottom>
            {content?.title1}
            <Legend colors={colors} labels={labels}>
              {content?.title2}
            </Legend>{" "}
            {content?.title3}
          </Typography>
        </Box>
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
      <Box
        className="paragraph"
        style={{ height: "fit-content", width: "100%" }}
      >
        <MotionTypography variant="h4" style={{ opacity: titleOpacity }}>
          {"From Snow to Snowmelt \u2014 an Illustration"}
        </MotionTypography>
        <MotionTypography variant="caption">
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
        {/* <PathMorphing />*/}
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
              setSelectedMonthSnowpack(MONTHIDS[newValue as number] as string)
              setFilter("snowpack-layer", [
                "all",
                [
                  "==",
                  ["get", "month-adjusted"],
                  MONTHIDS[newValue as number] as string,
                ],
              ] as unknown as string)
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
          />
          <MotionTypography
            variant="h6"
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
      </Box>
    </Box>
  )
}

export default SectionWaterSource
