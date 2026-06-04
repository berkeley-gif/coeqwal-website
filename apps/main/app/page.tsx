/**
 * Home page entry point.
 *
 * Server Component that renders the home-page structure. The persistent
 * map context (`MapProvider`) is the only home-only client provider, so
 * it is rendered inline here. Layout-level concerns (`SkipLink`, `Header`,
 * `TabsProvider`, theme / translation / data providers) live in
 * `app/layout.tsx` and apply to every route.
 *
 * Only one Suspense boundary lives here, around `TabPanels`, which reads
 * `?tab=...` via `useSearchParams` in its URL <-> activeTab sync.
 *
 * In Next.js App Router under SSG, any client component that calls
 * `useSearchParams()` must have a Suspense boundary above it. Search
 * params are not available at build time, so the hook suspends until the
 * client hydrates and the real URL is readable.
 */

import { Suspense } from "react"
import { Box } from "@repo/ui/mui"
import { ErrorFallback } from "@repo/ui"
import { ErrorBoundary } from "@repo/utils"
import { MapProvider } from "@repo/map/client"
import { MainContent } from "./components/MainContent"
import { DynamicMap } from "./components/DynamicMap"
import { FloatingGlossary } from "./features/glossary"
import IntroSection from "./sections/IntroSection"
import SmoothTabs from "./components/tabs/SmoothTabs"
import TabPanels from "./components/tabs/TabPanels"

/**
 * Visible fallback shown when `TabPanels` crashes. TabPanels is the
 * main interactive surface (Learn / Explore / Share), so the user
 * needs to know it failed and have a retry path. The wrapper Box
 * keeps the fallback inside the tab strip's normal flow so the page
 * does not jump.
 */
function TabPanelsErrorFallback() {
  return (
    <Box sx={{ minHeight: 320, display: "flex", justifyContent: "center" }}>
      <ErrorFallback
        title="This tab couldn't load"
        message="Something went wrong rendering this section. You can try again or refresh the page."
      />
    </Box>
  )
}

export default function Home() {
  return (
    <>
      <FloatingGlossary />

      {/* WCAG 2.4.1: SkipLink target lives on the <main> element below */}
      <MainContent>
        <IntroSection />
      </MainContent>
    </>
  )
}
