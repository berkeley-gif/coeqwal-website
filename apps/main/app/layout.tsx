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
import { PanelTuner, SkipLink } from "@repo/ui"
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
                <Suspense fallback={null}>
                  <ActiveThemePanel />
                </Suspense>

                <TabsProvider>
                  {/* WCAG 2.4.1: SkipLink must be the first focusable element in the DOM */}
                  <SkipLink />

                  {/* WCAG 2.4.3: Header before main content for tab order */}
                  <Suspense fallback={null}>
                    <Header />
                  </Suspense>

                  {children}
                </TabsProvider>

                <PanelTuner />
              </ThemeRegistry>
            </DataProvider>
          </TranslationProvider>
        </StrictMode>
      </body>
    </html>
  )
}
