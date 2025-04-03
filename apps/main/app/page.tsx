"use client"

import React from "react"
import dynamic from "next/dynamic"
import { Box } from "@repo/ui/mui"
import { Header } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { HeroPanel, TwoColumnPanel } from "@repo/ui"

// Dynamic import components that use client-side features
const MapContainer = dynamic(() => import("./components/MapContainer"), {
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
      {/* Background Map Layer - fixed position with full pointer events */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "all",
          zIndex: 0,
        }}
      >
        <MapContainer />
      </Box>

      {/* Main Content - positioned with pointer-events none */}
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* Each interactive UI element gets pointer-events auto */}
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
    </>
  )
}
