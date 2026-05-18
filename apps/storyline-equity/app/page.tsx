"use client"

import { useState } from "react"
import { Box } from "@repo/ui/mui"
import "./main.css"
import { Scrollama, Step } from "react-scrollama"
import type { StepEvent } from "react-scrollama"

import Opener from "./components/01Opener"
import { BurdenSection, BalanceSection } from "./components/02Equity"
import { BaseHeader } from "@repo/ui"

type SectionId = "opener" | "yo" | "balance"

export default function StoryContainer() {
  const [activeSection, setActiveSection] = useState<SectionId>("opener")

  const onStepEnter = ({ data }: StepEvent<SectionId>) => {
    setActiveSection(data)
  }

  return (
    <>
      <BaseHeader backgroundColor="overlay.waterDark" />
      <ContentContainer
        onStepEnter={onStepEnter}
        activeSection={activeSection}
      />
    </>
  )
}

function ContentContainer({
  onStepEnter,
  activeSection,
}: {
  onStepEnter: (response: StepEvent<SectionId>) => void
  activeSection: SectionId
}) {
  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        pointerEvents: "none",
        color: "common.white",
      }}
    >
      <Box className="section-badge">{activeSection}</Box>

      <Scrollama onStepEnter={onStepEnter} offset={0.55} debug={false}>
        <Step data={"opener" as SectionId}>
          <Box height="100vh" width="100%" className="story-step-container">
            <Opener />
          </Box>
        </Step>

        <Step data={"yo" as SectionId} progress>
          <Box height="240vh" width="100%" className="story-step-container">
            <BurdenSection />
          </Box>
        </Step>

        <Step data={"balance" as SectionId} progress>
          <Box height="220vh" width="100%" className="story-step-container">
            <BalanceSection />
          </Box>
        </Step>
      </Scrollama>

      {/* minimal outro intentionally left blank */}
    </Box>
  )
}
