"use client"

import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { motion } from "@repo/motion"
import {
  deltaMapViewState,
  riverMapViewState,
  stateMapViewState,
} from "./helpers/mapViews"

import Bird from "./vis/Bird"
import Grass from "./vis/Grass"
import useActiveSection from "../hooks/useActiveSection"
import { useCallback, useEffect, useRef } from "react"
import { riverLayerStyle } from "./helpers/mapLayerStyle"
import useStoryStore from "../store"
import { Sentence } from "@repo/motion/components"
import { FlowTextLabels } from "./helpers/mapAnnotations"

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

  const init = useCallback(() => {
    addSource("river-sac", {
      type: "geojson",
      data: "/rivers/SacramentoRiver_wo.geojson",
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
      longitude: riverMapViewState.longitude,
      latitude: riverMapViewState.latitude,
      zoom: riverMapViewState.zoom,
      pitch: riverMapViewState.pitch,
      bearing: riverMapViewState.bearing,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("river-sac-layer", "line-opacity", 1)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)
    setMarkers(FlowTextLabels, "text")
  }, [flyTo, setMarkers, setPaintProperty])

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
        <Sentence custom={4}>{content?.p41}</Sentence>
        <Sentence custom={5.5}>
          <span>{content?.p42}</span>
          <span>{content?.p43}</span>
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
  const { flyTo, setPaintProperty } = useMap() // from our context
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const hasSeen = useRef(false)

  const load = useCallback(() => {
    flyTo({
      longitude: riverMapViewState.longitude,
      latitude: riverMapViewState.latitude,
      zoom: riverMapViewState.zoom,
      pitch: riverMapViewState.pitch,
      bearing: riverMapViewState.bearing,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("river-sac-layer", "line-opacity", 1)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)
    setMarkers(FlowTextLabels, "text")
  }, [flyTo, setMarkers, setPaintProperty])

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
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Sentence custom={0}>{content?.valley.p1}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={1}>
          {content?.valley.p2}{" "}
          <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
        <Sentence custom={2}>
          {content?.valley.p3}{" "}
          <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
        <Sentence custom={3}>{content?.valley.p4}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={4}>{content?.transition.p11}</Sentence>
        <Sentence custom={5}>{content?.transition.p12}</Sentence>
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

  const load = useCallback(() => {
    flyTo({
      longitude: deltaMapViewState.longitude,
      latitude: deltaMapViewState.latitude,
      zoom: deltaMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("river-sac-layer", "line-opacity", 0)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
    setMarkers([], "text")
  }, [flyTo, setMarkers, setPaintProperty])

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

  const load = useCallback(() => {
    flyTo({
      longitude: stateMapViewState.longitude,
      latitude: stateMapViewState.latitude,
      zoom: stateMapViewState.zoom,
      transitionOptions: {
        duration: 1000,
      },
    })
  }, [flyTo])

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
        <Box className="paragraph">
          <Typography variant="h2">{content?.transition}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default SectionDelta
