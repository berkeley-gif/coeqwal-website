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
import { DIVISION } from "./components/helpers/sectionDivision"

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

function SectionIndicator() {
  const { activeSection } = useStory()

  return (
    <div id="section-container">
      <div id="section-line"></div>
      {DIVISION.map((division, index) => (
        <motion.div
          key={index}
          className="section-component"
          initial={{ opacity: 0.4 }}
          animate={{
            opacity: division.sections.includes(activeSection) ? 1 : 0.4,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="section-text">{division.name}</div>
          <div className="section-indicator"></div>
        </motion.div>
      ))}
    </div>
  )
}

/*
              <svg width="133" height="133" viewBox="0 0 133 133" fill="#212121" xmlns="http://www.w3.org/2000/svg">
                <path fill='#f2f0ef' transform="scale(0.1)"
                  d="M66.9999 11.25C37.2408 36.8438 22.3333 58.95 22.3333 77.625C22.3333 105.638 43.5499 123.75 66.9999 123.75C90.4499 123.75 111.667 105.638 111.667 77.625C111.667 58.95 96.7591 36.8438 66.9999 11.25Z" />
              </svg>
*/

function Loader() {
  return (
    <motion.div id="loader" exit={{ opacity: 0 }}>
      <CircularProgress color="inherit" />
    </motion.div>
  )
}
