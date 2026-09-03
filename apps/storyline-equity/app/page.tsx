"use client"

import { Box, useMediaQuery, useTheme } from "@repo/ui/mui"
import "./main.css"
import { Scrollama, Step } from "react-scrollama"

import Opener, { OpenerVisual } from "./components/01Opener"
import DynamicMap from "./components/map/DynamicMap"
import Background from "./components/02Background"
import HistoricalContext from "./components/03HistoricalContext"
import GoldRush from "./components/04GoldRush"
import Infrastructure from "./components/05Infrastructure"
import ClimateResilience from "./components/06ClimateResilience"
import Transparency from "./components/07Transparency"
import Resolution from "./components/08Resolution"
import Conclusion from "./components/10Conclusion"
import {
  BaseHeader,
  getWaterThemeOptions,
  getMainHomeUrl,
  goToMainAbout,
  goToMainData,
  goToMainHome,
  goToMainLearn,
  goToMainExplore,
  MobileNotSupported,
} from "@repo/ui"
import {
  SCROLLAMA_CONFIG,
  useScrollamaSection,
} from "./hooks/useScrollamaSection"
import { useMemo } from "react"
import { useActiveSectionStore, type SectionId } from "./store"

export default function StoryContainer() {
  const waterThemesOptions = useMemo(() => getWaterThemeOptions(), [])
  const activeSection = useActiveSectionStore()
  const theme = useTheme()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down("lg"))
  const showDynamicMap =
    activeSection === "Background" ||
    activeSection === "HistoricalContext" ||
    activeSection === "GoldRush" ||
    activeSection === "Infrastructure" ||
    activeSection === "ClimateResilience" ||
    activeSection === "Transparency" ||
    activeSection === "Conclusion"

  if (isSmallDevice) {
    return (
      <MobileNotSupported
        message="This section of COEQWAL is best experienced on a tablet, desktop, or laptop. Mobile support for our water stories is coming soon."
        buttonHref={getMainHomeUrl()}
      />
    )
  }

  return (
    <>
      <BaseHeader
        backgroundColor="overlay.waterDark"
        onLogoClick={goToMainHome}
        onAboutClick={goToMainAbout}
        onGetDataClick={goToMainData}
        onGetStartedClick={goToMainLearn}
        onToolsClick={goToMainExplore}
        waterThemesOptions={waterThemesOptions}
      />
      <OpenerVisual
        isVisible={activeSection === "Opener" || activeSection === "Background"}
        fadeOut={activeSection === "Background"}
      />
      <DynamicMap isVisible={showDynamicMap} />
      <ContentContainer />
    </>
  )
}

function ContentContainer() {
  const { onStepEnter, onStepProgress } = useScrollamaSection()

  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        zIndex: 2,
        pointerEvents: "none",
        color: "common.white",
        paddingLeft: "5rem",
        paddingRight: "5rem",
      }}
    >
      <Scrollama
        onStepEnter={onStepEnter}
        onStepProgress={onStepProgress}
        offset={SCROLLAMA_CONFIG.offset}
        debug={SCROLLAMA_CONFIG.debug}
      >
        <Step data={"Opener" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <Opener />
          </Box>
        </Step>

        <Step data={"Background" as SectionId} progress>
          <Box width="100%" className="story-step-container">
            <Background />
          </Box>
        </Step>

        <Step data={"HistoricalContext" as SectionId} progress>
          <Box width="100%" className="story-step-container">
            <HistoricalContext />
          </Box>
        </Step>

        <Step data={"GoldRush" as SectionId} progress>
          <Box width="100%" className="story-step-container">
            <GoldRush />
          </Box>
        </Step>

        <Step data={"Infrastructure" as SectionId} progress>
          <Box width="100%" className="story-step-container">
            <Infrastructure />
          </Box>
        </Step>

        <Step data={"ClimateResilience" as SectionId} progress>
          <Box width="100%" className="story-step-container">
            <ClimateResilience />
          </Box>
        </Step>

        <Step data={"Transparency" as SectionId} progress>
          <Box width="100%" className="story-step-container">
            <Transparency />
          </Box>
        </Step>

        <Step data={"Resolution" as SectionId} progress>
          <Box width="100%" className="story-step-container">
            <Resolution />
          </Box>
        </Step>

        <Step data={"Conclusion" as SectionId} progress>
          <Box width="100%" className="story-step-container">
            <Conclusion />
          </Box>
        </Step>
      </Scrollama>

      {/* minimal outro intentionally left blank */}
    </Box>
  )
}
