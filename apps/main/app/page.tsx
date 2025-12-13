"use client"

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
          Positions itself based on mapMode from store (hidden/learn/explore).
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
              // No z-index necessaryhere, flows in natural DOM order, rendered first (behind) in the DOM
            }}
          >
            <IntroSection />
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
