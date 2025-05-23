"use client"

import { Box, Typography } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { motion, useScroll, useSpring, useTransform } from "@repo/motion"
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
import ScrollIndicator from "./helpers/ScrollIndicator"
import {
  ValleyBoundary,
  Coordinate,
  DeltaBoundary,
} from "./helpers/data/boundaries"
import * as turf from "@turf/turf"

const MotionBox = motion.create(Box)

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
  const hasSeen = useRef(false)
  const { addSource, addLayer, setPaintProperty, flyTo } = useMap() // from our context
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const breakpoint = useBreakpoint()
  const mapViewState = riverMapViewState[breakpoint]
  const [animationComplete, setAnimationComplete] = useState(false)

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
  }, [isSectionActive, init, load, setMarkers])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Sentence variant="h3" gutterBottom custom={0}>
          {content?.title}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={1}>{content?.p1}</Sentence>
        <Sentence custom={2}>{content?.p2}</Sentence>
        <Sentence custom={3}>{content?.p3}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={4}>{content?.p41}</Sentence>
        <Sentence
          custom={5.5}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
          <span style={{ fontWeight: "bold", color: "#3d8ec9" }}>
            {content?.p42}
          </span>
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
    </Box>
  )
}

function Valley() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.flow
  const { sectionRef, isSectionActive } = useActiveSection("valley", {
    amount: 0.5,
  })
  const { flyTo, setPaintProperty, addSource, addLayer, mapRef } = useMap() // from our context
  const hasSeen = useRef(false)
  const [startAnimation, setStartAnimation] = useState(false)
  const breakpoint = useBreakpoint()
  const mapViewState = riverValleyMapViewState[breakpoint]
  const [animationComplete, setAnimationComplete] = useState(false)
  const [boundaryAnimationComplete, setBoundaryAnimationComplete] =
    useState(false)
  const setMarkers = useStoryStore((state) => state.setMarkers)

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

  const setUpBoundary = useCallback(() => {
    let idx = 0
    const total = boundaryData.length

    function frame() {
      if (!mapRef.current) return // update line up to current idx
      ;(
        mapRef.current.getSource("valley-boundary") as mapboxgl.GeoJSONSource
      ).setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: boundaryData.slice(0, idx + 1),
        },
        properties: {},
      })

      if (idx < total - 1) {
        idx += 1
        setTimeout(frame, 1)
      }
      if (idx === total - 1) {
        setBoundaryAnimationComplete(true)
      }
    }

    // start after a short pause
    setTimeout(frame, 500)
  }, [mapRef, boundaryData])

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
    setUpBoundary()
  }, [
    flyTo,
    mapViewState,
    setPaintProperty,
    setUpBoundary,
    boundaryAnimationComplete,
    setMarkers,
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
  }, [init, isSectionActive, load, unload])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Sentence
          custom={0}
          onAnimationComplete={() => {
            setStartAnimation(true)
            setAnimationComplete(true)
          }}
        >
          {content?.valley.p11}
          <Underline startAnimation={startAnimation} delay={0.5}>
            {content?.valley.p12}
          </Underline>
          {content?.valley.p13}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} delay={1.5} />
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
  const [animationComplete, setAnimationComplete] = useState(false)

  const init = useCallback(() => {
    addSource("delta-water", {
      type: "vector",
      url: "mapbox://yskuo.6mkxbslj",
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
      url: "mapbox://yskuo.90ys4c1j",
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

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Sentence custom={0}>{content?.valley.p2} </Sentence>
        <Sentence custom={1}>{content?.valley.p3}</Sentence>
        <Sentence custom={2}>{content?.valley.p4}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence
          custom={3}
          onAnimationComplete={() => setStartDeltaAnimation(true)}
        >
          {content?.transition.p11}
          <Underline startAnimation={startDeltaAnimation}>
            {content?.transition.p12}
          </Underline>
          {content?.transition.p13}
        </Sentence>
        <Sentence custom={4}>{content?.transition.p14}</Sentence>
        <Sentence
          custom={5}
          onAnimationComplete={() => {
            setAnimationComplete(true)
          }}
        >
          {content?.transition.p2}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
    </Box>
  )
}

function Delta() {
  const storyline = useStoryStore((state) => state.storyline)
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
  const [animationComplete, setAnimationComplete] = useState(false)
  const [boundaryAnimationComplete, setBoundaryAnimationComplete] =
    useState(false)

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
  })
  const opacity = useTransform(smoothProgress, [0.65, 0.9], [1, 0])

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

  const setUpBoundary = useCallback(() => {
    let idx = 0
    const total = boundaryData.length

    function frame() {
      if (!mapRef.current) return // update line up to current idx
      ;(
        mapRef.current.getSource("delta-boundary") as mapboxgl.GeoJSONSource
      ).setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: boundaryData.slice(0, idx + 1),
        },
        properties: {},
      })

      if (idx < total - 1) {
        idx += 1
        setTimeout(frame, 1)
      }
      if (idx === total - 1) {
        setBoundaryAnimationComplete(true)
      }
    }

    // start after a short pause
    setTimeout(frame, 500)
  }, [mapRef, boundaryData])

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
    setUpBoundary()
  }, [
    flyTo,
    setMarkers,
    setPaintProperty,
    mapViewState,
    setUpBoundary,
    boundaryAnimationComplete,
  ])

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
      id="delta"
      style={{ height: "100%", zIndex: 1, pointerEvents: "none" }}
    >
      <Box
        ref={sectionRef}
        className="container"
        height="140vh"
        width="1px"
        sx={{ pointerEvents: "none" }}
      ></Box>
      <motion.div
        id="sticky-section"
        className="container-center"
        style={{
          backgroundColor: "#031a35",
          height: "50vh",
          overflowY: "hidden",
          overflowX: "hidden",
        }}
      >
        <Bird opacity={opacity} />
        <Grass opacity={opacity} />
        <MotionBox className="paragraph" style={{ opacity }}>
          <Typography variant="body1">
            {content?.p11}{" "}
            <span style={{ fontWeight: "bold" }}>{content?.p12}</span>
            {""}
            {content?.p13}
          </Typography>
        </MotionBox>
        <MotionBox className="paragraph" style={{ opacity }}>
          <Sentence custom={1}>{content?.p2}</Sentence>
        </MotionBox>
        <MotionBox className="paragraph" style={{ opacity }}>
          <Sentence custom={3}>{content?.p3}</Sentence>
          <Sentence custom={4.5}>{content?.p4}</Sentence>
          <Sentence
            custom={6}
            onAnimationComplete={() => setAnimationComplete(true)}
          >
            {content?.p5}
          </Sentence>
        </MotionBox>
        <ScrollIndicator
          animationComplete={animationComplete}
          opacity={opacity}
        />
      </motion.div>
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

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
  })
  const opacity = useTransform(smoothProgress, [0.6, 0.8], [1, 0])

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
        sx={{ position: "absolute", width: "100%", height: "130vh", zIndex: 2 }}
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
        className="container-center"
        height="130vh"
        width="100%"
        sx={{ backgroundColor: "#031a35" }}
      >
        <Box className="paragraph" sx={{ p: 1 }}>
          <Typography variant="h2">{content?.transition}</Typography>
        </Box>
      </Box>
    </MotionBox>
  )
}

export default SectionDelta
