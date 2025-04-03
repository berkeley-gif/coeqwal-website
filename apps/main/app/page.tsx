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
    <Box sx={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      {/* Background Map Layer - placed first in DOM */}
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <MapWithControls />
      </Box>

      {/* Main Content Layer - UI components with pointer events */}
      <Box 
        sx={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 1,
          pointerEvents: "none", // Make wrapper transparent to pointer events
          overflow: "auto",      // Allow scrolling
        }}
      >
        {/* Each UI component gets pointer-events: auto */}
        <Box sx={{ pointerEvents: "auto" }}>
          <Header />
        </Box>
        
        <Box component="main">
          <Box sx={{ pointerEvents: "auto" }}>
            <HeroPanel
              title={t("heroPanel.title")}
              content={t("heroPanel.content")}
            />
          </Box>
          
          <Box sx={{ pointerEvents: "auto" }}>
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
          </Box>

          {/* Combined panel with question builder and scenario results */}
          <Box sx={{ pointerEvents: "auto" }}>
            <CombinedPanel />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
