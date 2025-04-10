import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { MapProvider } from "@repo/map"
import "./globals.css"
import "./fonts.css" // Import Adobe Fonts
import { FontLoader } from "./components/helpers/FontLoader"

// Font configuration
const FONT_FAMILY = "akzidenz-grotesk-next-pro"
const FONT_VARIABLE = "--font-akzidenz-grotesk-next-pro"

// Font weights for akzidenzNextPro
const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
}

export const metadata: Metadata = {
  title: "How Water Moves through California",
  description: "We have transformed the way how water moves through California",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={FONT_VARIABLE}>
      <body>
        <FontLoader kitId="rxm7kha" />
        <TranslationProvider initialLocale="en">
          <ThemeRegistry fontFamily={FONT_FAMILY} fontWeights={fontWeights}>
            <MapProvider>{children}</MapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
