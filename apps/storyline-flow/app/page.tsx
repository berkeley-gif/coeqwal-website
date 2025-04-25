"use client"

import { useEffect, useRef, useState } from "react"
import MapContainer from "./components/MapContainer"
import { Box, CircularProgress } from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import SectionWaterSource from "./components/02WaterSource"
import SectionWaterFlow from "./components/03NaturalFlow"
import SectionHuman from "./components/04Human"
import SectionTransformation from "./components/05Transformation"
import SectionImpact from "./components/06Impact"
import Conclusion from "./components/07Conclusion"
import { AnimatePresence, motion } from "@repo/motion"
import useStory from "./story/useStory"

//TODO: potentially replace all the visibiltiy hook with scroll opacity hook
//TODO: instead of width 100%, it might need to be max-content
export default function StoryContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(true)

  const { activeSection } = useStory()

  useEffect(() => {
    console.log("📝 section is now active:", activeSection)
  }, [activeSection])

  return (
    <Box id="meta-container">
      <AnimatePresence>{!isMapLoaded && <Loader />}</AnimatePresence>
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
        style={{ height: "100%", minWidth: "max-content", maxWidth: "100%" }}
        aria-label="Story about water transformation in California"
      >
        <Opener />
        <SectionWaterSource />
        <SectionWaterFlow />
        <SectionHuman />
        <SectionTransformation />
        <SectionImpact />
        <Conclusion />
      </div>
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
