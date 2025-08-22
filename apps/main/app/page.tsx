"use client"

import { Box, useTheme } from "@repo/ui/mui"
import { AppHeader } from "@repo/ui"
import { ConnectedMultiDrawer } from "./components/ConnectedMultiDrawer"
import { useGlossaryHandler } from "./hooks/useGlossaryHandler"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
import MapPanel from "./features/mapPanel/MapPanel"

export default function Home() {
  const theme = useTheme()
  const { handleOpenGlossary } = useGlossaryHandler()
  
  return (
    <>
      {/* Header */}
      <AppHeader />

      {/* Side Drawer */}
      <ConnectedMultiDrawer
        drawerWidth={theme.layout.drawer.width}
        overlay={true}
        showRailButtons={true}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          position: "relative",
          zIndex: (theme) => theme.zIndex.panels,
          overflowX: "hidden",
        }}
      >
          {/* Page Sections */}
          <IntroSection />
          <ContentPanels onOpenLearnDrawer={handleOpenGlossary} />
          <Box id="map-panel">
            <MapPanel />
          </Box>
      </Box>
    </>
  )
}
