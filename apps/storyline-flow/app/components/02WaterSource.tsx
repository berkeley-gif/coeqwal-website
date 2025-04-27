"use client"

import { Box, Typography } from "@repo/ui/mui"
import { useState, useCallback, useRef, useEffect } from "react"
import { useMap } from "@repo/map/client"
import { motion } from "@repo/motion"
import { useInViewVisibility } from "../hooks/useInViewVisibility"
import { useFetchData } from "../hooks/useFetchData"
import PrecipitationBar from "./vis/PrecipitationBar"
import { precipitationPaintStyle } from "./helpers/mapLayerStyle"
import useActiveSection from "../hooks/useActiveSection"
import { MarkerType } from "./helpers/mapMarkers"
import useStoryStore from "../store"

import { opacityVariants } from "@repo/motion/variants"
import AnimatedCurve from "./vis/AnimatedCurve"

const MotionText = motion.create(Typography)

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

//TODO: current onEnter() will be triggered twice, but it could just be strict mode or something
function Precipitation() {
  const { addLayer, addSource, setPaintProperty } = useMap()
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.precipitation
  const { sectionRef, isSectionActive } = useActiveSection("precipitation", {
    amount: 0.2,
  })
  const hasSeen = useRef(false)

  const init = useCallback(() => {
    console.log("here")
    addSource("precipitation-vector", {
      type: "vector",
      url: "mapbox://yskuo.9zuvqy7z",
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
    console.log("bebug/loop")
    setPaintProperty("precipitation-vector-layer", "fill-opacity", 1)
  }, [setPaintProperty])

  const unload = useCallback(() => {
    setPaintProperty("precipitation-vector-layer", "fill-opacity", 0)
  }, [setPaintProperty])

  const springUpVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { type: "spring", delay: custom * 1.5 },
    }),
  }

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        console.log("initialize stuff")
        init()
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        console.log("unload stuff")
        unload()
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, init, load, unload])

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
        <MotionText
          variant="h3"
          gutterBottom
          variants={springUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          custom={0}
        >
          {content?.title}
        </MotionText>
      </Box>
      <Box className="paragraph">
        <MotionText
          variant="body1"
          variants={springUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={1}
        >
          {content?.p1}
        </MotionText>
        <MotionText
          variant="body1"
          variants={springUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={2}
        >
          {content?.p2}
        </MotionText>
      </Box>
      <Box className="paragraph">
        <MotionText
          variant="body1"
          variants={springUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={3}
        >
          {content?.p3}
        </MotionText>
        <MotionText
          variant="body1"
          variants={springUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={4}
        >
          {content?.p4}
        </MotionText>
      </Box>
    </Box>
  )
}

function Variability({ markers }: { markers: Record<string, MarkerType[]> }) {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.variability
  const { sectionRef, isSectionActive } = useActiveSection("variability", {
    amount: 0.5,
  })
  //TODO: update this one
  const visRef = useInViewVisibility()
  const hasSeen = useRef(false)

  const [startBarAnimation, setStartBarAnimation] = useState(false)
  const setMarkers = useStoryStore((state) => state.setMarkers)

  const getSelectedYear = (year: string) => {
    const points = markers[year] || []
    setMarkers(points)
  }

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
      }
      hasSeen.current = true
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
        setMarkers([])
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, setMarkers])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Typography variant="body1">{content?.p1}</Typography>
        <Typography variant="body1">{content?.p2}</Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">{content?.p3}</Typography>
        <Typography variant="body1">{content?.p4}</Typography>
      </Box>
      <motion.div
        ref={visRef.ref}
        style={{ height: "100%", width: "100%" }}
        className="paragraph"
        variants={opacityVariants}
        initial="hidden"
        animate={visRef.controls}
        custom={3}
        onAnimationComplete={() => setStartBarAnimation(true)}
      >
        <Typography variant="h6">
          California Annual Precipitation Relative to Historical Average
        </Typography>
        <PrecipitationBar
          yearLabels={Object.keys(markers).map((key) => parseInt(key))}
          startAnimation={startBarAnimation}
          getSelectedYear={getSelectedYear}
        />
      </motion.div>
    </Box>
  )
}

//TODO: add snowpack
function Snowpack() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.snowpack
  const { sectionRef } = useActiveSection("snowpack", { amount: 0.5 })
  const visRef = useInViewVisibility()

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Typography variant="h3" gutterBottom>
          {content?.title}
        </Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">{content?.p1}</Typography>
        <Typography variant="body1">{content?.p2}</Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">{content?.p3}</Typography>
      </Box>
      <div
        ref={visRef.ref}
        style={{ height: "100%", width: "100%" }}
        className="paragraph"
      >
        <Typography variant="h6">
          {"From Snow to Snowmelt \u2014 an Illustration"}
        </Typography>
        <AnimatedCurve />
      </div>
    </Box>
  )
}

export default SectionWaterSource
