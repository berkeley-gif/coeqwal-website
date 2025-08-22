"use client"

import React, { useState } from "react"
import { Box } from "@repo/ui/mui"
import type { TabKey } from "@repo/ui"
// import { useTranslation } from "@repo/i18n"
import { AppHeader } from "@repo/ui"
import { ConnectedMultiDrawer } from "./components/ConnectedMultiDrawer"
import { useDrawerStore } from "@repo/state"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
import MapPanel from "./features/mapPanel/MapPanel"

export default function Home() {
  // const { t } = useTranslation()

  const [, setDrawerOpen] = useState(false)
  const [activeDrawerTab, setActiveDrawerTab] = useState<TabKey | null>(null)
  const { openDrawer, closeDrawer } = useDrawerStore.getState()

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

  return (
    <>
              <AppHeader />

      {/* Background */}
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

      <ConnectedMultiDrawer
        drawerWidth={360}
        overlay={true}
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
          <IntroSection />
          <ContentPanels onOpenLearnDrawer={handleOpenLearnDrawer} />
          <Box sx={{ pointerEvents: "auto", margin: 0 }} id="map-panel">
            <MapPanel />
          </Box>
        </Box>
      </Box>
    </>
  )
}
