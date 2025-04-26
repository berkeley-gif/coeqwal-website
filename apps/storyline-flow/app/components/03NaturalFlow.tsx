"use client"

import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { motion } from "@repo/motion"
import { deltaMapViewState, stateMapViewState } from "./helpers/mapViews"

import Bird from "./vis/Bird"
import Grass from "./vis/Grass"
import useActiveSection from "../hooks/useActiveSection"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { riverLayerStyle } from "./helpers/mapLayerStyle"
import useStoryStore from "../store"

function SectionDelta() {
  return (
    <>
      <WaterFlow />
      <Delta />
      <Transition />
    </>
  )
}

function WaterFlow() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.flow
  const sectionRef = useRef<HTMLDivElement>(null)
  const flowSection = useActiveSection("flow", { amount: 0.1 })
  const flowSectionRef = flowSection.sectionRef
  const isFlowSectionActive = flowSection.isSectionActive
  const hasSeen = useRef(false)
  const valleySection = useActiveSection("valley", { amount: 0.5 })
  const valleySectionRef = valleySection.sectionRef
  const { addSource, addLayer, setPaintProperty, flyTo } = useMap() // from our context

  const closeMapViewState = useMemo(
    () => ({
      latitude: 38.8309,
      longitude: -124.8652,
      zoom: 7,
    }),
    [],
  )

  const initFlow = useCallback(() => {
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

  const loadFlow = useCallback(() => {
    flyTo({
      longitude: closeMapViewState.longitude,
      latitude: closeMapViewState.latitude,
      zoom: closeMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("river-sac-layer", "line-opacity", 1)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)
  }, [flyTo, closeMapViewState, setPaintProperty])

  const unloadFlow = useCallback(() => {
    //TODO: this fly is not the best spot
    flyTo({
      longitude: stateMapViewState.longitude,
      latitude: stateMapViewState.latitude,
      zoom: stateMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("river-sac-layer", "line-opacity", 0)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
  }, [setPaintProperty, flyTo])

  useEffect(() => {
    if (isFlowSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
        initFlow()
      }
      hasSeen.current = true
      loadFlow()
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
        unloadFlow()
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [initFlow, isFlowSectionActive, loadFlow, unloadFlow])

  return (
    <div ref={sectionRef}>
      <Box
        ref={flowSectionRef}
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
          <Typography variant="body1">
            {content?.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
          <Typography variant="body1">{content?.p3}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content?.p4}</Typography>
        </Box>
      </Box>
      <Box
        ref={valleySectionRef}
        className="container"
        height="100vh"
        tabIndex={-1}
        role="region"
      >
        <Box className="paragraph">
          <Typography variant="body1">{content?.valley.p1}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">
            {content?.valley.p2}{" "}
            <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
          <Typography variant="body1">
            {content?.valley.p3}{" "}
            <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
          <Typography variant="body1">{content?.valley.p4}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content?.transition.p1}</Typography>
          <Typography variant="body1">{content?.transition.p2}</Typography>
        </Box>
      </Box>
    </div>
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
  const { flyTo } = useMap() // from our context
  const hasSeen = useRef(false)

  const load = useCallback(() => {
    flyTo({
      longitude: deltaMapViewState.longitude,
      latitude: deltaMapViewState.latitude,
      zoom: deltaMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
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
          <Typography variant="body1">{content?.p2}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content?.p3}</Typography>
          <Typography variant="body1">{content?.p4}</Typography>
          <Typography variant="body1">{content?.p5}</Typography>
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
