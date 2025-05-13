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
import HeroSection from "./sections/HeroSection"
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
import { KenBurnsMapEffect } from "./utils/mapEffects"

// Make sure these IDs match the section IDs used in the HeaderHome component
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
  const kenBurnsEffectRef = useRef<KenBurnsMapEffect | null>(null)

  // Track if the effect is running
  const [kenBurnsActive, setKenBurnsActive] = useState(false)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uncontrolledRef])

  // Create and prepare the Ken Burns effect
  useEffect(() => {
    // Initialize effect only when map reference is available
    if (!uncontrolledRef.current || kenBurnsEffectRef.current) return

    console.log("📸 Creating Ken Burns effect instance")

    // Create the effect
    const effect = new KenBurnsMapEffect(uncontrolledRef)

    // Set up the keyframes to follow California's water system
    effect
      // Start with California overview - EXACTLY match the default position
      .addKeyframe(
        [mapStore.viewState.longitude, mapStore.viewState.latitude],
        mapStore.viewState.zoom,
        7000,
        mapStore.viewState.bearing,
        mapStore.viewState.pitch,
      )

      // Move to Shasta Lake
      .addKeyframe([-123.3, 40.72], 8, 9000, 0, 10)

      // Down the Sacramento River
      .addKeyframe([-123.2, 40.58], 8.5, 7000, -5, 20)

      // Delta region
      .addKeyframe([-122.5, 38.05], 8.2, 12000, 10, 20)

      // Upper San Joaquin River
      .addKeyframe([-122.2, 37.67], 8, 10000, 5, 30)

      // Mid San Joaquin Valley (not going as far south)
      .addKeyframe([-121.6, 37.3], 7.8, 11000, 0, 20)

      // Zoom out to full state view to complete the journey - EXACTLY match the default position
      .addKeyframe(
        [mapStore.viewState.longitude, mapStore.viewState.latitude],
        mapStore.viewState.zoom,
        9000,
        mapStore.viewState.bearing,
        mapStore.viewState.pitch,
      )

      .setLoop(true)

    // Store the effect for later use
    kenBurnsEffectRef.current = effect

    // Don't start it yet - wait for scroll position trigger

    // Cleanup on unmount
    return () => {
      if (kenBurnsEffectRef.current) {
        console.log("🛑 Cleaning up Ken Burns effect on page unmount")
        kenBurnsEffectRef.current.stop()
        kenBurnsEffectRef.current = null
      }
    }
  }, [uncontrolledRef.current])

  // Ken Burns effect is enabled by default
  const kenBurnsEnabled = true

  // Start/stop Ken Burns effect based on which section is active
  useEffect(() => {
    console.log("⚡ Ken Burns effect check running with:", {
      activeSection,
      kenBurnsEnabled,
      kenBurnsActive,
      hasEffect: !!kenBurnsEffectRef.current,
      hasMap: !!uncontrolledRef.current,
      isInterstitial: activeSection === navSectionIds.interstitial,
    })

    // Only proceed if map and effect are available
    if (!kenBurnsEffectRef.current || !uncontrolledRef.current) {
      console.log("🚫 Missing refs, can't start Ken Burns effect")
      return
    }

    // Start effect when Interstitial panel becomes active
    if (activeSection === navSectionIds.interstitial && kenBurnsEnabled) {
      if (!kenBurnsActive) {
        console.log("▶️ Starting Ken Burns effect - Interstitial panel in view")
        kenBurnsEffectRef.current.start()
        setKenBurnsActive(true)
      }
    }
    // Stop the effect for certain sections where it might be distracting
    else if (
      activeSection === navSectionIds.hero ||
      activeSection === navSectionIds.combinedPanel
    ) {
      if (kenBurnsActive) {
        console.log("⏸️ Stopping Ken Burns effect - Different section in view")
        kenBurnsEffectRef.current.stop()

        // Reset map to default position when stopping the effect
        if (uncontrolledRef.current) {
          console.log("🔄 Resetting map to default position")
          uncontrolledRef.current.flyTo({
            center: [mapStore.viewState.longitude, mapStore.viewState.latitude],
            zoom: mapStore.viewState.zoom,
            bearing: mapStore.viewState.bearing,
            pitch: mapStore.viewState.pitch,
            duration: 1000, // Smooth transition over 1 second
          })
        }

        setKenBurnsActive(false)
      }
    }
  }, [
    activeSection,
    kenBurnsActive,
    uncontrolledRef,
    kenBurnsEnabled,
    navSectionIds.interstitial,
  ])

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
    if (activeDrawerTab === "themes") {
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
    openDrawer("themes")

    // Keep the legacy state in sync for components not yet migrated
    setDrawerOpen(true)
    setActiveDrawerTab("themes")
  }

  // Handler to open specific drawer tabs - using the store
  const handleOpenLearnDrawer = (sectionId?: string) => {
    // Check if the learn drawer is already open
    if (activeDrawerTab === "learn") {
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
    openDrawer("learn")

    // Keep the legacy state in sync for components not yet migrated
    setDrawerOpen(true)
    setActiveDrawerTab("learn")
  }

  const handleOpenCurrentOpsDrawer = (sectionId?: string) => {
    // Check if the currentOps drawer is already open
    if (activeDrawerTab === "currentOps") {
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
    openDrawer("currentOps")

    // Keep the legacy state in sync for components not yet migrated
    setDrawerOpen(true)
    setActiveDrawerTab("currentOps")
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
          {/* Landing Panel */}
          <HeroSection />

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
