/**
 * Root Layout - Application root with providers
 *
 * Sets up theme, translations, and font loading for the entire app.
 * StrictMode is enabled in development to catch common issues.
 * See the repo README for more details on StrictMode.
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
    <html lang="en">
      <body>
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
