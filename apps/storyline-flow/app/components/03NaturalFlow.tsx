"use client"

import { Box, Stack, Typography } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { motion, MotionValue, useScroll, useTransform } from "@repo/motion"
import {
  deltaMapViewState,
  riverDeltaMapViewState,
  riverMapViewState,
  riverValleyMapViewState,
  stateMapViewState,
} from "./helpers/mapViews"

import Bird from "./vis/Bird"
import Grass from "./vis/Grass"
import useActiveSection from "../hooks/useActiveSection"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  boundaryPaintStyle,
  deltaWaterLayerStyle,
  deltaWetlandLayerStyle,
  riverLayerStyle,
} from "./helpers/mapLayerStyle"
import useStoryStore from "../store"
import { Sentence } from "@repo/motion/components"
import {
  DeltaTextLabels,
  FlowTextLabels,
  ValleyTextLabels,
} from "./helpers/mapAnnotations"
import Underline from "./helpers/Underline"
import { useBreakpoint } from "@repo/ui/hooks"
import {
  ValleyBoundary,
  Coordinate,
  DeltaBoundary,
} from "./helpers/data/boundaries"
import * as turf from "@turf/turf"
import { FreshWaterColor } from "./helpers/colorPalette"

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
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.flow
  const { sectionRef, isSectionActive } = useActiveSection("flow", {
    amount: 0.5,
  })
  const hasSeen = useRef(false)
  const { addSource, addLayer, setPaintProperty, flyTo } = useMap() // from our context
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const breakpoint = useBreakpoint()
  const mapViewState = riverMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const init = useCallback(async () => {
    //console.log("riverSacData", riverSacData);

    addSource("river-sac", {
      type: "geojson",
      data: "/rivers/SacramentoRiver.geojson",
    })

    addLayer(
      "river-sac-layer",
      "river-sac",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
    )

    addSource("river-sanjoaquin", {
      type: "geojson",
      data: "/rivers/SanJoaquinRiver.geojson",
    })

    addLayer(
      "river-sanjoaquin-layer",
      "river-sanjoaquin",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
    )
  }, [addLayer, addSource])

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 0,
      pitch: mapViewState?.pitch ?? 0,
      bearing: mapViewState?.bearing ?? 0,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("river-sac-layer", "line-opacity", 1)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)
    setPaintProperty("snowpack-layer", "fill-opacity", 0)
    setMarkers(FlowTextLabels, "text")
  }, [flyTo, setMarkers, setPaintProperty, mapViewState])

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
        setMarkers([], "text")
        //console.log('unload stuff')
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, init, load, setMarkers, isMapReady])

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
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.flow
  const { sectionRef, isSectionActive } = useActiveSection("valley", {
    amount: 0.5,
  })
  const { flyTo, setPaintProperty, addSource, addLayer, mapRef } = useMap() // from our context
  const hasSeen = useRef(false)
  const [startAnimation, setStartAnimation] = useState(false)
  const breakpoint = useBreakpoint()
  const mapViewState = riverValleyMapViewState[breakpoint]
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const [boundaryAnimationComplete, setBoundaryAnimationComplete] =
    useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
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
        const startScroll = 0.3
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
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 0,
      pitch: mapViewState?.pitch ?? 0,
      bearing: mapViewState?.bearing ?? 0,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("delta-water-layer", "fill-opacity", 0)
    setPaintProperty("delta-wetland-layer", "fill-opacity", 0)
    setPaintProperty("snowpack-layer", "fill-opacity", 0)
    setMarkers(ValleyTextLabels, "text")
    if (boundaryAnimationComplete) return
    setPaintProperty("valley-boundary-layer", "line-opacity", 1)
    setUpBoundary(scrollYProgress)
  }, [
    flyTo,
    mapViewState,
    setPaintProperty,
    setMarkers,
    boundaryAnimationComplete,
    setUpBoundary,
    scrollYProgress,
  ])

  const init = useCallback(() => {
    addSource("valley-boundary", {
      type: "geojson",
      data: turf.featureCollection([]),
    })
    addLayer(
      "valley-boundary-layer",
      "valley-boundary",
      boundaryPaintStyle.type,
      boundaryPaintStyle.paint,
      boundaryPaintStyle.layout,
      {},
    )
  }, [addLayer, addSource])

  const unload = useCallback(() => {
    setPaintProperty("valley-boundary-layer", "line-opacity", 0)
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
  }, [setPaintProperty, mapRef, boundaryData])

  useEffect(() => {
    if (!isMapReady) return
    if (isSectionActive) {
      if (!hasSeen.current) {
        init()
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        unload()
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [init, isSectionActive, load, unload, isMapReady])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      sx={{ justifyContent: "center" }}
      role="region"
    >
      <Box className="paragraph">
        <Sentence
          custom={0}
          options={{ amount: 1 }}
          onAnimationComplete={() => {
            setStartAnimation(true)
          }}
        >
          {content?.valley.p11}
          <Underline startAnimation={startAnimation} delay={0.5}>
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
  const { flyTo, setPaintProperty, addSource, addLayer } = useMap() // from our context
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const hasSeen = useRef(false)
  const [startDeltaAnimation, setStartDeltaAnimation] = useState(false)
  const breakpoint = useBreakpoint()
  const mapViewState = riverDeltaMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const init = useCallback(() => {
    addSource("delta-water", {
      type: "vector",
      url: "mapbox://coeqwal.97rr9qs8",
    })
    addLayer(
      "delta-water-layer",
      "delta-water",
      deltaWaterLayerStyle.type,
      deltaWaterLayerStyle.paint,
      {},
      deltaWaterLayerStyle.layer,
    )
    addSource("delta-wetland", {
      type: "vector",
      url: "mapbox://coeqwal.29dkicxr",
    })
    addLayer(
      "delta-wetland-layer",
      "delta-wetland",
      deltaWetlandLayerStyle.type,
      deltaWetlandLayerStyle.paint,
      {},
      deltaWetlandLayerStyle.layer,
    )
  }, [addSource, addLayer])

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 0,
      pitch: mapViewState?.pitch ?? 0,
      bearing: mapViewState?.bearing ?? 0,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("delta-water-layer", "fill-opacity", 1)
    setPaintProperty("delta-wetland-layer", "fill-opacity", 1)
    setMarkers(DeltaTextLabels, "text")
  }, [flyTo, mapViewState, setMarkers, setPaintProperty])

  const unload = useCallback(() => {
    setPaintProperty("delta-water-layer", "fill-opacity", 0)
    setPaintProperty("delta-wetland-layer", "fill-opacity", 0)
    setMarkers([], "text")
  }, [setPaintProperty, setMarkers])

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
        unload()
        //console.log('unload stuff')
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load, init, unload])

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
          <Typography variant="body1">{content?.valley.p2} </Typography>
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
        </motion.div>
      </Stack>
    </Box>
  )
}

