"use client"

/**
 * Main application entry point
 *
 * Renders the main page with persistent map, header, tabs, and content sections.
 */

import { Suspense } from "react"
import { Box } from "@repo/ui/mui"
import { SkipLink } from "@repo/ui"
import { MapProvider } from "@repo/map"
import { Header } from "./components/Header"
import { FloatingGlossary } from "./features/glossary"
import IntroSection from "./sections/IntroSection"
import PersistentMapWrapper from "./features/map/PersistentMapWrapper"

import { TabsProvider } from "./context/Tabs"
import SmoothTabs from "./components/tabs/SmoothTabs"
import TabPanels from "./components/tabs/TabPanels"

export default function Home() {
  return (
    <>
      {/* WCAG 2.4.1: Skip link MUST be first focusable element in DOM */}
      <SkipLink />

      {/* MapProvider at top level so both the map and overlays can access it */}
      <MapProvider>
        <TabsProvider>
          {/* WCAG 2.4.3: Header MUST come before map in DOM for correct tab order
              Tab order: Skip Link > Header nav > Map controls > Main content */}
          <Header />

          {/* PersistentMapWrapper - renders once, stays mounted across tab switches */}
          <Suspense fallback={null}>
            <PersistentMapWrapper />
          </Suspense>

          <FloatingGlossary />
          {/* WCAG 2.4.1: Skip link target - id required for header skip link */}
          <Box
            component="main"
            id="main-content"
            tabIndex={-1} // Allows focus to move here programmatically
            sx={{
              position: "relative",
              overflowX: "clip",
              overflowY: "visible",
              // Allow pointer events to pass through to the persistent map
              // Child components re-enable pointer events where needed
              pointerEvents: "none",
              // Above map level so content appears on top
              zIndex: (theme) => theme.zIndex.pageContent,
              // Remove focus outline when skip link targets this element
              "&:focus": {
                outline: "none",
              },
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
