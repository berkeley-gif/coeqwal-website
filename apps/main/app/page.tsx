"use client"

import React, { useState, useRef, useMemo } from "react"
import { Box } from "@repo/ui/mui"
import { Header, MultiDrawer } from "@repo/ui"
import type { SecondaryNavItem, TabKey } from "@repo/ui"
// import { useTranslation } from "@repo/i18n"
import { useScrollTracking } from "./hooks/useScrollTracking"
import { sectionIds } from "./config/navigation"
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
import { useDrawerStore } from "@repo/state"
import { StoreConnectedMultiDrawer } from "./components/StoreConnectedMultiDrawer"

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
  // const { t } = useTranslation()

  // State for the drawer's open status and active tab - REPLACED WITH STORE
  const [, setDrawerOpen] = useState(false)
  const [activeDrawerTab, setActiveDrawerTab] = useState<TabKey | null>(null)
  // Get actions from the Zustand drawer store
  const { openDrawer, closeDrawer, setActiveTab } = useDrawerStore.getState()

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
    // Close drawer through the store
    closeDrawer()
  }

  // Get navigation items with the current active section and translation function
  // const navigationItems = getNavigationItems(
  //   activeSection,
  //   handleSectionClick,
  //   t,
  // )

  // Handler for drawer state changes - updates the store
  const handleDrawerStateChange = (
    isOpen: boolean,
    activeTab: TabKey | null,
  ) => {
    if (isOpen && activeTab) {
      setActiveTab(activeTab)
    } else {
      closeDrawer()
    }

    // Keep the legacy state in sync for components not yet migrated
    setDrawerOpen(isOpen)
    setActiveDrawerTab(activeTab)
  }

  // Handler to open specific drawer tabs - using the store
  const handleOpenLearnDrawer = () => {
    openDrawer("learn")

    // Keep the legacy state in sync for components not yet migrated
    setDrawerOpen(true)
    setActiveDrawerTab("learn")
  }

  const handleOpenCurrentOpsDrawer = () => {
    openDrawer("currentOps")

    // Keep the legacy state in sync for components not yet migrated
    setDrawerOpen(true)
    setActiveDrawerTab("currentOps")
  }

  const handleOpenThemesDrawer = () => {
    openDrawer("themes")

    // Keep the legacy state in sync for components not yet migrated
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
      <StoreConnectedMultiDrawer drawerWidth={360} overlay={true} />

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
