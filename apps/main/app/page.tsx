"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { Box, WaterIcon } from "@repo/ui/mui"
import {
  Header,
  MiniDrawer,
  VerticalDivider,
  SettingsIcon,
  EngineeringIcon,
  ReportProblemIcon,
  SwapHorizIcon,
  BarChartIcon,
  SlideshowIcon,
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

  // Navigation items for the sidebar drawer
  const navigationItems = [
    {
      text: "How water moves through California",
      icon: <WaterIcon />,
      onClick: () => console.log("Water moves through California clicked"),
    },
    {
      text: "Managing California's water",
      icon: <SettingsIcon />,
      onClick: () => console.log("Managing California's water clicked"),
    },
    {
      text: "Challenges",
      icon: <ReportProblemIcon />,
      onClick: () => console.log("Challenges clicked"),
    },
    {
      text: "Alternative scenarios",
      icon: <SwapHorizIcon />,
      onClick: () => console.log("Alternative scenarios clicked"),
    },
    {
      text: "Alternative scenario data",
      icon: <BarChartIcon />,
      onClick: () => console.log("Alternative scenario data clicked"),
    },
    {
      text: "Alternative scenario presentation tools",
      icon: <SlideshowIcon />,
      onClick: () =>
        console.log("Alternative scenario presentation tools clicked"),
    },
  ]

  return (
    <>
      {/* ===== Background Map Layer ===== */}
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

      {/* ===== Navigation Sidebar ===== */}
      <Box
        sx={{
          pointerEvents: "none",
          position: "relative",
          zIndex: 10,
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

      {/* ===== Drawer "border" ===== */}
      <VerticalDivider
        left={(theme) =>
          drawerOpen
            ? theme.layout.drawer.width
            : theme.layout.drawer.closedWidth
        }
        animated
      />

      {/* ===== Main Content Area ===== */}
      <Box
        sx={(theme) => ({
          position: "relative",
          zIndex: 20,
          pointerEvents: "none",
          marginLeft: drawerOpen
            ? `${theme.layout.drawer.width}px`
            : `${theme.layout.drawer.closedWidth}px`,
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        })}
      >
        {/* Header - Enable pointer events */}
        <Box sx={{ pointerEvents: "auto" }}>
          <Header />
        </Box>

        {/* Main content sections */}
        <Box
          component="main"
          sx={{
            position: "relative",
          }}
        >
          {/* Hero Panel */}
          <Box sx={{ pointerEvents: "auto" }}>
            <HeroPanel
              title={t("heroPanel.title")}
              content={t("heroPanel.content")}
            />
          </Box>

          {/* Two Column Panel */}
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

          {/* Combined Panel */}
          <Box sx={{ pointerEvents: "auto" }}>
            <CombinedPanel />
          </Box>
        </Box>
      </Box>
    </>
  )
}
