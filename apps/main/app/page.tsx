"use client"

import React, { useState, /* useRef, useEffect, useLayoutEffect */ } from "react"
import { Box } from "@repo/ui/mui"
import type { TabKey } from "@repo/ui"
// import { useTranslation } from "@repo/i18n"
import { useScrollTracking } from "./hooks/useScrollTracking"
import { sectionIds } from "./config/navigation"
// Commenting out map-related imports - uncomment to re-enable the map
// import type { MapboxMapRef } from "@repo/map"
// import MapContainer from "./components/MapContainer"
import CombinedPanel from "./features/combinedPanel/CombinedPanel"
// import { NeedsEditorPanel } from "./features/needsEditor/components"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
import CaliforniaWaterSection from "./sections/CaliforniaWaterSection"
import ManagingWaterSection from "./sections/ManagingWaterSection"
import ChallengesSection from "./sections/ChallengesSection"
import CalSimSection from "./sections/CalSimSection"
import InvitationSection from "./sections/InvitationSection"
import { useDrawerStore } from "@repo/state"
// Commenting out map store - uncomment to re-enable the map
// import { useMapStore, mapActions } from "@repo/state/map"
import { StoreConnectedHeader } from "./components/StoreConnectedHeader"
import { StoreConnectedMultiDrawer } from "./components/StoreConnectedMultiDrawer"
// Commenting out map effect - uncomment to re-enable the map
// import { KenBurnsMapEffect } from "./components/KenBurnsMapEffect"

// Make sure these IDs match the section IDs used in the HeaderHome component
const navSectionIds = {
  intro: "intro",
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

  // Commenting out map-related code - uncomment to re-enable the map
  /*
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
  */

  // Custom scroll handler that also closes the drawer
  const handleSectionClick = (sectionId: string) => {
    scrollToSection(sectionId)
    // Close drawer through the store
    closeDrawer()
  }

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

  return (
    <>
      {/* Always visible header */}
      <StoreConnectedHeader
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
      />

      {/* ===== Background Map Layer ===== */}
      {/* Commenting out map-related code - uncomment to re-enable the map
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
      */}

      {/* Simple gradient background to replace the map */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          background: "linear-gradient(to bottom, #D1DDD9, #218dba, #459ede)",
          backgroundSize: "100% 100%",
        }}
      />

      {/* ===== MultiDrawer - Always visible ===== */}
      <StoreConnectedMultiDrawer
        drawerWidth={360}
        overlay={true}
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        showSecondaryNav={false}
        secondaryNavItems={[]}
        showRailButton={false}
      />

      {/* ===== Main Content Area ===== */}
      <Box
        sx={{
          position: "relative",
          zIndex: 20,
          pointerEvents: "auto",
          width: "100%",
        }}
      >
        {/* Main content sections */}
        <Box
          component="main"
          sx={{
            position: "relative",
          }}
        >
          {/* Intro Panel */}
          <IntroSection />

          {/* Content Panels */}
          <ContentPanels onOpenLearnDrawer={handleOpenLearnDrawer} />

          {/* Combined Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="combined-panel">
            <CombinedPanel onOpenThemesDrawer={handleOpenThemesDrawer} />
          </Box>

          California Water panel with two columns
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
