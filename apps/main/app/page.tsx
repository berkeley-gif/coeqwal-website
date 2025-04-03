"use client"

import React from "react"
import dynamic from "next/dynamic"
import { Box } from "@repo/ui/mui"
import { Header } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { HeroPanel, TwoColumnPanel } from "@repo/ui"

// Dynamic import components that use client-side features
const MapWithControls = dynamic(() => import("./components/MapWithControls"), {
  ssr: false, // Disable server-side rendering
})

// Dynamic import the combined panel
const CombinedPanel = dynamic(
  () => import("./features/combinedPanel/CombinedPanel"),
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
      <Box sx={{ 
        zIndex: 1, 
        position: "relative",
        // Apply pointer-events auto only to specific UI elements
        pointerEvents: "none",
        '& > *': { 
          pointerEvents: "auto", 
        },
      }}>
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

          {/* Combined panel with question builder and scenario results */}
          <CombinedPanel />
        </Box>
      </Box>
    </>
  )
}
