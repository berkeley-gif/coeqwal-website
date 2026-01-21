/**
 * Root Layout - Application root with providers
 *
 * Sets up theme, translations, and font loading for the entire app.
 *
 * NOTE: StrictMode is temporarily disabled due to react-truncate-markup
 * using deprecated UNSAFE_componentWillReceiveProps lifecycle method.
 * This causes console warnings in strict mode. The library is at v5.1.2
 * (latest) and hasn't been updated to use modern React patterns.
 * Re-enable StrictMode when the library is updated or replaced.
 * See: https://github.com/parsable/react-truncate-markup/issues
 */

// import { StrictMode } from "react"
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
        {/* StrictMode temporarily disabled - see comment at top of file */}
        {/* <StrictMode> */}
        <FontLoader kitId="rxm7kha" />
        <TranslationProvider initialLocale="en">
          <ThemeRegistry>{children}</ThemeRegistry>
        </TranslationProvider>
        {/* </StrictMode> */}
      </body>
    </html>
  )
}
