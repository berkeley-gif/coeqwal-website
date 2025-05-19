"use client"

import React, { useState, useRef, useEffect, useLayoutEffect } from "react"
import { Box } from "@repo/ui/mui"
import { HeaderHome } from "@repo/ui"
import type { TabKey } from "@repo/ui"
// import { useTranslation } from "@repo/i18n"
import { useScrollTracking } from "./hooks/useScrollTracking"
import { sectionIds } from "./config/navigation"
import type { MapboxMapRef } from "@repo/map"
import MapContainer from "./components/MapContainer"
import CombinedPanel from "./features/combinedPanel/CombinedPanel"
// import { NeedsEditorPanel } from "./features/needsEditor/components"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
import InterstitialPanel from "./sections/InterstitialPanel"
import CaliforniaWaterSection from "./sections/CaliforniaWaterSection"
import ManagingWaterSection from "./sections/ManagingWaterSection"
import ChallengesSection from "./sections/ChallengesSection"
import CalSimSection from "./sections/CalSimSection"
import InvitationSection from "./sections/InvitationSection"
import { useDrawerStore } from "@repo/state"
import { useMapStore, mapActions } from "@repo/state/map"
import { StoreConnectedMultiDrawer } from "./components/StoreConnectedMultiDrawer"
import { Slide } from "@mui/material"
import { KenBurnsMapEffect } from "./components/KenBurnsMapEffect"

