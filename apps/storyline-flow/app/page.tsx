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
import { AnimatePresence, motion } from "@repo/motion"
import { DIVISION } from "./components/helpers/sectionDivision"
import useStoryStore from "./store"
import { WaterDropIcon } from "./components/helpers/WaterIcon"

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
    </Box>
  )
}

function SectionIndicator() {
  const activeSection = useStoryStore((state) => state.activeSection)

  return (
    <Box
      id="section-container"
      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
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
              <Typography variant="caption">{division.name}</Typography>
              <Box className="section-circle">
                <WaterDropIcon />
              </Box>
            </Box>
          </motion.div>
        )
      })}
    </Box>
  )
}

function Loader() {
  return (
    <motion.div id="loader" exit={{ opacity: 0 }}>
      <CircularProgress color="inherit" />
    </motion.div>
  )
}