function Delta() {
  const storyline = useStoryStore((state) => state.storyline)
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.delta
  const { sectionRef, isSectionActive } = useActiveSection("delta", {
    amount: 0.1,
  })
  const { flyTo, setPaintProperty, mapRef, addSource, addLayer } = useMap() // from our context
  const hasSeen = useRef(false)
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const breakpoint = useBreakpoint()
  const mapViewState = deltaMapViewState[breakpoint]
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const [boundaryAnimationComplete, setBoundaryAnimationComplete] =
    useState(false)

  /*
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
  })*/
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

  //TODO: figure out why this only work once
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

  const init = useCallback(() => {
    addSource("delta-boundary", {
      type: "geojson",
      data: turf.featureCollection([]),
    })
    addLayer(
      "delta-boundary-layer",
      "delta-boundary",
      boundaryPaintStyle.type,
      boundaryPaintStyle.paint,
      boundaryPaintStyle.layout,
      {},
    )
  }, [addLayer, addSource])

  const unload = useCallback(() => {
    setPaintProperty("delta-boundary-layer", "line-opacity", 0)
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
  }, [setPaintProperty, mapRef, boundaryData])

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 0,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("river-sac-layer", "line-opacity", 0)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
    setPaintProperty("snowpack-layer", "fill-opacity", 0)
    setMarkers([], "text")
    if (boundaryAnimationComplete) return
    setPaintProperty("valley-boundary-layer", "line-opacity", 1)
    setUpBoundary(scrollYProgress)
  }, [
    flyTo,
    setMarkers,
    setPaintProperty,
    mapViewState,
    setUpBoundary,
    scrollYProgress,
    boundaryAnimationComplete,
  ])

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
        //console.log('unload stuff')
        unload()
      } else {
        return
      }
    }
  }, [init, isSectionActive, load, unload, isMapReady])

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
        height="350vh" // Control this to determine how long the section is visible
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
            >
              {content?.p5}
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
  const content = storyline?.delta
  const { sectionRef, isSectionActive } = useActiveSection("transition", {
    amount: 0.5,
  })
  const hasSeen = useRef(false)
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = stateMapViewState[breakpoint]
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0.6, 0.9], [1, 0])

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 0,
      transitionOptions: {
        duration: 1000,
      },
    })
  }, [flyTo, mapViewState])

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load])

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
