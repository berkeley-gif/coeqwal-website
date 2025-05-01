"use client"

import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { motion } from "@repo/motion"
import {
  deltaMapViewState,
  riverDeltaMapViewState,
  riverMapViewState,
  stateMapViewState,
} from "./helpers/mapViews"

import Bird from "./vis/Bird"
import Grass from "./vis/Grass"
import useActiveSection from "../hooks/useActiveSection"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  deltaWaterLayerStyle,
  deltaWetlandLayerStyle,
  riverLayerStyle,
} from "./helpers/mapLayerStyle"
import useStoryStore from "../store"
import { Sentence } from "@repo/motion/components"
import { FlowTextLabels, ValleyTextLabels } from "./helpers/mapAnnotations"
import Underline from "./helpers/Underline"
import { useBreakpoint } from "@repo/ui/hooks"

function SectionDelta() {
  return (
    <>
      <WaterFlow />
      <Valley />
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
  const [startAnimation, setStartAnimation] = useState(false)
  const breakpoint = useBreakpoint()
  const mapViewState = riverMapViewState[breakpoint]

  /*
  const fetchGeoJSON = useCallback(async (url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching GeoJSON:", error)
      return null
    }
  }, [])*/

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
        //console.log('unload stuff')
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, init, load])

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
        <Sentence custom={2}>
          {content?.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
        <Sentence custom={3}>{content?.p3}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence
          custom={4}
          onAnimationComplete={() => setStartAnimation(true)}
        >
          {content?.p41}
          <Underline startAnimation={startAnimation} delay={0.5}>
            {content?.p42}
          </Underline>
          {content?.p43}
        </Sentence>
        <Sentence custom={5.5}>
          <span style={{ fontWeight: "bold" }}>{content?.p44}</span>
          <span>{content?.p45}</span>
        </Sentence>
      </Box>
    </Box>
  )
}

function Valley() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.flow
  const { sectionRef, isSectionActive } = useActiveSection("valley", {
    amount: 0.5,
  })
  const { flyTo, setPaintProperty, addSource, addLayer } = useMap() // from our context
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const hasSeen = useRef(false)
  const [startValleyAnimation, setStartValleyAnimation] = useState(false)
  const [startDeltaAnimation, setStartDeltaAnimation] = useState(false)
  const breakpoint = useBreakpoint()
  const mapViewState = riverDeltaMapViewState[breakpoint]

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
    setMarkers(ValleyTextLabels, "text")
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
        <Sentence
          custom={0}
          onAnimationComplete={() => setStartValleyAnimation(true)}
        >
          {content?.valley.p11}
          <Underline startAnimation={startValleyAnimation} delay={0.5}>
            {content?.valley.p12}
          </Underline>
          {content?.valley.p13}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={1}>
          {content?.valley.p2}{" "}
          <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
        <Sentence custom={2}>{content?.valley.p3}</Sentence>
        <Sentence custom={3}>{content?.valley.p4}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence
          custom={4}
          onAnimationComplete={() => setStartDeltaAnimation(true)}
        >
          {content?.transition.p11}
          <Underline startAnimation={startDeltaAnimation}>
            {content?.transition.p12}
          </Underline>
          {content?.transition.p13}
        </Sentence>
        <Sentence custom={5}>{content?.transition.p14}</Sentence>
        <Sentence custom={6}>{content?.transition.p2}</Sentence>
      </Box>
    </Box>
  )
}

//TODO: add animation for these graphics
//TODO: show up by sentence
function Delta() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.delta
  const { sectionRef, isSectionActive } = useActiveSection("delta", {
    amount: 0.1,
  })
  const { flyTo, setPaintProperty } = useMap() // from our context
  const hasSeen = useRef(false)
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const breakpoint = useBreakpoint()
  const mapViewState = deltaMapViewState[breakpoint]

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
    setMarkers([], "text")
  }, [flyTo, setMarkers, setPaintProperty, mapViewState])

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
    <Box
      id="delta"
      style={{ height: "100%", zIndex: 1, pointerEvents: "none" }}
    >
      <Box
        ref={sectionRef}
        className="container"
        height="150vh"
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
        <Bird />
        <Grass />
        <Box className="paragraph">
          <Typography variant="body1">
            {content?.p11}{" "}
            <span style={{ fontWeight: "bold" }}>{content?.p12}</span>
            {""}
            {content?.p13}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Sentence custom={1}>{content?.p2}</Sentence>
        </Box>
        <Box className="paragraph">
          <Sentence custom={3}>{content?.p3}</Sentence>
          <Sentence custom={4.5}>{content?.p4}</Sentence>
          <Sentence custom={6}>{content?.p5}</Sentence>
        </Box>
      </motion.div>
    </Box>
  )
}

//TODO: instead of scrolling away, make it disappear
//TODO: sometimes see a 1px gap between this and Delta
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
    <Box style={{ width: "100%", height: "100%", zIndex: 1 }}>
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
    </Box>
  )
}

export default SectionDelta
