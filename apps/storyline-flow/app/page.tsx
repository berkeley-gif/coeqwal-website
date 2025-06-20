"use client"

import { useEffect, useRef, useState } from "react"
import MapContainer from "./components/MapContainer"
import { Box, CircularProgress, Typography } from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import SectionWaterSource from "./components/02WaterSource"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "@repo/motion"
import { DIVISION } from "./components/helpers/sectionDivision"
import useStoryStore from "./store"
import { WaterDropIcon } from "./components/helpers/WaterIcon"
import { HeaderStory } from "@repo/motion/components"
import SourceAnnouncer from "./components/helpers/SourceAnnouncer"
import {
  OffWhiteColor,
  RiverWaterColor,
} from "./components/helpers/colorPalette"
import SectionDelta from "./components/03NaturalFlow"
import SectionHuman from "./components/04Human"

const MotionBox = motion.create(Box)

//TODO: potentially replace all the visibiltiy hook with scroll opacity hook
//TODO: instead of width 100%, it might need to be max-content
//IMPORTANT!: "overflowX: hidden" breaks the sticky behavior of delta section
export default function StoryContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const fetchStoryline = useStoryStore((state) => state.fetchStoryline)
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const setMapReady = useStoryStore((state) => state.setMapReady)

  useEffect(() => {
    fetchStoryline()
  }, [fetchStoryline])

  return (
    <Box sx={{ pointerEvents: "none" }}>
      <AnimatePresence>{!isMapReady && <Loader />}</AnimatePresence>
      <HeaderStory />
      <SectionIndicator />
      <Box
        sx={{
          // This chunk has to be here, so that the scroll bar works as expected ?!?!?!
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: (theme) => theme.zIndex.map,
        }}
      >
        <MapContainer
          onLoad={() => {
            setMapReady(true)
            console.log("🗺️ Map loaded")
          }}
        />
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
          "& > *": {
            margin: 0,
          },
        }}
      >
        <Opener />
        <SectionWaterSource />
        <SectionDelta />
        <SectionHuman />
      </Box>
      <SourceAnnouncer />
    </Box>
  )
}

function SectionIndicator() {
  const activeSection = useStoryStore((state) => state.activeSection)
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)
  const [isHidden, setIsHidden] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const difference = latest - lastYRef.current
    if (Math.abs(difference) > 10) {
      setIsHidden(difference > 0)
    }
    lastYRef.current = latest
  })

  return (
    <MotionBox
      animate={isHidden ? "hidden" : "visible"}
      variants={{
        hidden: {
          top: "10px",
        },
        visible: {
          top: "74.5px",
        },
      }}
      transition={{ duration: 0.3 }}
      id="section-container"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      {DIVISION.map((division, index) => {
        const isActive = division.sections.includes(activeSection)
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0.4 }}
            animate={{
              opacity: isActive ? 1 : 0.4,
            }}
            transition={{ duration: 0.3 }}
          >
            <Box className="section-component" sx={{ gap: 1 }}>
              <Typography variant="body2">{division.name}</Typography>
              <Box className="section-circle">
                <WaterDropIcon
                  color={isActive ? RiverWaterColor : OffWhiteColor}
                />
              </Box>
            </Box>
          </motion.div>
        )
      })}
    </MotionBox>
  )
}

function Loader() {
  return (
    <motion.div id="loader" exit={{ opacity: 0 }} className="filled-container">
      <CircularProgress color="inherit" />
    </motion.div>
  )
}
