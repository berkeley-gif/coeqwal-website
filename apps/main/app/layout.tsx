import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { MapProvider } from "@repo/map"
import "./globals.css"
import "./fonts.css" // Import Adobe Fonts
import { FontLoader } from "./components/FontLoader"

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Alternative California water solutions",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        {/* Global style to disable scroll snapping */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          html, body, div, main, section, article {
            scroll-snap-type: none !important;
            scroll-snap-align: none !important;
            scroll-snap-stop: normal !important;
          }
        `,
          }}
        />
      </head>
      <body>
        <FontLoader kitId="rxm7kha" />
        <TranslationProvider initialLocale="en">
          <ThemeRegistry>
            <MapProvider>{children}</MapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
