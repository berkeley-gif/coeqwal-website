"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { Box, Typography } from "@repo/ui/mui"
import {
  Header,
  MiniDrawer,
  VerticalDivider,
  KeyboardArrowDownIcon,
} from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { HeroQuestionsPanel } from "@repo/ui"
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
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { activeSection, scrollToSection } = useScrollTracking(sectionIds)

  // Custom scroll handler that also closes the drawer
  const handleSectionClick = (sectionId: string) => {
    scrollToSection(sectionId)
    setDrawerOpen(false)
  }

  // Direct scroll to combined panel with offset
  const scrollToQuestionBuilder = () => {
    const element = document.getElementById("combined-panel-container")
    if (element) {
      // Calculate the element's position relative to the document
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const offset = rect.top + scrollTop + 120 // Reduced from 200px to 120px

      // Scroll to the calculated position
      window.scrollTo({
        top: offset,
        behavior: "smooth",
      })
    }
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
            position="right"
            title="Learn"
          />
        </Box>
      </Box>

      {/* ===== Drawer "border" ===== */}
      <VerticalDivider
        right={(theme) =>
          drawerOpen
            ? theme.layout.drawer.width
            : theme.layout.drawer.closedWidth
        }
        animated
      />

      {/* ===== Main Content Area ===== */}
      <Box
        className="no-scroll-snap"
        sx={(theme) => ({
          position: "relative",
          zIndex: 20,
          pointerEvents: "none",
          marginRight: drawerOpen
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
          <Header drawerOpen={drawerOpen} drawerPosition="right" />
        </Box>

        {/* Main content sections */}
        <Box
          component="main"
          sx={{
            position: "relative",
          }}
        >
          {/* Hero Questions Panel */}
          <Box
            sx={{
              pointerEvents: "auto",
              position: "relative",
              zIndex: 5,
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <HeroQuestionsPanel
              headlines={[
                "How do reservoir operations affect Delta outflow?",
                "What scenarios improve salmon survival?",
                "Can we balance urban and agricultural needs in a hotter and drier future?",
                "Which policies help meet environmental goals?",
                "How do flow changes impact water availability?",
              ]}
              verticalAlignment="center"
              background="light"
              sx={{
                backgroundColor: "rgb(191, 218, 220)",
              }}
            />

            {/* Original VideoPanel - commented out for future reference 
            <VideoPanel
              title={t("heroPanel.title")}
              content={t<string[]>("heroPanel.content") || []}
              videoSrc="/video/background.mp4"
              posterSrc="/video/poster.jpg"
              overlayOpacity={0}
            />
            */}

            {/* Content and Scroll Down Button */}
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
                maxWidth: "600px",
                textAlign: "center",
              }}
              onClick={() => scrollToQuestionBuilder()}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "rgba(0, 0, 0, 0.8)",
                  marginBottom: 6,
                  textShadow: "0px 0px 10px rgba(255, 255, 255, 0.5)",
                }}
              >
                Water connects us. Explore California&apos;s water system and
                discover possibilities for the future of water in our state.
              </Typography>

              <Box
                sx={(theme) => ({
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.palette.common.white,
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                  },
                })}
              >
                <KeyboardArrowDownIcon
                  fontSize="large"
                  sx={(theme) => ({
                    color: theme.palette.common.white,
                    "&:hover": {
                      color: theme.palette.common.white,
                    },
                  })}
                />
              </Box>
            </Box>
          </Box>

          {/* Two Column Panel 
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
          </Box> */}

          {/* Combined Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="combined-panel-container">
            <CombinedPanel />
          </Box>
        </Box>
      </Box>
    </>
  )
}
