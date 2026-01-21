/**
 * Root Layout - Application root with providers
 *
 * Sets up theme, translations, and font loading for the entire app.
 */

import { StrictMode } from "react"
import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { FontLoader } from "./components/FontLoader"

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
            <ThemeRegistry>{children}</ThemeRegistry>
          </TranslationProvider>
        </StrictMode>
      </body>
    </html>
  )
}
