/**
 * Main application entry point
 *
 * This is a Server Component that renders the main page structure.
 * Client components (map, tabs, etc.) are wrapped in ClientProviders
 * to establish the hydration boundary.
 *
 * All three suspense boundaries exist because of useSearchParams() from next/navigation.
 * In Next.js App Router, any client component that calls useSearchParams() must have a
 * Suspense boundary above it to avoid hydration errors. With SSG, search params don't
 * exist at build time. They're only available on the client. useSearchParams() suspends
 * until the client hydrates and the actual URL params are readable.
 */
import { Suspense } from "react"
import { SkipLink } from "@repo/ui"
import { ClientProviders } from "./../components/ClientProviders"
import { MainContent } from "./../components/MainContent"
import { DynamicMap } from "./../components/DynamicMap"
import { Header } from "./../components/Header"
import { FloatingGlossary } from "./../features/glossary"
import IntroSection from "./../sections/IntroSection"
import SmoothTabs from "./../components/tabs/SmoothTabs"
import TabPanels from "./../components/tabs/TabPanels"

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <ClientProviders>
      {/* WCAG 2.4.1: Skip link must be first focusable element in DOM */}
      <SkipLink label="Skip to main content" />

      {/* WCAG 2.4.3: Header must come before map in DOM for correct tab order
          Tab order: Skip Link > Header nav > Map controls > Main content */}
      <Suspense fallback={null}>
        <Header />
      </Suspense>

      {/* DynamicMap - renders once, stays mounted across tab switches */}
      <DynamicMap />

      <FloatingGlossary />

      {/* WCAG 2.4.1: Skip link target - id required for header skip link */}
      <MainContent>
        <Suspense fallback={null}>
          <IntroSection />
        </Suspense>
        <Suspense fallback={null}>
          <SmoothTabs />
          <TabPanels />
        </Suspense>
      </MainContent>
    </ClientProviders>
  )
}
