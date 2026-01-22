"use client"

import { useRef } from "react"
import { HeaderStory } from "@repo/motion/components"
import { Box, CircularProgress } from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import SectionStarter from "./components/02Temperature"
import SectionSnow from "./components/03Snowmelt"
import SectionDelta from "./components/05Delta"
import SectionTransition from "./components/06AdaptTransition"
import SectionGroundwater from "./components/04Groundwater"
import SectionResolution from "./components/07Resolution"
import { AnimatePresence, motion } from "@repo/motion"

export default function StoryContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMapReady = true //useStoryStore((state) => state.isMapReady)

  return (
    <>
      <AnimatePresence>{!isMapReady && <Loader />}</AnimatePresence>
      <HeaderStory />
      <Box
        component="main"
        ref={containerRef}
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          margin: 0,
          padding: 0,
          width: "100%",
          "& > *": {
            margin: 0,
          },
          pointerEvents: "none",
          color: "common.white",
        }}
      >
        <Opener />
        <SectionStarter />
        <SectionSnow />
        <SectionGroundwater />
        <SectionDelta />
        <SectionTransition />
        <SectionResolution />
      </Box>
    </>
  )
}

function Loader() {
  return (
    <motion.div id="loader" exit={{ opacity: 0 }} className="filled-container">
      <CircularProgress color="inherit" />
    </motion.div>
  )
}
