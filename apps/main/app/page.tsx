"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { Box } from "@repo/ui/mui"
import {
  Header,
  MiniDrawer,
  HomeIcon,
  LocationOnIcon,
  SearchIcon,
  SettingsIcon,
} from "@repo/ui"
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
  const [drawerOpen, setDrawerOpen] = useState(true)

  // Navigation items for the secondary navigation drawer on the left
  const navigationItems = [
    {
      text: "How water moves through California",
      icon: <HomeIcon />,
      onClick: () => console.log("Water moves through California clicked"),
    },
    {
      text: "Managing California's water",
      icon: <LocationOnIcon />,
      onClick: () => console.log("Managing California's water clicked"),
    },
    {
      text: "Challenges",
      icon: <SearchIcon />,
      onClick: () => console.log("Challenges clicked"),
    },
    {
      text: "Alternative scenarios",
      icon: <SettingsIcon />,
      onClick: () => console.log("Alternative scenarios clicked"),
    },
    {
      text: "Alternative scenario data",
      icon: <SettingsIcon />,
      onClick: () => console.log("Alternative scenario data clicked"),
    },
    {
      text: "Alternative scenario presentation tools",
      icon: <SettingsIcon />,
      onClick: () =>
        console.log("Alternative scenario presentation tools clicked"),
    },
  ]

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

      {/* Navigation Drawer */}
      <Box
        sx={{
          pointerEvents: "none",
          position: "relative",
          zIndex: 20,
        }}
      >
        <Box sx={{ pointerEvents: "auto" }}>
          <MiniDrawer
            items={navigationItems}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            position="left"
          />
        </Box>
      </Box>

      {/* Main Content - positioned with pointer-events none */}
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          pointerEvents: "none",
          marginLeft: drawerOpen ? "240px" : "64px", // TODO:Adjust margin
          transition: "margin 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        }}
      >
        {/* Each interactive UI element gets pointer-events auto */}
        <Box sx={{ pointerEvents: "auto" }}>
          <Header />
        </Box>

        <Box
          component="main"
          sx={{
            position: "relative",
          }}
        >
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
