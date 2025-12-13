"use client"

import { Suspense } from "react"
import { Box } from "@repo/ui/mui"
import { MapProvider } from "@repo/map"
import { Header } from "./components/Header"
import { FloatingGlossary } from "./features/glossary"
import IntroSection from "./sections/IntroSection"
import PersistentLearnMap from "./features/map/PersistentLearnMap"

import { TabsProvider } from "./context/Tabs"
import SmoothTabs from "./components/tabs/SmoothTabs"
import TabPanels from "./components/tabs/TabPanels"

export default function Home() {
  return (
    <>
      {/* MapProvider at top level so both the map and overlays can access it */}
      <MapProvider>
        {/* Persistent map layer - sits at z-index 0, never unmounts */}
        {/* Wrapped in Suspense for useSearchParams */}
        <Suspense fallback={null}>
          <PersistentLearnMap />
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
              // Ensure tab content sits above the map
              zIndex: 1,
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
