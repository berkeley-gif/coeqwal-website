"use client"

import { Box, Stack, Typography } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import {
  motion,
  MotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"
import Bird from "./vis/Bird"
import Grass from "./vis/Grass"
import useActiveSection from "../hooks/useActiveSection"
import { useCallback, useEffect, useMemo, useState } from "react"
import useStoryStore from "../store"
import { Sentence } from "@repo/motion/components"
import {
  DeltaTextLabels,
  FlowTextLabels,
  ValleyTextLabels,
} from "./helpers/mapAnnotations"
import Underline from "./helpers/Underline"
import {
  ValleyBoundary,
  Coordinate,
  DeltaBoundary,
} from "./helpers/data/boundaries"
import * as turf from "@turf/turf"
import { FreshWaterColor } from "./helpers/colorPalette"
import { useSectionLifecycle } from "../hooks/useSectionLifeCycle"

const MotionBox = motion.create(Box)
const MotionTypography = motion.create(Typography)

function SectionDelta() {
  return (
    <>
      <WaterFlow />
      <Valley />
      <Wetland />
      <Delta />
      <Transition />
    </>
  )
}

function WaterFlow() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.flow
  const { sectionRef, isSectionActive } = useActiveSection("flow", {
    amount: 0.5,
  })
  const { setPaintProperty } = useMap() // from our context
  const setMarkers = useStoryStore((state) => state.setMarkers)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (value > 0.3 && value < 0.9) {
      setPaintProperty("snowpack-layer", "fill-opacity", 0)
      setPaintProperty("river-sac-layer", "line-opacity", 1)
      setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)
    } else {
      setPaintProperty("river-sac-layer", "line-opacity", 0)
      setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
    }
  })

  useSectionLifecycle(
    isSectionActive,
    () => {},
    () => {
      setMarkers(FlowTextLabels, "text")
    },
    () => {
      setMarkers([], "text")
    },
  )

  const titleOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1])
  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.5],
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
      className="container"
      height="100vh"
      tabIndex={-1}
      sx={{ justifyContent: "center" }}
      role="region"
    >
      <motion.div className="paragraph" style={{ opacity: titleOpacity }}>
        <Typography variant="h3" gutterBottom>
          {content?.title}
        </Typography>
      </motion.div>
      <Stack
        spacing={10}
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
          <Typography variant="body1">{content?.p3}</Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography variant="body1">{content?.p41}</Typography>
          <Typography variant="body1">
            <span style={{ fontWeight: "bold", color: FreshWaterColor }}>
              {content?.p42}
            </span>
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

function Valley() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.flow
  const { sectionRef, isSectionActive } = useActiveSection("valley", {
    amount: 0.5,
  })
  const { setPaintProperty, mapRef } = useMap() // from our context
  const [startAnimation, setStartAnimation] = useState(false)
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const [boundaryAnimationComplete, setBoundaryAnimationComplete] =
    useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.1 && latest < 0.9) {
      setStartAnimation(true)
      setPaintProperty("valley-boundary-layer", "line-opacity", 1)
      return
    }
    setPaintProperty("valley-boundary-layer", "line-opacity", 0)
  })

  const boundaryData = useMemo(() => {
    const line = turf.lineString(ValleyBoundary)
    const length = turf.length(line, { units: "kilometers" })
    const frames = 100
    const segment = length / frames
    const smoothCoords: Coordinate[] = []
    for (let dist = 0; dist <= length; dist += segment) {
      const pt = turf.along(line, dist, { units: "kilometers" })
      smoothCoords.push(pt.geometry.coordinates as Coordinate)
    }
    smoothCoords.push(ValleyBoundary[ValleyBoundary.length - 1] ?? [0, 0])
    return smoothCoords
  }, [])

  const setUpBoundary = useCallback(
    (scrollYProgress: MotionValue<number>) => {
      if (!mapRef.current || !boundaryData.length) return

      function updateBoundaryBasedOnScroll(scrollProgress: number) {
        if (!mapRef.current) return
        const startScroll = 0.35
        const endScroll = 0.8

        const clampedScroll = Math.max(
          startScroll,
          Math.min(endScroll, scrollProgress),
        )
        const animationProgress =
          (clampedScroll - startScroll) / (endScroll - startScroll)

        // Calculate how many boundary points to show based on scroll progress
        const total = boundaryData.length
        const currentIdx = Math.floor(animationProgress * (total - 1))

        const geoJsonSource = mapRef.current.getSource(
          "valley-boundary",
        ) as mapboxgl.GeoJSONSource
        geoJsonSource.setData({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: boundaryData.slice(0, currentIdx + 1),
          },
          properties: {},
        })

        if (animationProgress >= 1) {
          setBoundaryAnimationComplete(true)
        }
      }

      updateBoundaryBasedOnScroll(scrollYProgress.get())

      const unsubscribe = scrollYProgress.on(
        "change",
        updateBoundaryBasedOnScroll,
      )

      return unsubscribe
    },
    [mapRef, boundaryData, setBoundaryAnimationComplete],
  )

  const load = useCallback(() => {
    setMarkers(ValleyTextLabels, "text")
    if (boundaryAnimationComplete) return
    setUpBoundary(scrollYProgress)
  }, [setMarkers, boundaryAnimationComplete, setUpBoundary, scrollYProgress])

  const unload = useCallback(() => {
    setBoundaryAnimationComplete(false)
    if (!mapRef.current) return
    ;(
      mapRef.current.getSource("valley-boundary") as mapboxgl.GeoJSONSource
    ).setData({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: boundaryData.slice(0, 1),
      },
      properties: {},
    })
  }, [mapRef, boundaryData])

  useSectionLifecycle(isSectionActive, () => {}, load, unload)

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="80vh"
      tabIndex={-1}
      sx={{ justifyContent: "center" }}
      role="region"
    >
      <Box className="paragraph">
        <Sentence custom={0} options={{ amount: 1 }}>
          {content?.valley.p11}
          <Underline startAnimation={startAnimation} delay={0}>
            {content?.valley.p12}
          </Underline>
          {content?.valley.p13}
        </Sentence>
      </Box>
    </Box>
  )
}

