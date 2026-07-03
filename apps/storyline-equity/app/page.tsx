"use client"

import { Box } from "@repo/ui/mui"
import "./main.css"
import { Scrollama, Step } from "react-scrollama"

import Opener from "./components/01Opener"
import DynamicMap from "./components/map/DynamicMap"
import Background from "./components/02Background"
import HistoricalContext from "./components/03HistoricalContext"
import GoldRush from "./components/04GoldRush"
import Infrastructure from "./components/05Infrastructure"
import ClimateResilience from "./components/06ClimateResilience"
import Transparency from "./components/07Transparency"
import Resolution from "./components/08Resolution"
import Tiers from "./components/09Tiers"
import Conclusion from "./components/10Conclusion"
import { BaseHeader } from "@repo/ui"
import {
  SCROLLAMA_CONFIG,
  useScrollamaSection,
} from "./hooks/useScrollamaSection"
import { useMemo } from "react"
import {
  getStorylineWaterThemesOptions,
  goToMainAbout,
  goToMainData,
  goToMainHome,
} from "./components/helpers/header"
import { useActiveSectionStore, type SectionId } from "./store"

export default function StoryContainer() {
  const waterThemesOptions = useMemo(() => getStorylineWaterThemesOptions(), [])
  const activeSection = useActiveSectionStore()
  const showDynamicMap =
    activeSection === "Opener" ||
    activeSection === "Background" ||
    activeSection === "HistoricalContext" ||
    activeSection === "GoldRush" ||
    activeSection === "Infrastructure" ||
    activeSection === "ClimateResilience" ||
    activeSection === "Transparency"

  return (
    <>
      <BaseHeader
        backgroundColor="overlay.waterDark"
        onLogoClick={goToMainHome}
        onAboutClick={goToMainAbout}
        onGetDataClick={goToMainData}
        waterThemesOptions={waterThemesOptions}
      />
      <DynamicMap isVisible={showDynamicMap} />
      <ContentContainer />
      <SectionIndicator />
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

        <Step data={"Tiers" as SectionId} progress>
          <Box width="100%" className="story-step-container">
            <Tiers />
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

function SectionIndicator() {
  const activeSection = useActiveSectionStore()

  return (
    <Box
      aria-live="polite"
      sx={{
        position: "fixed",
        right: "1.5rem",
        bottom: "1.5rem",
        zIndex: 3,
        pointerEvents: "none",
        paddingX: 2,
        paddingY: 1,
        borderRadius: 999,
        backgroundColor: "rgba(8, 16, 24, 0.72)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        color: "common.white",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.24)",
        maxWidth: "calc(100vw - 3rem)",
      }}
    >
      <Box
        component="span"
        sx={{
          display: "block",
          fontSize: "0.75rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: 0.75,
        }}
      >
        Section
      </Box>
      <Box
        component="span"
        sx={{
          display: "block",
          fontSize: "1rem",
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {activeSection}
      </Box>
    </Box>
  )
}
