"use client"

import { Box, useTheme } from "@repo/ui/mui"
import { Header } from "./components/Header"
import { ConnectedMultiDrawer } from "./components/ConnectedMultiDrawer"
import IntroSection from "./sections/IntroSection"

import { TabsProvider } from "./context/Tabs"
import SmoothTabs from './components/tabs/SmoothTabs'
import TabPanels from "./components/tabs/TabPanels"
import { useRef } from "react"

import ScenarioExplorer from "./features/scenarioExplorer/ScenarioExplorer"


export default function Home() {
  const theme = useTheme()

  const tabsRef = useRef<HTMLDivElement>(null)

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
          }}
        >
          {/* Panel sections */}
          <IntroSection />
          <SmoothTabs />
          <TabPanels />
          {/*    <ContentPanels /> */}
        </Box>
      </TabsProvider>
    </>
  )
}
