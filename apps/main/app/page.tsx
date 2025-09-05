"use client"

import { Box, useTheme } from "@repo/ui/mui"
import { Header } from "./components/Header"
import { ConnectedMultiDrawer } from "./components/ConnectedMultiDrawer"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
import ScenarioExplorer from "./features/scenarioExplorer/ScenarioExplorer"

export default function Home() {
  const theme = useTheme()

  return (
    <>
      {/* Header */}
      <Header />

      {/* Side drawer */}
      <ConnectedMultiDrawer
        drawerWidth={theme.layout.drawer.width}
        overlay={true}
        /*         overlay={!isTablet}
        showRailButtons={true} */
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          position: "relative",
          zIndex: (theme) => theme.zIndex.panels,
          overflowX: "clip",
          overflowY: "visible",
          pointerEvents: "none", // Allow map interactions to pass through
        }}
      >
        {/* Panel sections */}
        <IntroSection />
        <ContentPanels />
        <ScenarioExplorer />
      </Box>
    </>
  )
}
