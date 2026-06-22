"use client"

import { Box } from "@repo/ui/mui"
import { AnimatePresence, motion } from "@repo/motion"
import "./main.css"
import { Scrollama, Step } from "react-scrollama"

import Opener from "./components/01Opener"
import DynamicMap from "./components/map/DynamicMap"
import Container from "./components/container/Container"
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
import { SCROLLAMA_CONFIG, useScrollamaSection } from "./hooks/useScrollamaSection"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getStorylineWaterThemesOptions,
  goToMainAbout,
  goToMainData,
  goToMainHome,
} from "./components/helpers/header"
import { useActiveSectionStore, type SectionId } from "./store"

const RIVER_CONTAINER_ID = "storyline-equity-river-container"
const CLIMATE_RESILIENCE_SPOTLIGHT_SIZE = "clamp(15rem, 30vw, 20rem)"
const MotionBox = motion.create(Box)

export default function StoryContainer() {
  const waterThemesOptions = useMemo(() => getStorylineWaterThemesOptions(), [])
  const activeSection = useActiveSectionStore()
  const showDynamicMap =
    activeSection === "Opener" ||
    activeSection === "Background" ||
    activeSection === "HistoricalContext" ||
    activeSection === "GoldRush" ||
    activeSection === "Infrastructure"
  const showRiverContainer =
    activeSection === "ClimateResilience" ||
    activeSection === "Transparency" ||
    activeSection === "Resolution"
  const showRiverSpotlight = activeSection === "ClimateResilience"

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
      <Container
        elementId={RIVER_CONTAINER_ID}
        isVisible={showRiverContainer}
      />
      <ClimateResilienceSpotlight
        containerId={RIVER_CONTAINER_ID}
        isVisible={showRiverSpotlight}
        size={CLIMATE_RESILIENCE_SPOTLIGHT_SIZE}
      />
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
          <Box height="260vh" width="100%" className="story-step-container">
            <Background />
          </Box>
        </Step>

        <Step data={"HistoricalContext" as SectionId} progress>
          <Box height="280vh" width="100%" className="story-step-container">
            <HistoricalContext />
          </Box>
        </Step>

        <Step data={"GoldRush" as SectionId} progress>
          <Box height="300vh" width="100%" className="story-step-container">
            <GoldRush />
          </Box>
        </Step>

        <Step data={"Infrastructure" as SectionId} progress>
          <Box height="280vh" width="100%" className="story-step-container">
            <Infrastructure />
          </Box>
        </Step>

        <Step data={"ClimateResilience" as SectionId} progress>
          <Box height="280vh" width="100%" className="story-step-container">
            <ClimateResilience />
          </Box>
        </Step>

        <Step data={"Transparency" as SectionId} progress>
          <Box height="320vh" width="100%" className="story-step-container">
            <Transparency />
          </Box>
        </Step>

        <Step data={"Resolution" as SectionId} progress>
          <Box height="260vh" width="100%" className="story-step-container">
            <Resolution />
          </Box>
        </Step>

        <Step data={"Tiers" as SectionId} progress>
          <Box height="340vh" width="100%" className="story-step-container">
            <Tiers />
          </Box>
        </Step>

        <Step data={"Conclusion" as SectionId} progress>
          <Box height="240vh" width="100%" className="story-step-container">
            <Conclusion />
          </Box>
        </Step>
      </Scrollama>

      {/* minimal outro intentionally left blank */}
    </Box>
  )
}

function ClimateResilienceSpotlight({
  containerId,
  isVisible,
  size,
}: {
  containerId: string
  isVisible: boolean
  size: number | string
}) {
  const [bounds, setBounds] = useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)

  const measureContainer = useCallback(() => {
    const container = document.getElementById(containerId)

    if (!container) {
      setBounds(null)
      return
    }

    const rect = container.getBoundingClientRect()
    setBounds({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    })
  }, [containerId])

  useEffect(() => {
    if (!isVisible) return

    measureContainer()

    const animationFrame = window.requestAnimationFrame(measureContainer)

    window.addEventListener("resize", measureContainer)
    window.addEventListener("scroll", measureContainer, { passive: true })

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", measureContainer)
      window.removeEventListener("scroll", measureContainer)
    }
  }, [isVisible, measureContainer])

  const centerX = bounds ? bounds.left + bounds.width / 2 : 0
  const centerY = bounds ? bounds.top + bounds.height / 2 : 0

  return (
    <AnimatePresence initial={false}>
      {isVisible && bounds ? (
        <MotionBox
          key="climate-resilience-spotlight"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.86, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          exit={{ opacity: 0, scale: 1.08, x: "-50%", y: "-50%" }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          sx={{
            position: "fixed",
            left: centerX,
            top: centerY,
            width: size,
            height: size,
            zIndex: 1,
            borderRadius: "50%",
            pointerEvents: "none",
            background:
              "radial-gradient(circle, rgba(23, 42, 72, 0) 0%, rgba(23, 42, 72, 0) 50%, rgba(116, 190, 203, 0.12) 58%, rgba(255, 209, 132, 0.5) 64%, rgba(255, 179, 71, 0.2) 70%, rgba(23, 42, 72, 0) 78%)",
            boxShadow:
              "0 0 72px rgba(255, 179, 71, 0.22), inset 0 0 44px rgba(126, 198, 208, 0.08)",
            filter: "blur(0.5px)",
            mixBlendMode: "screen",
          }}
        />
      ) : null}
    </AnimatePresence>
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
