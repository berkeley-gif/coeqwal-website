"use client"

import { useMemo } from "react"
import { Box, CircularProgress } from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import { Temperature, TemperatureBuilder } from "./components/02Temperature"
import { AnimatePresence, motion } from "@repo/motion"
import {
  BaseHeader,
  getWaterThemeOptions,
  goToMainAbout,
  goToMainData,
  goToMainHome,
  goToMainLearn,
  goToMainExplore,
} from "@repo/ui"
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
import {
  Conclusion,
  Hydroclimate,
  HydroclimateTransition,
  Themes,
} from "./components/07Resolution"

export default function StoryContainer() {
  const isMapReady = true //useStoryStore((state) => state.isMapReady)
  const waterThemesOptions = useMemo(() => getWaterThemeOptions(), [])

  return (
    <>
      <AnimatePresence>{!isMapReady && <Loader />}</AnimatePresence>
      <BaseHeader
        backgroundColor="overlay.waterDark"
        onLogoClick={goToMainHome}
        onAboutClick={goToMainAbout}
        onGetDataClick={goToMainData}
        onGetStartedClick={goToMainLearn}
        onToolsClick={goToMainExplore}
        waterThemesOptions={waterThemesOptions}
      />
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
      <Scrollama<SectionId>
        onStepEnter={onStepEnter}
        offset={SCROLLAMA_CONFIG.offset}
        debug={SCROLLAMA_CONFIG.debug}
      >
        {/* Opener is intentionally non-sticky. */}
        <Step data="opener">
          <Box height="100vh" width="100%" className="story-step-container">
            <Opener />
          </Box>
        </Step>

        {/* These components manage sticky scroll progress internally. */}
        <Step data="temperatureBuilder">
          <Box width="100%">
            <TemperatureBuilder />
          </Box>
        </Step>

        <Step data="temperature">
          <Box width="100%">
            <Temperature />
          </Box>
        </Step>

        <Step data="sierranevada">
          <Box width="100%">
            <SierraNevada />
          </Box>
        </Step>

        <Step data="snowmelt">
          <Box width="100%">
            <Snowmelt />
          </Box>
        </Step>

        <Step data="groundwater">
          <Box width="100%">
            <Groundwater />
          </Box>
        </Step>

        <Step data="groundwaterTransition">
          <Box
            aria-hidden
            sx={{
              width: "100%",
              height: "30vh",
              backgroundImage: [
                "linear-gradient(180deg, #172a48 0%, #172a4850 35%, rgba(130, 157, 171, 0) 90%)",
                "linear-gradient(90deg, #5c737a 0%, #68828c 16%, #7892A1 35%, #829DAB 50%, #81A4B1 75%, #82A2B0 88%, #7c9ca9 100%)",
              ].join(", "),
            }}
          />
        </Step>

        <Step data="deltaFarms">
          <Box width="100%">
            <DeltaFarms />
          </Box>
        </Step>

        <Step data="deltaAqueduct">
          <Box width="100%">
            <DeltaAqueduct />
          </Box>
        </Step>

        <Step data="balance">
          <Box width="100%">
            <Balance />
          </Box>
        </Step>

        <Step data="bullet">
          <Box width="100%">
            <Bullet />
          </Box>
        </Step>

        <Step data="hydroclimate">
          <Box width="100%">
            <Hydroclimate />
          </Box>
        </Step>

        <Step data="hydroclimateTransition">
          <Box width="100%">
            <HydroclimateTransition />
          </Box>
        </Step>

        <Step data="themes">
          <Box width="100%">
            <Themes />
          </Box>
        </Step>

        <Step data="conclusion">
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
