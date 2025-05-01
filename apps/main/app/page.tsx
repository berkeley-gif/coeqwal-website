"use client"

import React, { useState, useRef, useMemo } from "react"
import { Box } from "@repo/ui/mui"
import { Header, MiniDrawer, VerticalDivider } from "@repo/ui"
import type { SecondaryNavItem } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
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
import CalSimSection from "./sections/CalSimSection"
import InvitationSection from "./sections/InvitationSection"

// Make sure these IDs match the section IDs used in the Header component
export const navSectionIds = {
  hero: "hero", // For HeroSection and InterstitialPanel together
  californiaWater: "california-water",
  managingWater: "managing-water",
  challenges: "challenges",
  calsim: "calsim",
  invitation: "invitation",
  combinedPanel: "combined-panel",
}

export default function Home() {
  const { t } = useTranslation()

  const [drawerOpen, setDrawerOpen] = useState(false)
  // Track all sections including the ones for the top navigation
  const allSectionIds = [...sectionIds, ...Object.values(navSectionIds)]
  const { activeSection, scrollToSection } = useScrollTracking(allSectionIds)

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

  // Create the secondary navigation items
  const secondaryNavItems = useMemo<SecondaryNavItem[]>(
    () => [
      {
        key: "home",
        label: "HOME",
        sectionId: "hero",
      },
      {
        key: "californiaWater",
        label: "CALIFORNIA WATER",
        sectionId: "california-water",
      },
      {
        key: "managingWater",
        label: "MANAGING WATER",
        sectionId: "managing-water",
      },
      {
        key: "challenges",
        label: "GROWING CHALLENGES",
        sectionId: "challenges",
      },
      {
        key: "calsim",
        label: "CALSIM",
        sectionId: "calsim",
      },
      {
        key: "explore",
        label: "EXPLORE",
        sectionId: "invitation",
      },
      {
        key: "scenarioSearch",
        label: "SCENARIO SEARCH",
        sectionId: "combined-panel",
      },
    ],
    [],
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
          <Header
            drawerOpen={drawerOpen}
            drawerPosition="right"
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            showSecondaryNav={true}
            secondaryNavItems={secondaryNavItems}
          />
        </Box>

        {/* Main content sections */}
        <Box
          component="main"
          sx={{
            position: "relative",
          }}
        >
          {/* Landing Panel */}
          <HeroSection />

          {/* Interstitial Panel */}
          <InterstitialPanel />

          {/* California Water panel with two columns */}
          <CaliforniaWaterSection onOpenDrawer={() => setDrawerOpen(true)} />

          {/* Managing Water panel with two columns */}
          <ManagingWaterSection onOpenDrawer={() => setDrawerOpen(true)} />

          {/* Challenges panel with two columns */}
          <ChallengesSection onOpenDrawer={() => setDrawerOpen(true)} />

          {/* CalSim panel with two columns */}
          <CalSimSection onOpenDrawer={() => setDrawerOpen(true)} />

          {/* Invitation panel with two columns */}
          <InvitationSection onOpenDrawer={() => setDrawerOpen(true)} />

          {/* Combined Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="combined-panel">
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
