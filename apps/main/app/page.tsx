"use client"

import React, { useState, useRef, useMemo } from "react"
import { Box } from "@repo/ui/mui"
import { Header, MultiDrawer, VerticalDivider } from "@repo/ui"
import type { SecondaryNavItem, TabKey } from "@repo/ui"
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
const navSectionIds = {
  hero: "hero",
  interstitial: "interstitial",
  californiaWater: "california-water",
  managingWater: "managing-water",
  challenges: "challenges",
  calsim: "calsim",
  invitation: "invitation",
  combinedPanel: "combined-panel",
}

export default function Home() {
  const { t } = useTranslation()

  // State for the drawer's open status and active tab
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeDrawerTab, setActiveDrawerTab] = useState<TabKey | null>(null)

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
    setActiveDrawerTab(null)
  }

  // Get navigation items with the current active section and translation function
  const navigationItems = getNavigationItems(
    activeSection,
    handleSectionClick,
    t,
  )

  // Handler for drawer state changes
  const handleDrawerStateChange = (
    isOpen: boolean,
    activeTab: TabKey | null,
  ) => {
    setDrawerOpen(isOpen)
    setActiveDrawerTab(activeTab)
  }

  // Handler to open the "learn" tab of the drawer
  const handleOpenLearnDrawer = () => {
    setDrawerOpen(true)
    setActiveDrawerTab("learn")
  }

  // Handler to open the "currentOps" tab of the drawer
  const handleOpenCurrentOpsDrawer = () => {
    setDrawerOpen(true)
    setActiveDrawerTab("currentOps")
  }

  // Handler to open the "themes" tab of the drawer
  const handleOpenThemesDrawer = () => {
    setDrawerOpen(true)
    setActiveDrawerTab("themes")
  }

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
        label: "California Water",
        sectionId: "california-water",
      },
      {
        key: "managingWater",
        label: "MANAGING WATER",
        sectionId: "managing-water",
      },
      {
        key: "explore",
        label: "EXPLORE SCENARIOS",
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

      {/* ===== MultiDrawer with tabs ===== */}
      <MultiDrawer
        drawerWidth={360}
        onDrawerStateChange={handleDrawerStateChange}
        activeTab={activeDrawerTab}
        overlay={true}
      />

      {/* ===== Main Content Area ===== */}
      <Box
        sx={{
          position: "relative",
          zIndex: 20,
          pointerEvents: "none",
          width: "100%",
        }}
      >
        {/* Header */}
        <Box sx={{ pointerEvents: "auto" }}>
          <Header
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
          <CaliforniaWaterSection onOpenLearnDrawer={handleOpenLearnDrawer} />

          {/* Managing Water panel with two columns */}
          <ManagingWaterSection onOpenLearnDrawer={handleOpenLearnDrawer} />

          {/* Challenges panel with two columns */}
          <ChallengesSection 
            onOpenLearnDrawer={handleOpenLearnDrawer}
            onOpenCurrentOpsDrawer={handleOpenCurrentOpsDrawer}
            onOpenThemesDrawer={handleOpenThemesDrawer}
          />

          {/* CalSim panel with two columns */}
          <CalSimSection onOpenLearnDrawer={handleOpenLearnDrawer} />

          {/* Invitation panel with two columns */}
          <InvitationSection 
            onOpenLearnDrawer={handleOpenLearnDrawer}
            onOpenCurrentOpsDrawer={handleOpenCurrentOpsDrawer}
            onOpenThemesDrawer={handleOpenThemesDrawer}
          />

          {/* Combined Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="combined-panel">
            <CombinedPanel onOpenThemesDrawer={handleOpenThemesDrawer} />
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
