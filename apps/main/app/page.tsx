"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { Box } from "@repo/ui/mui"
import {
  Header,
  MiniDrawer,
  VerticalDivider,
  KeyboardArrowDownIcon,
} from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { TwoColumnPanel, VideoPanel } from "@repo/ui"
import { useScrollTracking } from "./hooks/useScrollTracking"
import { sectionIds, getNavigationItems } from "./config/navigation"

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

  const { activeSection, scrollToSection } = useScrollTracking(sectionIds)

  // Custom scroll handler that also closes the drawer
  const handleSectionClick = (sectionId: string) => {
    scrollToSection(sectionId)
    setDrawerOpen(false)
  }

  // Get navigation items with the current active section and translation function
  const navigationItems = getNavigationItems(
    activeSection,
    handleSectionClick,
    t,
  )

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
          zIndex: -1,
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
            duration: drawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
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
          {/* Hero Panel with Video Background */}
          <Box
            sx={{
              pointerEvents: "auto",
              position: "relative",
              zIndex: 5,
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <VideoPanel
              title={t("heroPanel.title")}
              content={t<string[]>("heroPanel.content") || []}
              videoSrc="/video/background.mp4"
              posterSrc="/video/poster.jpg"
              overlayOpacity={0}
              verticalAlignment="bottom"
            />

            {/* Scroll Down Button */}
            <Box
              sx={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
              onClick={() => scrollToSection("california-water-panel")}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                  },
                }}
              >
                <KeyboardArrowDownIcon
                  fontSize="large"
                  sx={{
                    fontSize: 36,
                    color: "white",
                    "&:hover": {
                      color: "white",
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Two Column Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="california-water-panel">
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
