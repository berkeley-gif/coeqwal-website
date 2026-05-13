/**
 * Root layout: Application root with providers.
 *
 * Sets up theme, translations, font loading, the tabs context, the global
 * `Header`, and the `SkipLink` anchor for the entire app.
 *
 * Two Suspense boundaries live here, both for `useSearchParams()` consumers:
 *
 *   - `ActiveThemePanel` reads `?theme=...` to decide whether to render.
 *   - `Header` reads `?theme=...` (via `usePanelRoute`) to highlight the
 *     active theme button in the nav.
 *
 * The Header sits inside `TabsProvider` so it can read the real
 * `isPastHero` value on the home page. On `/data` and `/about`, `useTabs`
 * returns safe defaults regardless, so the same Header markup works there.
 */

import { StrictMode, Suspense } from "react"
import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { DataProvider } from "@repo/data/providers"
import { SkipLink } from "@repo/ui"
import { ErrorBoundary } from "@repo/utils"
import { FontLoader } from "./components/FontLoader"
import { ActiveThemePanel } from "./components/ActiveThemePanel"
import { Header } from "./components/Header"
import { TabsProvider } from "./context/Tabs"

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Alternative California water management scenarios",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // position: relative on html AND body required for Framer Motion useScroll offset calculations
    <html lang="en" style={{ position: "relative" }}>
      <body style={{ position: "relative" }}>
        <StrictMode>
          <FontLoader kitId="rxm7kha" />
          <TranslationProvider initialLocale="en">
            <DataProvider>
              <ThemeRegistry>
                {/* ActiveThemePanel renders only when `?theme=...` is set.
                    Silent null fallback on error keeps the rest of the
                    layout intact; the route-level `app/error.tsx`
                    catches anything fatal that bubbles up. */}
                <ErrorBoundary fallback={null}>
                  <Suspense fallback={null}>
                    <ActiveThemePanel />
                  </Suspense>
                </ErrorBoundary>

                <TabsProvider>
                  {/* WCAG 2.4.1: SkipLink must be the first focusable element in the DOM */}
                  <SkipLink />

                  {/* WCAG 2.4.3: Header before main content for tab order.
                      Silent null fallback on error: a broken Header
                      should not replace the entire navigation bar with
                      an error UI. The rest of the app still works. */}
                  <ErrorBoundary fallback={null}>
                    <Suspense fallback={null}>
                      <Header />
                    </Suspense>
                  </ErrorBoundary>

                  {children}
                </TabsProvider>
              </ThemeRegistry>
            </DataProvider>
          </TranslationProvider>
        </StrictMode>
      </body>
    </html>
  )
}
