/**
 * Main application entry point
 *
 * This is a Server Component that renders the main page structure.
 * Client components (map, tabs, etc.) are wrapped in ClientProviders
 * to establish the hydration boundary.
 */

import { Suspense } from "react"
import { SkipLink } from "@repo/ui"
import { ClientProviders } from "./components/ClientProviders"
import { MainContent } from "./components/MainContent"
import { DynamicMap } from "./components/DynamicMap"
import { Header } from "./components/Header"
import { FloatingGlossary } from "./features/glossary"
import IntroSection from "./sections/IntroSection"
import SmoothTabs from "./components/tabs/SmoothTabs"
import TabPanels from "./components/tabs/TabPanels"

export default function Home() {
  return (
    <ClientProviders>
      {/* WCAG 2.4.1: Skip link must be first focusable element in DOM */}
      <SkipLink />

      {/* WCAG 2.4.3: Header must come before map in DOM for correct tab order
          Tab order: Skip Link > Header nav > Map controls > Main content */}
      <Header />

      {/* DynamicMap - renders once, stays mounted across tab switches */}
      <DynamicMap />

      <FloatingGlossary />

      {/* WCAG 2.4.1: Skip link target - id required for header skip link */}
      <MainContent>
        <IntroSection />
        {/* Suspense is needed for useSearchParams() */}
        <Suspense fallback={null}>
          <SmoothTabs />
          <TabPanels />
        </Suspense>
      </MainContent>
    </ClientProviders>
  )
}
