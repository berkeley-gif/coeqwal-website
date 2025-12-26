"use client"

/**
 * Main application entry point
 *
 * Renders the main page with persistent map, header, tabs, and content sections.
 */

import { Suspense } from "react"
import { Box } from "@repo/ui/mui"
import { MapProvider } from "@repo/map"
import { Header } from "./components/Header"
import { FloatingGlossary } from "./features/glossary"
import IntroSection from "./sections/IntroSection"
import PersistentMap from "./features/map/PersistentMap"

import { TabsProvider } from "./context/Tabs"
import SmoothTabs from "./components/tabs/SmoothTabs"
import TabPanels from "./components/tabs/TabPanels"

export default function Home() {
  return (
    <>
      {/* MapProvider at top level so both the map and overlays can access it */}
      <MapProvider>
        {/* 
          Persistent map - renders once and stays mounted.
          Preloads during IntroSection scroll, ready when tabs appear.
          Positions itself based on mapMode from store (hidden | learn | explore).
        */}
        <Suspense fallback={null}>
          <PersistentMap />
        </Suspense>

        <TabsProvider>
          <Header />
          <FloatingGlossary />
          <Box
            component="main"
            sx={{
              position: "relative",
              overflowX: "clip",
              overflowY: "visible",
              // Allow pointer events to pass through to the persistent map
              // Child components re-enable pointer events where needed
              pointerEvents: "none",
              // Above map level so content appears on top
              zIndex: (theme) => theme.zIndex.pageContent,
            }}
          >
            <IntroSection />
            {/* Suspense is needed for useSearchParams() */}
            <Suspense fallback={null}>
              <SmoothTabs />
              <TabPanels />
            </Suspense>
          </Box>
        </TabsProvider>
      </MapProvider>
    </>
  )
}
