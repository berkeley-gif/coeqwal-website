/**
 * Home page entry point.
 *
 * Server Component that renders the home-page structure. The persistent
 * map context (`MapProvider`) is the only home-only client provider, so
 * it is rendered inline here. Layout-level concerns (`SkipLink`, `Header`,
 * `TabsProvider`, theme / translation / data providers) live in
 * `app/layout.tsx` and apply to every route.
 *
 * In Next.js App Router under SSG, any client component that calls
 * `useSearchParams()` must have a Suspense boundary above it. Search
 * params are not available at build time, so the hook suspends until the
 * client hydrates and the real URL is readable.
 */

import { MainContent } from "./components/MainContent"
import { FloatingGlossary } from "./features/glossary"
import IntroSection from "./sections/IntroSection"

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
