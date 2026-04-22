"use client"

import { Box, CircularProgress } from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import { Temperature, TemperatureBuilder } from "./components/02Temperature"
import { AnimatePresence, motion } from "@repo/motion"
import { BaseHeader } from "@repo/ui"
import {
  SCROLLAMA_CONFIG,
  useScrollamaSection,
} from "./hooks/useScrollamaSection"
import { Scrollama, Step } from "react-scrollama"
import { SectionId } from "./store"
import SierraNevada, { Snowmelt } from "./components/03Snowmelt"
import Groundwater from "./components/04Groundwater"
import DeltaFarms, { DeltaAqueduct } from "./components/05Delta"
import Balance, { Bullet } from "./components/06AdaptTransition"
import { Conclusion, Hydroclimate, Themes } from "./components/07Resolution"

export default function StoryContainer() {
  const isMapReady = true //useStoryStore((state) => state.isMapReady)

  return (
    <>
      <AnimatePresence>{!isMapReady && <Loader />}</AnimatePresence>
      <BaseHeader backgroundColor="overlay.waterDark" />
      <ContentContainer />
    </>
  )
}

function ContentContainer() {
  const { onStepEnter } = useScrollamaSection()

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
        offset={SCROLLAMA_CONFIG.offset}
        debug={SCROLLAMA_CONFIG.debug}
      >
        {/* Opener is intentionally non-sticky. */}
        <Step data={"opener" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <Opener />
          </Box>
        </Step>

        {/* These components already manage sticky behavior internally via StickyContainer. */}
        <Step data={"temperatureBuilder" as SectionId}>
          <Box width="100%">
            <TemperatureBuilder />
          </Box>
        </Step>

        <Step data={"temperature" as SectionId}>
          <Box width="100%">
            <Temperature />
          </Box>
        </Step>

        <Step data={"sierranevada" as SectionId}>
          <Box width="100%">
            <SierraNevada />
          </Box>
        </Step>

        <Step data={"snowmelt" as SectionId}>
          <Box width="100%">
            <Snowmelt />
          </Box>
        </Step>

        <Step data={"groundwater" as SectionId}>
          <Box width="100%">
            <Groundwater />
          </Box>
        </Step>

        <Step data={"deltaFarms" as SectionId}>
          <Box width="100%">
            <DeltaFarms />
          </Box>
        </Step>

        <Step data={"deltaAqueduct" as SectionId}>
          <Box width="100%">
            <DeltaAqueduct />
          </Box>
        </Step>

        <Step data={"balance" as SectionId}>
          <Box width="100%">
            <Balance />
          </Box>
        </Step>

        <Step data={"bullet" as SectionId}>
          <Box width="100%">
            <Bullet />
          </Box>
        </Step>

        <Step data={"bullet" as SectionId}>
          <Box width="100%">
            <Hydroclimate />
          </Box>
        </Step>

        <Step data={"bullet" as SectionId}>
          <Box width="100%">
            <Themes />
          </Box>
        </Step>

        <Step data={"bullet" as SectionId}>
          <Box width="100%">
            <Conclusion />
          </Box>
        </Step>
      </Scrollama>
    </Box>
  )
}

function Loader() {
  return (
    <motion.div id="loader" exit={{ opacity: 0 }} className="filled-container">
      <CircularProgress color="inherit" />
    </motion.div>
  )
}
