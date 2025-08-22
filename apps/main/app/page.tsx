"use client"

import { Box } from "@repo/ui/mui"
import { AppHeader } from "@repo/ui"
import { ConnectedMultiDrawer } from "./components/ConnectedMultiDrawer"
import { useGlossaryHandler } from "./hooks/useGlossaryHandler"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
import MapPanel from "./features/mapPanel/MapPanel"

export default function Home() {

  const { handleOpenGlossary } = useGlossaryHandler()
  
  return (
    <>
      {/* Header */}
      <AppHeader />

      {/* Background */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: (theme) => theme.zIndex.basement,
        }}
      />

      {/* Side Drawer */}
      <ConnectedMultiDrawer
        drawerWidth={360}
        overlay={true}
        showRailButtons={true}
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
          {/* Page Sections */}
          <IntroSection />
          <ContentPanels onOpenLearnDrawer={handleOpenGlossary} />
          <Box sx={{ pointerEvents: "auto", margin: 0 }} id="map-panel">
            <MapPanel />
          </Box>
        </Box>
      </Box>
    </>
  )
}
