"use client"

import React from "react"
import dynamic from "next/dynamic"
import { Box } from "@repo/ui/mui"
import { Header } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { HeroPanel, TwoColumnPanel } from "@repo/ui"
import { QuestionBuilderProvider } from "./features/questionBuilder/context/QuestionBuilderContext"

// Dynamic import for QuestionSummary to use in the sticky header
const QuestionSummary = dynamic(
  () => import("./features/questionBuilder/components/QuestionSummary"),
  {
    ssr: true,
  },
)

// Dynamic import components that use client-side features
const MapWithControls = dynamic(() => import("./components/MapWithControls"), {
  ssr: false, // Disable server-side rendering
})

// Dynamic import the QuestionBuilder to avoid hydration mismatches
const QuestionBuilderPanel = dynamic(
  () => import("./features/questionBuilder/QuestionBuilderPanel"),
  {
    ssr: true,
  },
)

// Dynamic import the ScenarioResults panel
const ScenarioResultsPanel = dynamic(
  () => import("./features/scenarioResults/ScenarioResultsPanel"),
  {
    ssr: true,
  },
)

export default function Home() {
  const { t } = useTranslation()

  return (
    <>
      {/* Background Map Layer */}
      <MapWithControls />

      {/* Main Content */}
      <Box sx={{ zIndex: 1, position: "relative" }}>
        <Header />
        <Box component="main">
          <HeroPanel
            title={t("heroPanel.title")}
            content={t("heroPanel.content")}
          />
          <TwoColumnPanel
            leftTitle={t("CaliforniaWaterPanel.title")}
            leftContent={<div>Content</div>}
            background="transparent"
            sx={{
              color: (theme) => theme.palette.text.secondary,
              "& .MuiTypography-root": {
                color: "inherit",
              },
            }}
          />

          {/* Container for panels with sticky question summary */}
          <Box
            sx={{
              position: "relative",
              scrollSnapType: "y mandatory",
            }}
          >
            {/* Single sticky QuestionSummary that persists across both panels */}
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                backgroundColor: "white",
                borderBottom: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <QuestionBuilderProvider>
                <QuestionSummary />
              </QuestionBuilderProvider>
            </Box>

            {/* Pass showSummary=false to both panels to avoid duplicate summaries */}
            <QuestionBuilderPanel showSummary={false} />
            <ScenarioResultsPanel />
          </Box>
        </Box>
      </Box>
    </>
  )
}
