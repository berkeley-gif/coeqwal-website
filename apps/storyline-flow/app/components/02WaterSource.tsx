"use client"

import { Box, Slider, Stack, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useState, useCallback, useRef, useEffect } from "react"
import { useMap } from "@repo/map/client"
import { useFetchData } from "../hooks/useFetchData"
import PrecipitationBar from "./vis/PrecipitationBar"
import {
  precipitationPaintStyle,
  snowpackPaintStyle,
} from "./helpers/mapLayerStyle"
import useActiveSection from "../hooks/useActiveSection"
import { MarkerType } from "./helpers/mapMarkers"
import useStoryStore from "../store"

import AnimatedCurve from "./vis/AnimatedCurve"
import { Sentence } from "@repo/motion/components"
import { MONTHIDS, MONTHS, selectedMonths } from "./helpers/constants"
import { stateMapViewState } from "./helpers/mapViews"
import { useBreakpoint } from "@repo/ui/hooks"
import { motion, useScroll, useTransform } from "@repo/motion"
import { springUpTextVariants } from "@repo/motion/variants"
import Legend from "./helpers/Legend"
import ScrollIndicator from "./helpers/ScrollIndicator"
import {
  FreshWaterColorScale,
  SnowWaterColorScale,
} from "./helpers/colorPalette"
import { usePlayAnimationOnce } from "@repo/motion/hooks"

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
  const { addLayer, addSource, setPaintProperty } = useMap()
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.precipitation
  const { sectionRef, isSectionActive } = useActiveSection("precipitation", {
    amount: 0.2,
  })
  const hasSeen = useRef(false)

  const colors = FreshWaterColorScale
  const labels = ["10", "20", "30", "40", "50 in."]
  const isMapReady = useStoryStore((state) => state.isMapReady)

  //TODO: maybe do this when the map is first loaded
  const init = useCallback(() => {
    addSource("precipitation-vector", {
      type: "vector",
      url: "mapbox://coeqwal.6dxtit1i",
    })

    addLayer(
      "precipitation-vector-layer",
      "precipitation-vector",
      "fill",
      precipitationPaintStyle,
      {},
      { "source-layer": "region" },
    )
  }, [addSource, addLayer])

  //TODO: there is two times re-render here, in case we have performance issues
  const load = useCallback(() => {
    setPaintProperty("precipitation-vector-layer", "fill-opacity", 1)
  }, [setPaintProperty])

  const unload = useCallback(() => {
    setPaintProperty("precipitation-vector-layer", "fill-opacity", 0)
  }, [setPaintProperty])

  useEffect(() => {
    if (!isMapReady) return
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log("initialize stuff")
        init()
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        //console.log("unload stuff")
        unload()
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, init, load, unload, isMapReady])

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
      <Box className="paragraph" component="article">
        <Sentence
          variant="h3"
          gutterBottom
          options={{ amount: 0.1 }}
          custom={0}
        >
          {content?.title1}{" "}
          <Legend colors={colors} labels={labels}>
            {content?.title2}
          </Legend>{" "}
          {content?.title3}
        </Sentence>
      </Box>
      <Stack spacing={12} direction="column" component="section" role="region">
        <Box className="paragraph">
          <Typography variant="body1">{content?.p1}</Typography>
          <Typography variant="body1">{content?.p2}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content?.p3}</Typography>
          <Typography variant="body1">{content?.p4}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Data source : 30-year (1991-2020) normals from{" "}
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
        </Box>
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
  const hasSeen = useRef(false)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const { setPaintProperty } = useMap()
  const setMarkers = useStoryStore((state) => state.setMarkers)

  const getSelectedYear = (year: string) => {
    const points = markers[year] || []
    setMarkers(points, "rough-circle")
  }

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      console.log(latest)
    })

    return () => unsubscribe()
  }, [scrollYProgress])

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
      }
      hasSeen.current = true
      setPaintProperty("precipitation-vector-layer", "fill-opacity", 0)
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
        setMarkers([], "rough-circle")
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, setMarkers, setPaintProperty])

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
            to explore how California is affected by droughts and floods.
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

const mountainMarker = {
  id: "sierra-nevada-mountains",
  name: "Sierra Nevada Mountains",
  latitude: 38.2489,
  longitude: -119.6877,
}

function Snowpack() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.snowpack
  const { sectionRef, isSectionActive } = useActiveSection("snowpack", {
    amount: 0.5,
  })
  const [startAnimation, setStartAnimation] = useState(false)
  const [monthIdx, setMonthIdx] = useState(0)
  const hasSeen = useRef(false)
  const { flyTo, setPaintProperty, addSource, setFilter, addLayer } = useMap()
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const breakpoint = useBreakpoint()
  const mapViewState = stateMapViewState[breakpoint]
  const colors = SnowWaterColorScale
  const labels = ["1", "6.5", "13", "20 ft."]
  const [animationComplete, setAnimationComplete] = useState(false)

  const init = useCallback(() => {
    addSource("snowpack", {
      type: "vector",
      url: "mapbox://coeqwal.a5ader88",
    })
    addLayer(
      "snowpack-layer",
      "snowpack",
      "fill",
      snowpackPaintStyle,
      {},
      { "source-layer": "monthly_snowpack-745lqa" },
    )
  }, [addLayer, addSource])

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("river-sac-layer", "line-opacity", 0)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
    setFilter("snowpack-layer", [
      "all",
      ["==", ["get", "month-adjusted"], "10"],
    ] as unknown as string)
    if (!animationComplete) return
    setPaintProperty("snowpack-layer", "fill-opacity", 1)
    setMarkers([mountainMarker], "text")
  }, [
    flyTo,
    mapViewState,
    setPaintProperty,
    setFilter,
    animationComplete,
    setMarkers,
  ])

  const unload = useCallback(() => {
    setMarkers([], "text")
    setPaintProperty("snowpack-layer", "fill-opacity", 0)
  }, [setMarkers, setPaintProperty])

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
        init()
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
        unload()
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [init, isSectionActive, load, unload])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="150vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Sentence variant="h3" gutterBottom custom={0}>
          {content?.title1}
          <Legend colors={colors} labels={labels}>
            {content?.title2}
          </Legend>{" "}
          {content?.title3}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={1}>{content?.p1}</Sentence>
        <Sentence custom={2}>{content?.p2}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence
          custom={3}
          onAnimationComplete={() => setStartAnimation(true)}
        >
          {content?.p3}
        </Sentence>
      </Box>
      <Box
        className="paragraph"
        style={{ height: "fit-content", width: "100%" }}
      >
        <Sentence custom={3} variant="h6">
          {"From Snow to Snowmelt \u2014 an Illustration"}
        </Sentence>
        <AnimatedCurve
          startAnimation={startAnimation}
          selectedMonth={monthIdx}
        />
        {/* <PathMorphing />*/}
        <div id="month-slider">
          <MotionSlider
            variants={springUpTextVariants}
            initial="hidden"
            animate={startAnimation ? "visible" : "hidden"}
            custom={7}
            min={0}
            max={11}
            value={monthIdx}
            track={false}
            onChange={(e, newValue) => {
              setMonthIdx(newValue as number)
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
            animate={startAnimation ? "visible" : "hidden"}
            custom={8}
            onAnimationComplete={() => {
              setAnimationComplete(true)
              setPaintProperty("snowpack-layer", "fill-opacity", 1)
            }}
          >
            Months in a Water Year
          </MotionTypography>
        </div>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
    </Box>
  )
}

export default SectionWaterSource
