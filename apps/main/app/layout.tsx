import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import "./fonts.css" // Import Adobe Fonts
import { FontLoader } from "./components/FontLoader"
import ClientDynamicMapProvider from "./components/ClientDynamicMapProvider"

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
        <link
          rel="preconnect"
          href="https://use.typekit.net"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <FontLoader kitId="rxm7kha" />
        <TranslationProvider initialLocale="en">
          <ThemeRegistry>
            <ClientDynamicMapProvider>{children}</ClientDynamicMapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