// Make sure these IDs match the section IDs used in the HeaderHome component
const navSectionIds = {
  intro: "intro",
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
  const { openDrawer, closeDrawer } = useDrawerStore.getState()

  // Track all sections including the ones for the top navigation
  const allSectionIds = [...sectionIds, ...Object.values(navSectionIds)]
  const { activeSection, scrollToSection } = useScrollTracking(allSectionIds)

  // For the uncontrolled map, we'll store its ref so we can call flyTo
  const uncontrolledRef = useRef<MapboxMapRef | null>(
    null,
  ) as React.RefObject<MapboxMapRef>

  // Access the map store to update the initial view state
  const mapStore = useMapStore()

  // Use useLayoutEffect to ensure this runs BEFORE the first render
  // This guarantees the map store has the correct state before any map initialization
  useLayoutEffect(() => {
    console.log("🗺️ PRE-RENDER: Setting map store viewState")

    // Set default position in the map store
    mapActions.setViewState({
      longitude: -127.5,
      latitude: 37.962,
      zoom: 5.83,
      bearing: 0,
      pitch: 0,
    })
  }, []) // Empty dependency array ensures this runs once before component mounts

  // Keep our own reference to the Ken Burns effect for cleanup
  // const kenBurnsEffectRef = useRef<KenBurnsMapEffect | null>(null)

  // Ensure map starts in the correct position
  useEffect(() => {
    if (!uncontrolledRef.current) return

    console.log(
      "🌍 Setting initial map position to match first animation keyframe",
    )
    uncontrolledRef.current.jumpTo({
      center: [mapStore.viewState.longitude, mapStore.viewState.latitude],
      zoom: mapStore.viewState.zoom,
      bearing: mapStore.viewState.bearing,
      pitch: mapStore.viewState.pitch,
    })
  }, [uncontrolledRef, mapStore.viewState])

  // Show drawer after content panels moved up 50% of viewport
  const [showDrawer, setShowDrawer] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const elem = document.getElementById("content-panels")
      if (!elem) return
      const rect = elem.getBoundingClientRect()
      const threshold = window.innerHeight * 0.5
      setShowDrawer(rect.top < threshold)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  // Handler to open specific drawer tabs - using the store
  const handleOpenThemesDrawer = (operationId?: string) => {
    // Check if the themes drawer is already open
    if (activeDrawerTab === "glossary") {
      // Check if this is the same operation that's currently selected
      const drawerStore = useDrawerStore.getState()
      const currentOperation = drawerStore.content?.selectedOperation as
        | string
        | undefined

      if (currentOperation === operationId) {
        // Same operation - close the drawer (toggle behavior)
        closeDrawer()

        // Keep the legacy state in sync for components not yet migrated
        setDrawerOpen(false)
        setActiveDrawerTab(null)
        return
      } else {
        // Different operation - just update the content instead of closing
        drawerStore.setDrawerContent({ selectedOperation: operationId })
        return
      }
    }

    // Store the operation ID in the drawer content if provided
    if (operationId) {
      useDrawerStore
        .getState()
        .setDrawerContent({ selectedOperation: operationId })
    }
    openDrawer("glossary")

    // Keep the legacy state in sync for components not yet migrated
    setDrawerOpen(true)
    setActiveDrawerTab("glossary")
  }

  // Handler to open specific drawer tabs - using the store
  const handleOpenLearnDrawer = (sectionId?: string) => {
    // Check if the learn drawer is already open
    if (activeDrawerTab === "glossary") {
      // Check if this is the same section that's currently selected
      const drawerStore = useDrawerStore.getState()
      const currentSection = drawerStore.content?.selectedSection as
        | string
        | undefined

      if (currentSection === sectionId) {
        // Same section - close the drawer (toggle behavior)
        closeDrawer()

        // Keep the legacy state in sync for components not yet migrated
        setDrawerOpen(false)
        setActiveDrawerTab(null)
        return
      } else {
        // Different section - just update the content instead of closing
        drawerStore.setDrawerContent({ selectedSection: sectionId })
        return
      }
    }

    // Store the section ID in the drawer content if provided
    if (sectionId) {
      useDrawerStore.getState().setDrawerContent({ selectedSection: sectionId })
    }
    openDrawer("glossary")

    // Keep the legacy state in sync for components not yet migrated
    setDrawerOpen(true)
    setActiveDrawerTab("glossary")
  }

  const handleOpenCurrentOpsDrawer = (sectionId?: string) => {
    // Check if the currentOps drawer is already open
    if (activeDrawerTab === "glossary") {
      // Check if this is the same section that's currently selected
      const drawerStore = useDrawerStore.getState()
      const currentSection = drawerStore.content?.selectedSection as
        | string
        | undefined

      if (currentSection === sectionId) {
        // Same section - close the drawer (toggle behavior)
        closeDrawer()

        // Keep the legacy state in sync for components not yet migrated
        setDrawerOpen(false)
        setActiveDrawerTab(null)
        return
      } else {
        // Different section - just update the content instead of closing
        drawerStore.setDrawerContent({ selectedSection: sectionId })
        return
      }
    }

    // Store the section ID in the drawer content if provided
    if (sectionId) {
      useDrawerStore.getState().setDrawerContent({ selectedSection: sectionId })
    }
    openDrawer("glossary")

    // Keep the legacy state in sync for components not yet migrated
    setDrawerOpen(true)
    setActiveDrawerTab("glossary")
  }

  // Create the secondary navigation items
  // const secondaryNavItems = useMemo<SecondaryNavItem[]>(
  //   () => [
  //     {
  //       key: "home",
  //       label: "HOME",
  //       sectionId: "hero",
  //     },
  //     {
  //       key: "californiaWater",
  //       label: "California Water",
  //       sectionId: "california-water",
  //     },
  //     {
  //       key: "managingWater",
  //       label: "MANAGING WATER",
  //       sectionId: "managing-water",
  //     },
  //     {
  //       key: "explore",
  //       label: "EXPLORE SCENARIOS",
  //       sectionId: "invitation",
  //     },
  //     {
  //       key: "scenarioSearch",
  //       label: "SCENARIO SEARCH",
  //       sectionId: "combined-panel",
  //     },
  //   ],
  //   [],
  // )

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
        <KenBurnsMapEffect
          mapRef={uncontrolledRef}
          enabled={true}
          activeSection={activeSection}
        />
      </Box>

      {/* ===== MultiDrawer with tabs ===== */}
      <Slide in={showDrawer} timeout={600} mountOnEnter unmountOnExit>
        <Box>
          <StoreConnectedMultiDrawer
            drawerWidth={360}
            overlay={true}
            visible={showDrawer}
          />
        </Box>
      </Slide>

      {/* ===== Main Content Area ===== */}
      <Box
        sx={{
          position: "relative",
          zIndex: 20,
          pointerEvents: "none",
          width: "100%",
        }}
      >
        {/* HeaderHome */}
        <Box sx={{ pointerEvents: "auto" }}>
          <HeaderHome
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            showSecondaryNav={false}
            // secondaryNavItems={secondaryNavItems}
          />
        </Box>

        {/* Main content sections */}
        <Box
          component="main"
          sx={{
            position: "relative",
          }}
        >
          {/* Intro Panel */}
          <IntroSection />

          {/* Interstitial Panel */}
          <InterstitialPanel />

          {/* Content Panels */}
          <ContentPanels onOpenLearnDrawer={handleOpenLearnDrawer} />

          {/* Combined Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="combined-panel">
            <CombinedPanel onOpenThemesDrawer={handleOpenThemesDrawer} />
          </Box>

          {/* California Water panel with two columns */}
          <CaliforniaWaterSection onOpenLearnDrawer={handleOpenLearnDrawer} />

          {/* Managing Water panel with two columns */}
          <ManagingWaterSection onOpenLearnDrawer={handleOpenLearnDrawer} />

          {/* Challenges panel with two columns */}
          <ChallengesSection onOpenLearnDrawer={handleOpenLearnDrawer} />

          {/* CalSim panel with two columns */}
          <CalSimSection onOpenLearnDrawer={handleOpenLearnDrawer} />

          {/* Invitation panel with two columns */}
          <InvitationSection
            onOpenCurrentOpsDrawer={handleOpenCurrentOpsDrawer}
            onOpenThemesDrawer={handleOpenThemesDrawer}
          />

          {/* Needs Editor Panel */}
          {/* <Box sx={{ pointerEvents: "auto" }} id="needs-editor-container">
            <NeedsEditorPanel />
          </Box> */}
        </Box>
      </Box>
    </>
  )
}
