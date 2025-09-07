"use client"

import { useRef } from "react"
import { HeaderStory } from "@repo/motion/components"
import { Box, CircularProgress } from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import Snowmelt from "./components/02Snowmelt"
import SectionDelta from "./components/04Delta"
import SectionTransition from "./components/05AdaptTransition"
import SectionSupply from "./components/03Groundwater"
import SectionResolution from "./components/06Resolution"
import { AnimatePresence, motion } from "@repo/motion"
import useStoryStore from "./store"

export default function StoryContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMapReady = useStoryStore((state) => state.isMapReady)

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
        }}
      >
        <Opener />
        <Snowmelt />
        <SectionSupply />
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