function Wetland() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.flow
  const { sectionRef, isSectionActive } = useActiveSection("wetland", {
    amount: 0.5,
  })
  const { setPaintProperty } = useMap() // from our context
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const [startDeltaAnimation, setStartDeltaAnimation] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.3 && latest < 0.8) {
      setPaintProperty("delta-water-layer", "fill-opacity", 1)
      setPaintProperty("delta-wetland-layer", "fill-opacity", 1)
      return
    }
    setPaintProperty("delta-water-layer", "fill-opacity", 0)
    setPaintProperty("delta-wetland-layer", "fill-opacity", 0)
  })

  useSectionLifecycle(
    isSectionActive,
    () => {},
    () => {
      setMarkers(DeltaTextLabels, "text")
    },
    () => {
      setMarkers([], "text")
    },
  )

  const firstParagraphOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    [0, 1],
  )
  const thirdParagraphOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6],
    [0, 1],
  )

  useEffect(() => {
    const unsubscribe = secondParagraphOpacity.on("change", (value) => {
      if (value === 1) setStartDeltaAnimation(true)
    })

    return () => {
      unsubscribe()
    }
  }, [secondParagraphOpacity])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Stack
        spacing={8}
        direction="column"
        component="section"
        role="region"
        sx={{ width: "100%" }}
      >
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography variant="body1">{content?.valley.p2}</Typography>
          <Typography variant="body1">{content?.valley.p3}</Typography>
          <Typography variant="body1">{content?.valley.p4}</Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography variant="body1">
            {content?.transition.p11}
            <Underline startAnimation={startDeltaAnimation}>
              {content?.transition.p12}
            </Underline>
            {content?.transition.p13}
          </Typography>
          <Typography variant="body1">{content?.transition.p14}</Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: thirdParagraphOpacity }}
        >
          <Typography variant="body1">{content?.transition.p2}</Typography>
          <Typography variant="caption">
            GIS data source:{" "}
            <a
              href="https://www.sfei.org/projects/sacramento-san-joaquin-delta-historical-ecology-study#toc-associated-data"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              San Francisco Estuary Institute
            </a>
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

