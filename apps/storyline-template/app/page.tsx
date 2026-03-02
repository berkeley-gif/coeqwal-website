"use client"

import { useRef } from "react"
import { HeaderStory } from "@repo/motion/components"
import { Box, CircularProgress } from "@repo/ui/mui"
import { AnimatePresence, motion } from "@repo/motion"
import "./main.css"

import Opener from "./components/sections/01Opener"
import StickyExample from "./components/sections/02StickyExample"
import SideEffectExample from "./components/sections/03SideEffectExample"
import MapContainer from "./components/MapContainer"
import useStoryStore from "./store"

export default function StoryContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMapReady = useStoryStore((state) => state.isMapReady)

  return (
    <>
      <AnimatePresence>{!isMapReady && <Loader />}</AnimatePresence>
      <HeaderStory />

      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: (theme) => theme.zIndex.basement,
        }}
      >
        <MapContainer />
      </Box>

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
          "& > *": { margin: 0 },
          pointerEvents: "none",
        }}
      >
        <Opener />
        <StickyExample />
        <SideEffectExample />
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
