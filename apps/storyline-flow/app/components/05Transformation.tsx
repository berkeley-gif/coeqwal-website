"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useCallback, useEffect, useRef, useState } from "react"
import { useMap } from "@repo/map"
import { stateMapViewState } from "./helpers/mapViews"
import Underline from "./helpers/Underline"
import { useBreakpoint } from "@repo/ui/hooks"
import { DAMS } from "./helpers/data/dams"
import { canalLayerStyle } from "./helpers/mapLayerStyle"
import { motion, useScroll, useTransform } from "@repo/motion"
import { InfrastructureColor } from "./helpers/colorPalette"

const MotionTypography = motion.create(Typography)

function SectionTransformation() {
  return (
    <>
      <Transformation />
    </>
  )
}

//TODO: pop up those
//TODO: handle text overflow that will cause horizontal scroll happen
// Use waterdrop for dams
function Transformation() {
  const storyline = useStoryStore((state) => state.storyline)
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.transformation
  const { sectionRef, isSectionActive } = useActiveSection("transformation", {
    amount: 0.5,
  })
  const hasSeen = useRef(false)
  const { flyTo, setPaintProperty, addSource, addLayer } = useMap()
  const [startAnimation, setStartAnimation] = useState(false)
  const breakpoint = useBreakpoint()
  const mapViewState = stateMapViewState[breakpoint]
  const setMarkers = useStoryStore((state) => state.setMarkers)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const init = useCallback(() => {
    addSource("delta-canal", {
      type: "vector",
      url: "mapbox://coeqwal.104i13rb",
    })

    addLayer(
      "delta-canal-layer",
      "delta-canal",
      canalLayerStyle.type,
      canalLayerStyle.paint,
      canalLayerStyle.layout,
      { "source-layer": "delta_canal-25v6sz" },
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
    setMarkers(DAMS, "dam")
    setPaintProperty("canal-layer", "line-opacity", 1)
    setPaintProperty("delta-canal-layer", "line-opacity", 1)
  }, [flyTo, mapViewState, setMarkers, setPaintProperty])

  const unload = useCallback(() => {
    setPaintProperty("delta-canal-layer", "line-opacity", 0)
    setMarkers([], "dam")
  }, [setMarkers, setPaintProperty])

  useEffect(() => {
    if (!isMapReady) return
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
        init()
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        unload()
        //console.log('unload stuff')
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [init, isSectionActive, load, unload, isMapReady])

  const titleOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1])
  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.6],
    [0, 1],
  )
  const thirdParagraphOpacity = useTransform(
    scrollYProgress,
    [0.55, 0.65],
    [0, 1],
  )
  const fourthParagraphOpacity = useTransform(
    scrollYProgress,
    [0.6, 0.7],
    [0, 1],
  )
  const fifthParagraphOpacity = useTransform(
    scrollYProgress,
    [0.65, 0.85],
    [0, 1],
  )

  useEffect(() => {
    const unsubscribe = fifthParagraphOpacity.on("change", (value) => {
      if (value > 0.8) setStartAnimation(true)
    })
    return unsubscribe
  }, [fifthParagraphOpacity])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="130vh"
      sx={{ justifyContent: "space-around" }}
    >
      <Stack spacing={12} direction="column" component="section" role="region">
        <motion.div className="paragraph" style={{ opacity: titleOpacity }}>
          <Typography variant="h2" gutterBottom>
            {content?.subtitle1}
            <br />
            {content?.subtitle2}
          </Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography>
            <span style={{ fontWeight: "bold" }}>
              <u>{content?.p11}</u>
            </span>{" "}
            <LibraryBooksIcon
              sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
            />{" "}
            {/* Link to how water is managed in California*/}
            stores and transports water over thousands of miles
          </Typography>
          <Typography>from wetter to drier parts of the state.</Typography>
        </motion.div>
        <Box className="paragraph">
          <Stack spacing={0} direction="column">
            <MotionTypography style={{ opacity: secondParagraphOpacity }}>
              {content?.p21}{" "}
              <span style={{ fontWeight: "bold", color: InfrastructureColor }}>
                {content?.p22}
              </span>{" "}
              {content?.p23}
            </MotionTypography>
            <MotionTypography style={{ opacity: thirdParagraphOpacity }}>
              {content?.p31}{" "}
              <span style={{ fontWeight: "bold", color: InfrastructureColor }}>
                {content?.p32}
              </span>{" "}
              {content?.p33}
            </MotionTypography>
            <MotionTypography style={{ opacity: fourthParagraphOpacity }}>
              {content?.p41}{" "}
              <span style={{ fontWeight: "bold", color: InfrastructureColor }}>
                {content?.p42}
              </span>{" "}
              {content?.p43}
            </MotionTypography>
          </Stack>
        </Box>
        <motion.div
          className="paragraph"
          style={{ opacity: fifthParagraphOpacity }}
        >
          <Typography>
            Over the past 175 years, the timing and pathways of
            California&apos;s water flows
          </Typography>
          <Typography>
            have been{" "}
            <Underline startAnimation={startAnimation}>
              {content?.transition.p12}
            </Underline>
            {content?.transition.p13}
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

export default SectionTransformation
