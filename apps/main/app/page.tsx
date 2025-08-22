"use client"

import React, { useState } from "react"
import { Box } from "@repo/ui/mui"
import type { TabKey } from "@repo/ui"
// import { useTranslation } from "@repo/i18n"
// Removed scroll tracking - only ScrollIndicator components need section IDs
import MapPanel from "./features/mapPanel/MapPanel"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
import { useDrawerStore } from "@repo/state"
import { StoreConnectedHeader } from "./components/StoreConnectedHeader"
import { StoreConnectedMultiDrawer } from "./components/StoreConnectedMultiDrawer"

export default function Home() {
  // const { t } = useTranslation()

  // State for the drawer's open status and active tab - REPLACED WITH STORE
  const [, setDrawerOpen] = useState(false)
  const [activeDrawerTab, setActiveDrawerTab] = useState<TabKey | null>(null)
  // Get actions from the Zustand drawer store
  const { openDrawer, closeDrawer } = useDrawerStore.getState()

  // Commenting out map-related code - uncomment to re-enable the map
  /*
  // For the uncontrolled map, store its ref so we can call flyTo
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

  // Simple scroll handler that closes the drawer
  const handleSectionClick = (sectionId: string) => {
    // Simple scroll to element by ID
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    // Close drawer through the store
    closeDrawer()
  }

  // Handler to open specific drawer tabs (using the store)
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

  // const handleOpenCurrentOpsDrawer = (sectionId?: string) => {
  //   // Check if the currentOps drawer is already open
  //   if (activeDrawerTab === "glossary") {
  //     // Check if this is the same section that's currently selected
  //     const drawerStore = useDrawerStore.getState()
  //     const currentSection = drawerStore.content?.selectedSection as
  //       | string
  //       | undefined

  //     if (currentSection === sectionId) {
  //       // Same section - close the drawer (toggle behavior)
  //       closeDrawer()

  //       // Keep the legacy state in sync for components not yet migrated
  //       setDrawerOpen(false)
  //       setActiveDrawerTab(null)
  //       return
  //     } else {
  //       // Different section - just update the content instead of closing
  //       drawerStore.setDrawerContent({ selectedSection: sectionId })
  //       return
  //     }
  //   }

  //   // Store the section ID in the drawer content if provided
  //   if (sectionId) {
  //     useDrawerStore.getState().setDrawerContent({ selectedSection: sectionId })
  //   }
  //   openDrawer("glossary")

  //   // Keep the legacy state in sync for components not yet migrated
  //   setDrawerOpen(true)
  //   setActiveDrawerTab("glossary")
  // }

  return (
    <>
      {/* Always visible header */}
      <StoreConnectedHeader />

      {/* Background Map Layer */}
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
          activeSection=""
        />
      </Box>
      */}

      {/* Simple background to replace the map */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: (theme) => theme.zIndex.mapBackground,
        }}
      />

      {/* MultiDrawer  */}
      <StoreConnectedMultiDrawer
        drawerWidth={360}
        overlay={true}
        onSectionClick={handleSectionClick}
        showSecondaryNav={false}
        secondaryNavItems={[]}
        showRailButton={true}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          position: "relative",
          zIndex: (theme) => theme.zIndex.panels,
          pointerEvents: "auto",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        {/* Main content sections */}
        <Box
          component="main"
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            margin: 0,
            padding: 0,
            overflowX: "hidden",
            width: "100%",
            "& > *": {
              margin: 0,
            },
          }}
        >
          {/* Intro Panel */}
          {/* <IntroSection2 />  Uncomment for concept */}
          {/*<IntroSection3 /> Uncomment for concept */}
          <IntroSection />

          {/* Content Panels */}
          <ContentPanels onOpenLearnDrawer={handleOpenLearnDrawer} />

          <Box sx={{ pointerEvents: "auto", margin: 0 }} id="map-panel">
            <MapPanel />
          </Box>

          {/* <Box sx={{ pointerEvents: "auto", margin: 0 }} id="map-panel">
            <MapPanel2 onOpenThemesDrawer={handleOpenThemesDrawer} />
          </Box> */}

          {/* California Water panel with two columns */}
          {/* <CaliforniaWaterSection onOpenLearnDrawer={handleOpenLearnDrawer} /> */}

          {/* Managing Water panel with two columns */}
          {/* <ManagingWaterSection onOpenLearnDrawer={handleOpenLearnDrawer} /> */}

          {/* Challenges panel with two columns */}
          {/* <ChallengesSection onOpenLearnDrawer={handleOpenLearnDrawer} /> */}

          {/* CalSim panel with two columns */}
          {/* <CalSimSection onOpenLearnDrawer={handleOpenLearnDrawer} /> */}

          {/* Needs Editor Panel */}
          {/* <Box sx={{ pointerEvents: "auto" }} id="needs-editor-container">
            <NeedsEditorPanel />
          </Box> */}
        </Box>
      </Box>
    </>
  )
}
