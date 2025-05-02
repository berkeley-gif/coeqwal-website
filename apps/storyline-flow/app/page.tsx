"use client"

import { useEffect, useRef, useState } from "react"
import MapContainer from "./components/MapContainer"
import { Box, CircularProgress, Typography } from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import SectionWaterSource from "./components/02WaterSource"
import SectionWaterFlow from "./components/03NaturalFlow"
import SectionHuman from "./components/04Human"
import SectionTransformation from "./components/05Transformation"
import SectionBenefits from "./components/06Benefits"
import SectionImpact from "./components/07Impact"
import Conclusion from "./components/08Conclusion"
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

const MotionBox = motion.create(Box)

//TODO: potentially replace all the visibiltiy hook with scroll opacity hook
//TODO: instead of width 100%, it might need to be max-content
//NOTE: check if we really need to preload
export default function StoryContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(true)
  const fetchStoryline = useStoryStore((state) => state.fetchStoryline)
  //const loadedSections = useStoryStore((state) => state.loadedSections);
  //const markSectionAsLoaded = useStoryStore((state) => state.markSectionAsLoaded);

  useEffect(() => {
    fetchStoryline()
  }, [fetchStoryline])

  return (
    <Box id="meta-container">
      <AnimatePresence>{!isMapLoaded && <Loader />}</AnimatePresence>
      <HeaderStory />
      <SectionIndicator />
      <div id="map-container">
        <MapContainer
          onLoad={() => {
            setIsMapLoaded(true)
          }}
        />
      </div>
      <div
        ref={containerRef}
        id="story-container"
        tabIndex={-1} // Ensure focusable for screen readers
        style={{ height: "100%", width: "100%" }}
        aria-label="Story about water transformation in California"
      >
        <Opener />
        <SectionWaterSource />
        <SectionWaterFlow />
        <SectionHuman />
        <SectionTransformation />
        <SectionBenefits />
        <SectionImpact />
        <Conclusion />
      </div>
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
                <WaterDropIcon color={isActive ? "#3d8ec9" : "#f2f0ef"} />
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
    <motion.div id="loader" exit={{ opacity: 0 }}>
      <CircularProgress color="inherit" />
    </motion.div>
  )
}
