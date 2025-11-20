"use client"

import { Box } from "@repo/ui/mui"
import { Header } from "./components/Header"
// import { ConnectedMultiDrawer } from "./components/ConnectedMultiDrawer" // DEPRECATED
import { FloatingGlossary } from "./components/FloatingGlossary"
import IntroSection from "./sections/IntroSection"

import { TabsProvider } from "./context/Tabs"
import SmoothTabs from "./components/tabs/SmoothTabs"
import TabPanels from "./components/tabs/TabPanels"

export default function Home() {
  // const theme = useTheme() // No longer needed without ConnectedMultiDrawer

  return (
    <>
      <TabsProvider>
        {/* Header */}
        <Header />

        {/* Side drawer (glossary) - DEPRECATED: Replaced by FloatingGlossary */}
        {/* <ConnectedMultiDrawer
          drawerWidth={theme.layout.drawer.width}
          overlay={true}
        /> */}

        {/* Floating glossary button and panel */}
        <FloatingGlossary />

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
