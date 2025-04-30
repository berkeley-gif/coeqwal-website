"use client"

import React, { useState, useRef } from "react"
import { Box, Typography } from "@repo/ui/mui"
import { Header, MiniDrawer, VerticalDivider } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { BasePanel } from "@repo/ui"
import { useScrollTracking } from "./hooks/useScrollTracking"
import { sectionIds, getNavigationItems } from "./config/navigation"
import type { MapboxMapRef } from "@repo/map"
import MapContainer from "./components/MapContainer"
import CombinedPanel from "./features/combinedPanel/CombinedPanel"
import { NeedsEditorPanel } from "./features/needsEditor/components"
import HeroSection from "./sections/HeroSection"
import InterstitialPanel from "./sections/InterstitialPanel"
import CaliforniaWaterSection from "./sections/CaliforniaWaterSection"
import ManagingWaterSection from "./sections/ManagingWaterSection"
import ChallengesSection from "./sections/ChallengesSection"

export default function Home() {
  const { t } = useTranslation()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const { activeSection, scrollToSection } = useScrollTracking(sectionIds)

  // For the uncontrolled map, we'll store its ref so we can call flyTo
  const uncontrolledRef = useRef<MapboxMapRef | null>(
    null,
  ) as React.RefObject<MapboxMapRef>

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
          zIndex: -1,
        }}
      >
        <MapContainer uncontrolledRef={uncontrolledRef} />
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
        {/* Header */}
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
          <HeroSection />

          {/* Interstitial Panel */}
          <InterstitialPanel />

          {/* California Water panel with two columns */}
          <CaliforniaWaterSection onOpenDrawer={() => setDrawerOpen(true)} />

          {/* Managing Water panel with two columns */}
          <ManagingWaterSection onOpenDrawer={() => setDrawerOpen(true)} />

          {/* Challenges Panel */}
          <ChallengesSection onOpenDrawer={() => setDrawerOpen(true)} />

          {/* To Be Continued Panel */}
          <Box sx={{ pointerEvents: "auto" }}>
            <BasePanel
              background="transparent"
              paddingVariant="wide"
              includeHeaderSpacing={false}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "30vh",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontStyle: "italic",
                  color: "white",
                  textAlign: "center",
                }}
              >
                (to be continued)
              </Typography>
            </BasePanel>
          </Box>

          {/* Combined Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="combined-panel-container">
            <CombinedPanel />
          </Box>
          {/* Needs Editor Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="needs-editor-container">
            <NeedsEditorPanel />
          </Box>
        </Box>
      </Box>
    </>
  )
}
