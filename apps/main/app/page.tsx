"use client"

import { Box, useTheme } from "@repo/ui/mui"
import { AppHeader } from "@repo/ui"
import { ConnectedMultiDrawer } from "./components/ConnectedMultiDrawer"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
import ScenarioExplorer from "./features/scenarioExplorer/ScenarioExplorer"

export default function Home() {
  const theme = useTheme()

  return (
    <>
      {/* Header */}
      <AppHeader />

      {/* Side drawer */}
      <ConnectedMultiDrawer
        drawerWidth={theme.layout.drawer.width}
        overlay={true}
        showRailButtons={true}
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          position: "relative",
          zIndex: (theme) => theme.zIndex.panels,
          overflowX: "hidden",
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
