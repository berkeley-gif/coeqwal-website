/**
 * Home page entry point.
 *
 * Server Component that renders the home-page structure. The persistent
 * map context (`MapProvider`) is the only home-only client provider, so
 * it is rendered inline here. Layout-level concerns (`SkipLink`, `Header`,
 * `TabsProvider`, theme / translation / data providers) live in
 * `app/layout.tsx` and apply to every route.
 *
 * The two Suspense boundaries below exist because of `useSearchParams()`:
 *
 *   - `IntroSection` contains `WaterThemesPanel`, which reads `?theme=...`
 *     via `usePanelRoute`.
 *   - `TabPanels` reads `?tab=...` via `useSearchParams` in its URL
 *     <-> activeTab sync (see Effect 1 in `TabPanels.tsx`).
 *
 * In Next.js App Router under SSG, any client component that calls
 * `useSearchParams()` must have a Suspense boundary above it. Search
 * params are not available at build time, so the hook suspends until the
 * client hydrates and the real URL is readable.
 */

import { Suspense } from "react"
import { MapProvider } from "@repo/map/client"
import { MainContent } from "./components/MainContent"
import { DynamicMap } from "./components/DynamicMap"
import { FloatingGlossary } from "./features/glossary"
import IntroSection from "./sections/IntroSection"
import SmoothTabs from "./components/tabs/SmoothTabs"
import TabPanels from "./components/tabs/TabPanels"

export default function Home() {
  return (
    <MapProvider>
      {/* DynamicMap - renders once, stays mounted across tab switches */}
      <DynamicMap />

      <FloatingGlossary />

      {/* WCAG 2.4.1: SkipLink target lives on the <main> element below */}
      <MainContent>
        <Suspense fallback={null}>
          <IntroSection />
        </Suspense>
        <SmoothTabs />
        <Suspense fallback={null}>
          <TabPanels />
        </Suspense>
      </MainContent>
    </MapProvider>
  )
}
