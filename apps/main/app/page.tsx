"use client"

import { Box, useTheme } from "@repo/ui/mui"
import { Header } from "./components/Header"
import { ConnectedMultiDrawer } from "./components/ConnectedMultiDrawer"
import IntroSection from "./sections/IntroSection"
import ContentPanels from "./sections/ContentPanels"
import ScenarioExplorer3 from "./features/scenarioExplorer/ScenarioExplorer3"
import { TabsProvider } from "./context/Tabs"
import SmoothTabs from './components/tabs/SmoothTabs'
import TabPanels from "./components/tabs/TabPanels"

export default function Home() {
  const theme = useTheme()

  return (
    <>
      <TabsProvider>
        {/* Header */}
        <Header />

        {/* Side drawer (glossary) */}
        <ConnectedMultiDrawer
          drawerWidth={theme.layout.drawer.width}
          overlay={true}
        />

        {/* Main content */}
        <Box
          component="main"
          sx={{
            position: "relative",
            zIndex: (theme) => theme.zIndex.panels, // (not in use but left here to demonstrate z-indexing system)
            overflowX: "clip",
            overflowY: "visible",
            pointerEvents: "none", // Allow map interactions to pass through
          }}
        >
          {/* Panel sections */}
          <IntroSection />
          <SmoothTabs />
          <TabPanels />
          {/*    <ContentPanels /> */}

          <ScenarioExplorer3 />
        </Box>
      </TabsProvider>
    </>
  )
}
