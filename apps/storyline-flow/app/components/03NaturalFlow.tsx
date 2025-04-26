"use client"

import { Box, Typography } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { motion } from "@repo/motion"
import { deltaMapViewState, stateMapViewState } from "./helpers/mapViews"

import Bird from "./vis/Bird"
import Grass from "./vis/Grass"
import useStory from "../story/useStory"
import useActiveSection from "../hooks/useActiveSection"

function SectionDelta() {
  return (
    <>
      <Delta />
      <Transition />
    </>
  )
}

//TODO: instead of scrolling away, make it disappear
//TODO: sometimes see a 1px gap between this and Delta
function Transition() {
  const { storyline } = useStory()
  const content = storyline?.delta
  const sectionRef = useActiveSection("transition", { amount: 0.5 })
  const { mapRef, flyTo } = useMap()

  function moveToState() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    console.log("moving to state")
    flyTo({
      longitude: stateMapViewState.longitude,
      latitude: stateMapViewState.latitude,
      zoom: stateMapViewState.zoom,
      transitionOptions: {
        duration: 1000,
      },
    })
  }

  useIntersectionObserver(
    sectionRef,
    ["transition"],
    ["delta"],
    moveToState,
    () => {},
    { threshold: 0.2 },
  )

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

//TODO: add animation for these graphics
//TODO: show up by sentence
//TODO: map transistions not perfect
//TODO: probably watch the current window size
function Delta() {
  const { storyline } = useStory()
  const content = storyline?.delta
  const sectionRef = useActiveSection("delta", { amount: 0.1 })
  const { mapRef, flyTo, setPaintProperty } = useMap() // from our context

  function moveToDelta() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    setPaintProperty("river-sac-layer", "line-opacity", 0)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
    flyTo({
      longitude: deltaMapViewState.longitude,
      latitude: deltaMapViewState.latitude,
      zoom: deltaMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }

  useIntersectionObserver(
    sectionRef,
    ["delta"],
    ["valley"],
    moveToDelta,
    () => {},
    { threshold: 0.2 },
  )

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
        id="holder"
        className="container-center"
        style={{
          position: "sticky",
          bottom: 0,
          height: "50vh",
          backgroundColor: "#031a35",
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

export default SectionDelta
