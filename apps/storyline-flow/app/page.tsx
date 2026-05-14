"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Box, CircularProgress, Typography } from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import {
  Precipitation,
  Snowpack,
  Variability,
} from "./components/02WaterSource"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "@repo/motion"
import {
  appActions,
  useActiveSectionStore,
  useMapReady,
  useTooltip,
} from "./store"
import { WaterDropIcon } from "./components/helpers/WaterIcon"
import { BaseHeader } from "@repo/ui"
//import { HeaderStory } from "@repo/motion/components"
import {
  OffWhiteColor,
  FreshWaterColor,
} from "./components/helpers/colorPalette"
import {
  CentralValley,
  DeltaWetland,
  HistoricalDelta,
  TransitionFromDeltaToGoldRush,
  MajorRiver,
} from "./components/03NaturalFlow"
import { GoldRush, Drinking } from "./components/04Human"
import { FloatImageTooltip } from "./components/helpers/Tooltip"
import { DynamicMap } from "./components/map/DynamicMap"
import { Scrollama, Step } from "react-scrollama"
import {
  SECTION_DIVISION,
  SectionId,
} from "./components/map/config/sectionConfig"
import Transformation from "./components/05Transformation"
import CityPictogram, { Agriculture, Economy } from "./components/06Benefits"
import {
  Climate,
  Delta,
  DrinkingWater,
  Salmon,
  TransitionToImpact,
} from "./components/07Impact"
import { Builder, Resolution } from "./components/08Conclusion"
import {
  SCROLLAMA_CONFIG,
  useScrollamaSection,
} from "./hooks/useScrollamaSection"
import {
  getStorylineWaterThemesOptions,
  goToMainAbout,
  goToMainData,
  goToMainHome,
} from "./components/helpers/header"

const MotionBox = motion.create(Box)

//NOTE: This page should be consistent with the main app, color-wise and typography-wise

//TODO: potentially replace all the visibiltiy hook with scroll opacity hook
//TODO: instead of width 100%, it might need to be max-content
//IMPORTANT!: "overflowX: hidden" breaks the sticky behavior of delta section

export default function StoryContainer() {
  const isMapReady = useMapReady()
  const tooltipContent = useTooltip()
  const waterThemesOptions = useMemo(() => getStorylineWaterThemesOptions(), [])

  useEffect(() => {
    appActions.fetchStoryline()
  }, [])

  useEffect(() => {
    console.log(tooltipContent)
  }, [tooltipContent])

  const closeTooltip = () => appActions.setTooltipContent(null)

  return (
    <>
      <AnimatePresence>{!isMapReady && <Loader />}</AnimatePresence>
      <BaseHeader
        backgroundColor="overlay.waterDark"
        onLogoClick={goToMainHome}
        onAboutClick={goToMainAbout}
        onGetDataClick={goToMainData}
        waterThemesOptions={waterThemesOptions}
      />
      <SectionIndicator />
      {tooltipContent && (
        <>
          <div onClick={closeTooltip} className="popup-closer"></div>
          <FloatImageTooltip marker={tooltipContent} />
        </>
      )}
      <DynamicMap />
      <ContentContainer />
    </>
  )
}

//TODO: update the sticky container implementation to be scrollama version
function ContentContainer() {
  // react-scrollama callbacks
  const { onStepEnter, onStepProgress } = useScrollamaSection()

  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        pointerEvents: "none",
        color: "common.white",
      }}
    >
      <Scrollama
        onStepEnter={onStepEnter}
        onStepProgress={onStepProgress}
        offset={SCROLLAMA_CONFIG.offset}
        debug={SCROLLAMA_CONFIG.debug}
      >
        <Step data={"opener" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <Opener />
          </Box>
        </Step>

        {/* Section 2 - California's water*/}
        <Step data={"precipitation" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <Precipitation />
          </Box>
        </Step>
        <Step data={"variability" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <Variability />
          </Box>
        </Step>
        <Step data={"snowpack" as SectionId}>
          <Box height="120vh" width="100%" className="story-step-container">
            <Snowpack />
          </Box>
        </Step>

        {/* Section 3 - Natural Flow */}
        <Step data={"major-river" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <MajorRiver />
          </Box>
        </Step>
        <Step data={"central-valley" as SectionId}>
          <Box height="80vh" width="100%" className="story-step-container">
            <CentralValley />
          </Box>
        </Step>
        <Step data={"delta-wetland" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <DeltaWetland />
          </Box>
        </Step>
        {/* (1) this one doesn't need story-step-container */}
        <Step data={"historical-delta" as SectionId}>
          <Box height="150vh" width="100%">
            <HistoricalDelta />
          </Box>
        </Step>
        <Step data={"transition" as SectionId}>
          <Box height="150vh" width="100%">
            <TransitionFromDeltaToGoldRush />
          </Box>
        </Step>

        {/* Section 4 - Human Impact */}
        <Step data={"goldrush" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <GoldRush />
          </Box>
        </Step>
        <Step data={"drinking" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <Drinking />
          </Box>
        </Step>

        {/* Section 5 - Water Transformation */}
        <Step data={"transformation" as SectionId}>
          <Box height="130vh" width="100%" className="story-step-container">
            <Transformation />
          </Box>
        </Step>
        {/* Section 6 - Benefits */}
        <Step data={"city" as SectionId}>
          <Box
            height="150vh"
            width="100%"
            className="story-step-sticky-container"
          >
            <CityPictogram />
          </Box>
        </Step>
        <Step data={"agriculture" as SectionId}>
          <Box
            height="150vh"
            width="100%"
            className="story-step-sticky-container"
          >
            <Agriculture />
          </Box>
        </Step>
        <Step data={"economy" as SectionId}>
          <Box
            height="150vh"
            width="100%"
            className="story-step-sticky-container"
          >
            <Economy />
          </Box>
        </Step>

        {/* Section 7 - Impact */}
        <Step data={"turning" as SectionId}>
          <Box height="50vh" width="100%" className="story-step-container">
            <TransitionToImpact />
          </Box>
        </Step>
        <Step data={"impact-salmon" as SectionId}>
          <Box height="80vh" width="100%" className="story-step-container">
            <Salmon />
          </Box>
        </Step>
        <Step data={"impact-delta" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <Delta />
          </Box>
        </Step>
        <Step data={"impact-water" as SectionId}>
          <Box height="70vh" width="100%" className="story-step-container">
            <DrinkingWater />
          </Box>
        </Step>
        <Step data={"impact-climate" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <Climate />
          </Box>
        </Step>

        {/* Section 8 - Resolution */}
        <Step data={"builder" as SectionId}>
          <Box height="200vh" width="100%">
            <Builder />
          </Box>
        </Step>
        <Step data={"resolution" as SectionId}>
          <Box height="200vh" width="100%">
            <Resolution />
          </Box>
        </Step>
      </Scrollama>
    </Box>
  )
}

function SectionIndicator() {
  const activeSection = useActiveSectionStore()
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

  useEffect(() => {
    console.log("Active section changed:", activeSection)
  }, [activeSection])

  return (
    <MotionBox
      animate={isHidden ? "hidden" : "visible"}
      variants={{
        hidden: {
          top: "45px",
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
        color: "common.white",
        backgroundColor: "overlay.waterDark",
      }}
    >
      {SECTION_DIVISION.map((division, index) => {
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
                <WaterDropIcon
                  color={isActive ? FreshWaterColor : OffWhiteColor}
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
      <CircularProgress sx={{ color: "common.white" }} />
    </motion.div>
  )
}