function Delta() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.delta
  const { sectionRef, isSectionActive } = useActiveSection("delta", {
    amount: 0.1,
  })
  const { setPaintProperty, mapRef } = useMap() // from our context
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const [boundaryAnimationComplete, setBoundaryAnimationComplete] =
    useState(false)

  const sectionOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.7, 0.9],
    [0, 1, 1, 0],
  )

  const boundaryData = useMemo(() => {
    const line = turf.lineString(DeltaBoundary)
    const length = turf.length(line, { units: "kilometers" })
    const frames = 100
    const segment = length / frames
    const smoothCoords: Coordinate[] = []
    for (let dist = 0; dist <= length; dist += segment) {
      const pt = turf.along(line, dist, { units: "kilometers" })
      smoothCoords.push(pt.geometry.coordinates as Coordinate)
    }
    smoothCoords.push(DeltaBoundary[DeltaBoundary.length - 1] ?? [0, 0])
    return smoothCoords
  }, [])

  const setUpBoundary = useCallback(
    (scrollYProgress: MotionValue<number>) => {
      if (!mapRef.current || !boundaryData.length) return

      function updateBoundaryBasedOnScroll(scrollProgress: number) {
        if (!mapRef.current) return
        const startScroll = 0.2
        const endScroll = 0.5

        const clampedScroll = Math.max(
          startScroll,
          Math.min(endScroll, scrollProgress),
        )
        const animationProgress =
          (clampedScroll - startScroll) / (endScroll - startScroll)

        const total = boundaryData.length
        const currentIdx = Math.floor(animationProgress * (total - 1))

        const geoJsonSource = mapRef.current.getSource(
          "delta-boundary",
        ) as mapboxgl.GeoJSONSource
        geoJsonSource.setData({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: boundaryData.slice(0, currentIdx + 1),
          },
          properties: {},
        })

        if (animationProgress >= 1) {
          //setBoundaryAnimationComplete(true)
        }
      }

      updateBoundaryBasedOnScroll(scrollYProgress.get())

      const unsubscribe = scrollYProgress.on(
        "change",
        updateBoundaryBasedOnScroll,
      )

      return unsubscribe
    },
    [mapRef, boundaryData],
  )

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.1 && latest < 0.8) {
      setPaintProperty("delta-boundary-layer", "line-opacity", 1)
      return
    }
    setPaintProperty("delta-boundary-layer", "line-opacity", 0)
  })

  const unload = useCallback(() => {
    //setPaintProperty("delta-boundary-layer", "line-opacity", 0)
    setBoundaryAnimationComplete(false)
    if (!mapRef.current) return
    ;(
      mapRef.current.getSource("delta-boundary") as mapboxgl.GeoJSONSource
    ).setData({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: boundaryData.slice(0, 1),
      },
      properties: {},
    })
  }, [mapRef, boundaryData])

  const load = useCallback(() => {
    setMarkers([], "text")
    if (boundaryAnimationComplete) return
    setUpBoundary(scrollYProgress)
  }, [setMarkers, setUpBoundary, scrollYProgress, boundaryAnimationComplete])

  useSectionLifecycle(isSectionActive, () => {}, load, unload)

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.7, 0.99],
    [0, 1, 1, 0],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.25, 0.5, 0.7, 0.99],
    [0, 1, 1, 0],
  )
  const firstSentenceOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6, 0.7, 0.99],
    [0, 1, 1, 0],
  )
  const secondSentenceOpacity = useTransform(
    scrollYProgress,
    [0.45, 0.65, 0.7, 0.99],
    [0, 1, 1, 0],
  )
  const thirdSentenceOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.7, 0.7, 0.99],
    [0, 1, 1, 0],
  )

  return (
    <Box
      height="auto"
      width="100%"
      sx={{
        position: "relative",
      }}
      tabIndex={-1}
      role="region"
    >
      <Box
        ref={sectionRef}
        height="250vh" // Control this to determine how long the section is visible
        width="100%"
        sx={{ position: "relative" }}
      ></Box>

      <Box className="sticky-container">
        <motion.div
          id="sticky-delta"
          className="filled-container"
          style={{
            height: "50vh",
            width: "100%",
          }}
        >
          <Bird opacity={sectionOpacity} />
          <Grass opacity={sectionOpacity} />
          <motion.div
            className="paragraph"
            style={{ opacity: firstParagraphOpacity }}
          >
            <Typography variant="body1">
              {content?.p11}{" "}
              <span style={{ fontWeight: "bold" }}>{content?.p12}</span>
              {""}
              {content?.p13}
            </Typography>
          </motion.div>
          <motion.div
            className="paragraph"
            style={{ opacity: secondParagraphOpacity }}
          >
            <Typography variant="body1">{content?.p2}</Typography>
          </motion.div>
          <Box
            className="paragraph"
            style={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <MotionTypography
              variant="body1"
              style={{ opacity: firstSentenceOpacity }}
            >
              {content?.p3}
            </MotionTypography>
            <MotionTypography
              variant="body1"
              style={{ opacity: secondSentenceOpacity }}
            >
              {content?.p4}
            </MotionTypography>
            <MotionTypography
              variant="body1"
              style={{ opacity: thirdSentenceOpacity }}
              gutterBottom
            >
              {content?.p5}
            </MotionTypography>
            <MotionTypography
              variant="caption"
              style={{ opacity: firstParagraphOpacity }}
            >
              GIS data source:{" "}
              <a
                href="https://gis.data.cnra.ca.gov/maps/3efc635b27344a3da989ca1e7108f5e0/explore?location=38.104861%2C-121.568577%2C9.99"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline" }}
              >
                California Natural Resources Agency
              </a>
            </MotionTypography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  )
}

//TODO: sometimes see a 1px gap between this and Delta (found out the delta section is not high enough??)
function Transition() {
  const storyline = useStoryStore((state) => state.storyline)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const content = storyline?.delta
  const { sectionRef, isSectionActive } = useActiveSection("transition", {
    amount: 0.5,
  })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0.6, 0.9], [1, 0])

  useSectionLifecycle(
    isSectionActive,
    () => {},
    () => {
      setTextMarkers([], "text")
    },
    () => {},
  )

  return (
    <MotionBox
      style={{ width: "100%", height: "100%", zIndex: 1, opacity: opacity }}
    >
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100vh",
          zIndex: 2,
          overflowY: "hidden",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="0.3"
            initial={{ r: 0 }}
            animate={{ r: [0, 45], opacity: [1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: "easeOut",
            }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="0.3"
            initial={{ r: 0 }}
            animate={{ r: [0, 30], opacity: [1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
              repeatDelay: 1.5,
              ease: "easeOut",
            }}
          />
        </svg>
      </Box>
      <Box
        ref={sectionRef}
        className="container-center filled-container"
        height="100vh"
        width="100%"
      >
        <Box className="paragraph" sx={{ p: 1 }}>
          <Typography variant="h2">{content?.transition}</Typography>
        </Box>
      </Box>
    </MotionBox>
  )
}

export default SectionDelta
