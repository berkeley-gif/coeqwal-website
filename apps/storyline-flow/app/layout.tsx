import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { MapProvider } from "@repo/map/client"
import "./fonts.css" // Import Adobe Fonts
import { FontLoader } from "./components/helpers/FontLoader"
import StoryProvider from "./story/StoryProvider"

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
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://use.typekit.net"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <FontLoader kitId="rxm7kha" />
        <TranslationProvider initialLocale="en">
          <ThemeRegistry theme="story">
            <StoryProvider>
              <MapProvider>{children}</MapProvider>
            </StoryProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
